<p align="center">
  <img src="src/assets/img/icon.png" alt="Encounter+" width="128">
</p>

# Web Client for Encounter+

A browser client for the [Encounter+](https://encounter.plus) virtual tabletop app. Encounter+ serves this client to players' browsers, TVs and table displays. The client shows the current map, tokens, lighting and fog of war, the initiative order and the chat. Everything updates live over a WebSocket. Depending on how the host has set up the screen, players can also move their tokens, ping the map and send messages.

## Environment

| | Version |
|---|---|
| Angular (CLI, core, build) | 22.1 |
| TypeScript | 6.0 |
| PixiJS | 8.21 |
| pixi-viewport | 6.0 |
| RxJS | 7.8 |
| Bootstrap / ng-bootstrap | 5.3 / 21 |
| Tests | Karma 6 + Jasmine 5 |

The app is **zoneless**: it uses `provideZonelessChangeDetection()`, loads no `zone.js`, and relies on signals for reactive UI state. It builds with the `application` builder (esbuild). Components are declared in `AppModule` (`standalone: false`).

## Installing

```
npm ci
```

The scripts below call the Angular CLI through `npm run`, so you don't need a global `ng`.

## Development server

```
npm start
```

This starts a dev server at `http://localhost:4200/`. Point it at a running Encounter+ instance with the `remoteHost` query parameter:

```
http://localhost:4200/?remoteHost=192.168.1.10:8080
```

### Query parameters

| Parameter | Values | Effect |
|---|---|---|
| `remoteHost` | `host:port` | Encounter+ server to connect to. Falls back to the last host that connected successfully, then to `window.location.host`. |
| `viewMode` | `player` (default), `dm`, `spectator` | Controls which content is visible. |
| `runMode` | `normal`, `tv` | `tv` hides the interactive chrome, such as the zoom controls. Defaults to `tv` when `device` is set. |
| `device` | e.g. `gameboard` | Marks a dedicated display device. `gameboard` also applies a 1.5× viewport scale. |
| `interactions` | `all` | Enables every interaction, whatever the screen settings say. |

User preferences (max FPS, video playback, name, selected token, open panel) are kept in `localStorage`.

## Architecture

```
src/app
├── app.component.*        root component: connection, event dispatch, app-wide signals
├── app.module.ts          declarations + zoneless / HttpClient providers
├── core/
│   ├── map/               PixiJS rendering (see below)
│   ├── toolbar/, zoombar/ on-screen controls
│   ├── initiative-list/, combatant/
│   ├── message-list/, message/
│   ├── overlay/, image-handout/, lightbox/, paused/
│   └── *-modal/           settings, about, entity (ng-bootstrap modals)
└── shared/
    ├── models/            data models mirroring the Encounter+ API (map, token, tile, light, wall, …)
    ├── services/          DataService (HTTP + WebSocket), ToastService
    └── utils.ts
```

### Data flow

1. **Bootstrap.** `AppComponent` reads the query parameters into `AppState` and configures `DataService` with the remote host.
2. **Initial load.** `DataService.getData()` fetches the full state (`ApiData`) from `GET /api`.
3. **Live updates.** `DataService.connect()` opens a WebSocket to `/ws` that reconnects automatically. Incoming `WSEvent`s (`WSEventName` lists them: `mapLoaded`, `tokenMoved`, `fogUpdated`, `gameUpdated`, `messageCreated`, …) go to `AppComponent.handleEvent`. That method updates `AppState` and the Angular signals (`game`, `messages`, `screen`, `paused`), then forwards map changes to `MapComponent`.
4. **Outgoing events.** Player actions, such as moving a token, pinging or sending a message, go back to the server as `WSEvent`s through `DataService.send`.

The Angular UI (initiative, chat, toolbar, overlays) renders from signals. The map runs its own PixiJS ticker outside Angular change detection. In development builds, `provideCheckNoChangesConfig({ exhaustive: true })` flags any Pixi callback that changes Angular-rendered state without going through a signal.

### Map rendering (`core/map`)

`MapComponent` creates the `PIXI.Application` and a `pixi-viewport` `Viewport` for pan and zoom. The viewport holds a `MapContainer`, which stacks one **layer** (`layers/`) for each kind of content, listed here from bottom to top:

```
mapLayer: background → bottom tiles → grid → middle tiles → top tiles → drawings
lights → paths → auras → area effects → measurements → markers
monsters → vision / fog → effects → players → overlay
```

- **Layers** (`layers/*-layer.ts`) own a collection of models and manage their views.
- **Views** (`views/*-view.ts`) draw a single object: a token, tile, aura, marker, area effect, measurement or pointer. `asset-artwork` / `asset-sprite` / `split-alpha-video` handle image and video assets.
- **Models** (`models/`) cover grid geometry (`square-grid`, `hex-grid`) and the shared asset `Loader`.
- **Renderers** (`renderers/vision-renderer.ts`) compute line of sight and fog from walls, lights and token sight.
- `TrackedObjectsContainer` shows tracked objects (physical tokens and pointers that a touch-enabled table display reports).

## Build

```
npm run build          # development build
npm run build:prod     # production build → dist/web-client/browser
npm run package        # production build + zip → dist/web-client.zip
```

`dist/web-client.zip` is the archive Encounter+ imports. `node scripts/package.mjs` packs an existing production build without rebuilding.

## Releasing

`package.json` owns the version; `src/manifest.json` follows it. Bump both and tag in one step, then push:

```
npm version 0.9.18
git push --follow-tags
```

The tag triggers the Release workflow (`.github/workflows/release.yml`). It builds with the production configuration and publishes `web-client.zip` and `manifest.json` as a GitHub release titled `v0.9.18`. A pre-release suffix (`npm version 0.9.18-beta`) publishes a pre-release; Encounter+ lists it but never offers it as an update. The workflow refuses to release when the tag, `package.json` and `src/manifest.json` disagree.

To rebuild an existing release, run the Release workflow manually with its tag. The assets are replaced.

## Tests

```
npm test               # Karma in watch mode
npm run test:ci        # single run
```

Specs sit next to the code they cover (`*.spec.ts`). `core/map/testing/` and `shared/models/testing/` hold stubs and fixtures.
