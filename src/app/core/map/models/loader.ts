import * as PIXI from 'pixi.js'
import { Asset } from 'src/app/shared/models/asset';

export interface VideoPlayback {
  loop: boolean
  muted: boolean
  speed: number
  /** Show the first frame and never play — see `Loader.playsVideoAssets`. */
  still: boolean
}

/**
 * One consumer's hold on a shared video. Call `release()` when the view using it goes away; once
 * the last lease is released and nothing reacquires the video for a moment, it is unloaded.
 */
export interface VideoLease {
  source: PIXI.VideoSource
  release(): void
}

interface SharedVideo {
  source: PIXI.VideoSource
  ready: Promise<PIXI.VideoSource>
  count: number
  unloadTimer?: ReturnType<typeof setTimeout>
}

export class Loader {

  private static instance: Loader;

  private constructor() { }

  public static get shared(): Loader {
    if (!Loader.instance) {
      Loader.instance = new Loader();
    }

    return Loader.instance;
  }

  RESOURCE_LOADER_OPTIONS = {
    autoLoad: true,
    autoPlay: false,
    crossOrigin: 'anonymous',
    crossorigin: "anonymous"
  };

  remoteBaseURL: string = "";
  localBaseURL: string = "";

  cache: Map<string, PIXI.Texture> = new Map();

  private videos: Map<string, SharedVideo> = new Map();
  private blockedVideos: Set<HTMLVideoElement> = new Set();

  /**
   * How long an unused video stays loaded. A view redraws by clearing and loading again — a token
   * does on every move — and without this the video would be fetched anew and restart each time.
   */
  videoUnloadDelayMS = 5000;

  async loadTexture(src: string, local: boolean = false): Promise<PIXI.Texture> {
    // fix url base path
    if (local) {
      src = this.localBaseURL + src
    } else {
      src = this.remoteBaseURL + src
    }

    return PIXI.Assets.load(src)
  }

  async loadTextureBase64(name: string, base64string: string): Promise<PIXI.Texture> {
    return PIXI.Assets.load({ alias: name, src: base64string })
  }

  // TOOD: this is not working very well
  async loadVideoTexture(src: string, loadingText: PIXI.Text | null = null, local: boolean = false): Promise<PIXI.Texture> {
    if (loadingText != null) {
      loadingText.text = `Loading video map...`;
    }
    if (local == false && !src.startsWith("blob:")) {
      src = this.remoteBaseURL + src;
    }

    const tex = this.cache.get(src)
    if (tex && tex.source && tex.source.pixelWidth > 0) {
      console.log("video cache hit");
      return tex;
    }
    const video = document.createElement("VIDEO") as HTMLVideoElement;
    video.setAttribute('preload', 'auto');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('playsinline', '');
    video.crossOrigin = "anonymous";

    // revoke object url if necessary
    let lastVideoURL = localStorage.getItem("lastVideoURL");
    if (lastVideoURL) {
      console.log(`revoking object url: ${lastVideoURL}`);
      URL.revokeObjectURL(lastVideoURL);
      localStorage.removeItem("lastVideoURL");
    }

    //video.src = src;
    let videosrcurl: string;

    if (!src.startsWith("blob:")) {
      //const res = await fetch(src);

      //let videosrc = await res.blob();

      // const length = Number(res.headers.get('Content-Length'));
      // const mime = res.headers.get('Content-Type');
      // const arrayBuffer = (length > 0)? new Uint8Array(length) : await res.arrayBuffer() as Uint8Array;
      // if (length > 0) {
      //     const reader = res.body.getReader();
      //     let at = 0;
      //     let pos = 0;
      //     console.log("Downloading video");
      //     while(at < length) {
      //         const {done, value} = await reader.read();
      //         if (done) {
      //             console.log("Finished");
      //             break;
      //         }
      //         // console.log(`Inserting ${value.length} bytes at ${at} (of ${length})`);
      //         arrayBuffer.set(value,at);
      //         at += value.length;
      //         if (Math.trunc(at/length*100) > pos) {
      //             pos = Math.trunc(at/length*100)
      //             loadingText.text = `Loading video map: ${pos}%`;
      //         }
      //     }
      // }
      // console.log("Loading blob...");
      // const videosrc = new Blob([arrayBuffer], { type: mime });
      const maxVideoSize: Number = (parseInt(localStorage.getItem("maxVideoSize") || "200")) * 1024 * 1024;
      const contentSize: Number = await new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        req.open('HEAD', src);
        req.onreadystatechange = () => {
          if (req.readyState == req.HEADERS_RECEIVED) {
            const size = req.getResponseHeader("Content-Length");
            resolve(Number(size));
          }
        }
        req.send();
      });
      if (contentSize > maxVideoSize || contentSize == 0) {
        console.log("Video size exceeds maximum, streaming instead.");
        videosrcurl = src;
      } else {
        const videosrc: Blob = await new Promise((resolve, reject) => {
          const req = new XMLHttpRequest();
          req.open('GET', src);
          let pos = 0;
          req.onprogress = (e) => {
            if (e.lengthComputable && Math.trunc(e.loaded / e.total * 100) > pos) {
              pos = Math.trunc(e.loaded / e.total * 100)
              if (loadingText != null) {
                loadingText.text = `Loading video map: ${pos}%`;
              }
            }
          };
          req.onload = () => resolve(req.response);
          req.responseType = "blob";
          req.send();
        });
        console.log("Setting src to blob url");
        videosrcurl = URL.createObjectURL(videosrc);
        console.log(videosrcurl);
      }
      localStorage.setItem("lastVideoURL", videosrcurl);
    } else {
      console.log("Setting src to existing blob url");
      videosrcurl = src;
    }

    console.log("returning promise");
    return new Promise((resolve, reject) => {
      video.oncanplaythrough = () => {
        console.log(`video size: ${video.videoWidth}x${video.videoHeight}`)

        video.height = video.videoHeight;
        video.width = video.videoWidth;
        video.muted = true;
        video.loop = true;
        video.play();
        const videoSource = new PIXI.VideoSource({ resource: video, autoPlay: false });
        const tex = new PIXI.Texture({ source: videoSource });
        // this.cache.set(src, tex);

        video.oncanplaythrough = null;
        video.onerror = null;

        resolve(tex);

      };
      video.onerror = (e) => {
        console.log("Error " + video.error?.code + " loading video: " + video.error?.message)
        reject();
      }
      video.src = videosrcurl;
      console.log("Loading video");
      video.load();
    });
  }

  // This is better texture loader, but m4v is not supported
  async loadVideoTextureFrom(src: string, local: boolean = false): Promise<PIXI.Texture | null> {

    // if (local == false) {
    //     src = this.remoteBaseURL + src;
    // }
    // let tex = PIXI.Texture.from(src, {resourceOptions: this.RESOURCE_LOADER_OPTIONS});

    // return new Promise((resolve, reject) => {
    //     let base = tex.baseTexture;
    //     if ( base.valid ) resolve(tex);
    //     base.once("loaded", f => resolve(tex));
    //     base.once("error", base => {
    //         console.error(`Failed to load resource ${src}`);
    //         delete PIXI.Loader.shared.resources[base.resource.url];
    //         base.destroy();
    //         // reject(err);
    //         resolve(null);
    //     });
    // });

    return null
  }

  /**
   * Loads a video for an asset, shared by every view that shows the same file the same way.
   *
   * Unlike `loadVideoTexture`, which is built around the one map background (it downloads to a
   * blob and revokes the previous one), this streams from the server — relying on its byte-range
   * support — and keeps one decoder per file, however many tokens show it. Shared copies play in
   * step, which suits ambient effects.
   *
   * Playback settings are part of the key, so the same file at two speeds gets two elements.
   */
  async acquireVideo(src: string, playback: VideoPlayback, local: boolean = false): Promise<VideoLease> {
    const url = local ? this.localBaseURL + src : this.remoteBaseURL + src
    const key = `${url}|${playback.loop}|${playback.muted}|${playback.speed}|${playback.still}`

    let entry = this.videos.get(key)
    if (entry == null) {
      entry = this.createSharedVideo(url, playback)
      this.videos.set(key, entry)

      const created = entry
      created.ready.catch(() => {
        // drop a failed load, so the next acquire tries again rather than reusing the failure
        if (this.videos.get(key) === created) {
          this.videos.delete(key)
          created.source.destroy()
        }
      })
    }
    entry.count += 1
    if (entry.unloadTimer != null) {
      clearTimeout(entry.unloadTimer)
      entry.unloadTimer = undefined
    }

    const shared = entry
    let released = false
    const release = () => {
      if (released) {
        return
      }
      released = true
      shared.count -= 1
      if (shared.count > 0 || this.videos.get(key) !== shared) {
        return
      }
      shared.unloadTimer = setTimeout(() => {
        shared.unloadTimer = undefined
        if (shared.count <= 0 && this.videos.get(key) === shared) {
          this.videos.delete(key)
          this.blockedVideos.delete(shared.source.resource as HTMLVideoElement)
          shared.source.destroy()
        }
      }, this.videoUnloadDelayMS)
    }

    try {
      const source = await shared.ready
      return { source, release }
    } catch (error) {
      release()
      throw error
    }
  }

  private createSharedVideo(url: string, playback: VideoPlayback): SharedVideo {
    const video = document.createElement("video")
    video.crossOrigin = "anonymous"
    video.preload = "auto"
    video.playsInline = true
    video.setAttribute("playsinline", "")
    video.setAttribute("webkit-playsinline", "")
    video.muted = playback.muted
    video.defaultMuted = playback.muted
    video.loop = playback.loop
    video.src = url

    // autoPlay off: pixi's own play() swallows the rejection an autoplay policy produces
    const source = new PIXI.VideoSource({ resource: video, autoPlay: false, autoLoad: false })

    const ready = source.load().then(async () => {
      if (playback.still) {
        // a nudge off zero: some browsers, iOS Safari among them, paint nothing for a video that
        // has never played or seeked, and the seek makes pixi upload the frame (`_onSeeked`)
        video.currentTime = 0.001
      } else {
        video.defaultPlaybackRate = playback.speed
        video.playbackRate = playback.speed
        this.playVideo(video)
      }

      // only now is the source safe to draw — see `decodedFrame`
      await this.decodedFrame(video)
      return source
    })

    return { source, ready, count: 0 }
  }

  /**
   * Resolves once the element holds a frame that WebGL can read, and not merely its metadata.
   *
   * Pixi calls a video source valid as soon as `videoWidth` is known, which is at `loadedmetadata`,
   * before any frame is decoded. Uploading then is a silent no-op in Chrome — it leaves the
   * texture's level 0 undefined — but pixi records the size it meant to allocate all the same. Every
   * later frame therefore takes its `texSubImage2D` path, which Chrome answers with
   *
   *     GL_INVALID_OPERATION: glCopySubTextureCHROMIUM: The destination level of the destination
   *     texture must be defined.
   *
   * and the video is blank from then on: nothing resizes the source again, so the allocation is
   * never retried. Holding the lease back until a frame exists keeps pixi's first upload — which
   * does allocate — from landing in that window. Split-alpha files, twice the size of the picture
   * they draw, are the ones slow enough to lose the race regularly.
   */
  private decodedFrame(video: HTMLVideoElement): Promise<void> {
    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const done = (settle: () => void) => {
        video.removeEventListener("loadeddata", onData)
        video.removeEventListener("seeked", onData)
        video.removeEventListener("error", onError)
        settle()
      }
      const onData = () => {
        if (video.readyState >= video.HAVE_CURRENT_DATA) {
          done(resolve)
        }
      }
      const onError = () => {
        done(() => reject(video.error ?? new Error(`video failed to decode: ${video.src}`)))
      }

      video.addEventListener("loadeddata", onData)
      video.addEventListener("seeked", onData)
      video.addEventListener("error", onError)
      onData()
    })
  }

  /**
   * Whether asset videos play, from the "Play video effects" setting. Off, each shows its first
   * frame instead — the same as the app's Low Power Mode, and a paused element costs no decoding.
   *
   * Separate from `allowVideo`, which is about the map background: that one is a single, often
   * large download, while effects are many small ones that each keep a decoder busy.
   */
  static get playsVideoAssets(): boolean {
    return (localStorage.getItem("playVideoAssets") || "true") == "true"
  }

  /**
   * Starts a video, and if the browser's autoplay policy refuses, tries again on the next click or
   * key press. A muted inline video is normally allowed, but iOS Safari refuses in Low Power Mode,
   * and an unmuted one always needs a gesture.
   */
  private playVideo(video: HTMLVideoElement) {
    video.play().catch(error => {
      if (error?.name != "NotAllowedError") {
        console.warn(`video playback failed: ${video.src}`, error)
        return
      }

      const waiting = this.blockedVideos.size > 0
      this.blockedVideos.add(video)
      if (waiting) {
        return
      }

      const resume = () => {
        document.removeEventListener("pointerdown", resume, true)
        document.removeEventListener("keydown", resume, true)
        const blocked = [...this.blockedVideos]
        this.blockedVideos.clear()
        blocked.forEach(v => this.playVideo(v))
      }
      document.addEventListener("pointerdown", resume, true)
      document.addEventListener("keydown", resume, true)
    })
  }

  async loadResource(src: string): Promise<string> {

    src = this.localBaseURL + src
    const response = await fetch(src)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${src}: ${response.status} ${response.statusText}`);
    }

    return response.text()
  }

  destroy(src: string) {
    PIXI.Assets.unload(src)
    // const loader = PIXI.Loader.shared;
    // if (loader.resources[src]) {
    //     loader.resources[src].texture.destroy(true);
    //     delete loader.resources[src];
    // }
  }
}