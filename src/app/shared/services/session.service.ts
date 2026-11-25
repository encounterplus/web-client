import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, filter, first, timeout } from 'rxjs';
import { DataService } from './data.service';
import { WSEventName } from '../models/wsevent';

/** `GET /api/server`: who the app is, and how guests get in. */
export interface ServerInfo {
  /** Stable across launches and address changes: sign-ins are kept per server id. */
  id: string;
  version: string;
  auth: { guest: GuestEntry };
}

/**
 * How guests get in: `open`, watching without signing in, or `code`, signing in with the guest
 * code. Guests read what players may see and never change anything either way.
 */
export type GuestEntry = 'open' | 'code';

/** Who the client is signed in as: the answer to signing in and to `authenticate`. */
export interface Session {
  role: 'guest' | 'player' | 'gm' | 'integration';
  permissions: string[];
  name?: string;
  player?: { id: string; name: string; color?: string };
  /** A player's characters in the campaign being played; absent for everyone else. */
  characters?: SessionCharacter[];
}

/** A character a player plays: their tokens on the map are this entity's. */
export interface SessionCharacter {
  id: string;
  name: string;
  kind: string;
  detail?: string;
  image?: string;
  icon?: string;
  /** Where a browser opens it: the sheet, else its HTML view. */
  url?: string;
}

/** Access tokens by server id, so a client that knows several servers keeps a sign-in for each. */
const TOKENS_KEY = 'encounterplus.accessTokens';
/** The one token sheets on the app's own origin read (`ep.js`): the contract with the sheet SDK. */
const SHEET_TOKEN_KEY = 'encounterplus.accessToken';
/** Servers whose sign-in the user skipped, so the dialog doesn't open on every visit. */
const SKIPPED_KEY = 'encounterplus.signInSkipped';

/** The code a join link carried, taken from the address before the app started. */
let linkCode: string | null = null;

/**
 * Splits a join link's code off an address: `#code=ABC-DEF` in the fragment, which browsers never
 * send to the server or put in `Referer`. Other fragment parameters stay.
 *
 * @returns The code and the address without it, or `null` when the address carries none.
 */
export function splitLinkCode(href: string): { code: string; href: string } | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const params = new URLSearchParams(url.hash.slice(1));
  const code = params.get('code')?.trim();
  if (code === undefined) {
    return null;
  }
  params.delete('code');
  url.hash = params.toString();
  return { code, href: url.href };
}

/**
 * Takes a join link's code out of the address bar, so it ends up in neither bookmarks nor history,
 * and keeps it for `SessionService` to sign in with. Called before the app starts, so the router
 * never sees it.
 */
export function takeLinkCode() {
  const link = splitLinkCode(window.location.href);
  if (!link) {
    return;
  }
  try {
    window.history.replaceState(window.history.state, '', link.href);
  } catch {
    // the address keeps it; signing in works the same
  }
  linkCode = link.code || null;
}

/**
 * Signing in to the app: whether it supports it, who the client is, and the access token it keeps.
 *
 * A player types a code once per device; the app exchanges it for an access token, which REST
 * requests send as `Authorization: Bearer` and the socket sends in `authenticate` before anything
 * else. An app without sign-in (older than it) answers `GET /api/server` with nothing useful, and
 * the client works as before.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  /** The app, once it said who it is; `null` for an app without sign-in, or not asked yet. */
  readonly server = signal<ServerInfo | null>(null);

  /** Who the client is signed in as; `null` for a guest. */
  readonly session = signal<Session | null>(null);

  readonly supportsSignIn = computed(() => this.server() !== null);
  readonly isSignedIn = computed(() => this.session() !== null);
  readonly isGM = computed(() => this.session()?.role === 'gm');
  /** Whether a client may stay a guest without a code, so the sign-in dialog offers to continue as one. */
  readonly allowsGuests = computed(() => this.server()?.auth.guest !== 'code');

  private requestCounter = 0;

  /** A join link's code, signed in with on the first connection (`signInWithLink`). */
  linkCode: string | null = linkCode;

  constructor(private http: HttpClient, private data: DataService) {
    linkCode = null;
  }

  /** Asks the app who it is. Never fails: anything but a proper answer means no sign-in. */
  async loadServer(): Promise<ServerInfo | null> {
    try {
      const info = await firstValueFrom(this.http.get<ServerInfo>(`${this.data.apiBaseURL}/server`));
      this.server.set(info?.id && info.auth ? info : null);
    } catch {
      this.server.set(null);
    }
    this.data.accessToken = this.accessToken;
    return this.server();
  }

  /** The access token kept for this server, if any. */
  get accessToken(): string | null {
    const id = this.server()?.id;
    return id ? this.tokens()[id] ?? null : null;
  }

  /**
   * Signs the open socket in with the kept token, before anything else is sent. A token the app
   * refuses is forgotten, and the connection stays a guest's.
   *
   * @returns Whether a kept token was refused, so the caller can ask the user to sign in again.
   */
  async authenticateSocket(): Promise<{ refused: boolean }> {
    const token = this.accessToken;
    this.data.accessToken = token;
    if (!this.supportsSignIn() || !token) {
      this.session.set(null);
      return { refused: false };
    }
    try {
      const answer = await this.request(WSEventName.authenticate, { accessToken: token });
      if (answer.name === WSEventName.authenticated) {
        this.session.set(answer.data as Session);
        return { refused: false };
      }
      // requestFailed: unauthenticated — revoked, or a new code
      this.forgetToken(token);
      this.session.set(null);
      return { refused: true };
    } catch {
      // no answer: an app that can't sign in over the socket, or a connection gone meanwhile
      this.session.set(null);
      return { refused: false };
    }
  }

  /**
   * Takes `sessionUpdated`, which the app sends a signed-in player when their characters changed.
   * Ignored when signed out meanwhile.
   */
  updated(session: Session) {
    if (this.session() !== null && session?.role) {
      this.session.set(session);
    }
  }

  /**
   * Signs in with a join link's code, once: the link wins over a sign-in kept for this server,
   * whose token is signed out after the new one is kept — so a link opened on another player's
   * tablet switches it. An app without sign-in drops the code.
   *
   * @returns Whether it signed in, or why not, for people; nothing to do is neither.
   */
  async signInWithLink(): Promise<{ signedIn: boolean; error?: string }> {
    const code = this.linkCode;
    this.linkCode = null;
    if (!code || !this.supportsSignIn()) {
      return { signedIn: false };
    }
    const previous = this.accessToken;
    try {
      await this.signIn(code, 'This link is no longer valid. Ask the GM for a new one.');
    } catch (error) {
      return { signedIn: false, error: (error as Error).message };
    }
    if (previous && previous !== this.accessToken) {
      try {
        await firstValueFrom(this.http.delete(`${this.data.apiBaseURL}/session`, { headers: { Authorization: `Bearer ${previous}` } }));
      } catch {
        // the old device entry stays in the app until the GM removes it
      }
    }
    return { signedIn: true };
  }

  /** Exchanges a code for an access token, and keeps it. Throws a message for people. */
  async signIn(code: string, invalidMessage = "That code isn't valid."): Promise<Session> {
    let answer: Session & { accessToken?: string };
    try {
      answer = await firstValueFrom(this.http.post<Session & { accessToken?: string }>(`${this.data.apiBaseURL}/session`, { code }));
    } catch (error) {
      const status = (error as HttpErrorResponse).status;
      if (status === 401) {
        throw new Error(invalidMessage);
      } else if (status === 429) {
        throw new Error('Too many attempts. Try again in a minute.');
      }
      throw new Error("Couldn't sign in. Check the connection to the app.");
    }
    if (!answer.accessToken) {
      throw new Error("Couldn't sign in.");
    }
    this.keepToken(answer.accessToken);
    const { accessToken, ...session } = answer;
    this.session.set(session);
    this.clearSkipped();
    return session;
  }

  /** Signs this device out: the app forgets the token, and so does the client. */
  async signOut(): Promise<void> {
    const token = this.accessToken;
    if (token) {
      try {
        await firstValueFrom(this.http.delete(`${this.data.apiBaseURL}/session`, { headers: { Authorization: `Bearer ${token}` } }));
      } catch {
        // signed out locally either way
      }
      this.forgetToken(token);
    }
    this.session.set(null);
  }

  /** Whether the user chose to continue as a guest on this server. */
  get skippedSignIn(): boolean {
    const id = this.server()?.id;
    return id ? this.readList(SKIPPED_KEY).includes(id) : false;
  }

  /** Remembers that the user continued as a guest, so the dialog doesn't open again by itself. */
  skipSignIn() {
    const id = this.server()?.id;
    if (id && !this.skippedSignIn) {
      this.write(SKIPPED_KEY, [...this.readList(SKIPPED_KEY), id]);
    }
  }

  // MARK: Storage

  private tokens(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem(TOKENS_KEY) ?? '{}') ?? {};
    } catch {
      return {};
    }
  }

  private keepToken(token: string) {
    const id = this.server()?.id;
    if (!id) {
      return;
    }
    this.write(TOKENS_KEY, { ...this.tokens(), [id]: token });
    this.data.accessToken = token;
    // sheets the app serves on this origin sign in with it too
    if (this.isServedByApp()) {
      this.setItem(SHEET_TOKEN_KEY, token);
    }
  }

  private forgetToken(token: string) {
    const tokens = this.tokens();
    for (const id of Object.keys(tokens)) {
      if (tokens[id] === token) {
        delete tokens[id];
      }
    }
    this.write(TOKENS_KEY, tokens);
    if (this.data.accessToken === token) {
      this.data.accessToken = null;
    }
    try {
      if (localStorage.getItem(SHEET_TOKEN_KEY) === token) {
        localStorage.removeItem(SHEET_TOKEN_KEY);
      }
    } catch {
      // nothing stored
    }
  }

  private clearSkipped() {
    const id = this.server()?.id;
    if (id) {
      this.write(SKIPPED_KEY, this.readList(SKIPPED_KEY).filter((skipped) => skipped !== id));
    }
  }

  /** Whether the client was served by the app it talks to, so it shares an origin with the sheets. */
  private isServedByApp(): boolean {
    return this.data.remoteHost === window.location.host;
  }

  private readList(key: string): string[] {
    try {
      const value = JSON.parse(localStorage.getItem(key) ?? '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  private write(key: string, value: unknown) {
    this.setItem(key, JSON.stringify(value));
  }

  private setItem(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // no storage, as in a private window: signed in until the page closes
    }
  }

  // MARK: Socket requests

  /** Sends a request on the socket and waits for its answer, by `responseId`. */
  private request(name: WSEventName, data: any): Promise<{ name: WSEventName; data: any }> {
    this.requestCounter += 1;
    const requestId = `wc${Date.now().toString(36)}-${this.requestCounter}`;
    const answer = firstValueFrom(this.data.events$.pipe(
      filter((event) => event?.responseId === requestId),
      first(),
      timeout(5000),
    ));
    this.data.send({ name, requestId, data });
    return answer;
  }
}
