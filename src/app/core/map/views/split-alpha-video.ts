import * as PIXI from 'pixi.js'
import { Asset, AssetVideo, VideoAsset } from 'src/app/shared/models/asset';
import { ProgramManager } from 'src/app/shared/utils';
import { Loader, VideoLease } from '../models/loader';

/**
 * A video asset drawn on the map, transparent when the file is split alpha.
 *
 * A split-alpha file carries colour in one half of every frame and a greyscale alpha mask in the
 * other (see `AssetVideo`). One shader draws both that and a plain opaque video, reading the
 * halves by unit rectangle — the same scheme as the app's `AlphaVideoLayer`.
 *
 * Built as a mesh rather than a filtered sprite: a filter's coordinates follow its on-screen
 * bounds, so a sprite that is partly off-screen samples the wrong part of the frame.
 *
 * Sized and placed like a sprite whose texture is the colour half: `width` and `height` scale it,
 * and `anchor` works as on a sprite, defaulting to the top-left corner. `tint` and `alpha` apply
 * as usual.
 *
 * The video is shared with every other view showing the same file; `destroy()` gives it back.
 */
export class SplitAlphaVideo extends PIXI.Mesh<PIXI.Geometry, PIXI.Shader> {

    /** The drawn size of the video at scale 1: its colour half, not the whole frame. */
    readonly naturalWidth: number
    readonly naturalHeight: number

    /**
     * The point of the video placed at its position, in unit coordinates, as on `PIXI.Sprite`.
     *
     * Implemented as a pivot over the centred geometry, which leaves the bounds — and so `width`
     * and `height` — untouched.
     */
    readonly anchor: PIXI.ObservablePoint

    private lease: VideoLease | null

    static async create(asset: VideoAsset): Promise<SplitAlphaVideo> {
        const lease = await Loader.shared.acquireVideo(asset.resource, {
            loop: AssetVideo.loops(asset),
            muted: AssetVideo.muted(asset),
            speed: AssetVideo.speed(asset),
            still: !Loader.playsVideoAssets,
        })
        return new SplitAlphaVideo(asset, lease)
    }

    private constructor(asset: Asset, lease: VideoLease) {
        const source = lease.source
        const colorRect = AssetVideo.colorRect(asset)
        const alphaRect = AssetVideo.alphaRect(asset)

        const width = source.pixelWidth * colorRect[2]
        const height = source.pixelHeight * colorRect[3]
        const hw = width / 2
        const hh = height / 2

        // `aPosition` by name: pixi computes a geometry's bounds from it, which `width` needs
        const geometry = new PIXI.Geometry({
            attributes: {
                aPosition: new Float32Array([-hw, -hh, hw, -hh, hw, hh, -hw, hh]),
                aUV: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
            },
            indexBuffer: new Uint32Array([0, 1, 2, 0, 2, 3]),
        })

        const shader = new PIXI.Shader({
            glProgram: ProgramManager.cached.get("splitVideo")!,
            resources: {
                uVideoTexture: source,
                uVideoSampler: source.style,
                videoUniforms: {
                    uColorRect: { value: new Float32Array(colorRect), type: 'vec4<f32>' },
                    uAlphaRect: { value: new Float32Array(alphaRect ?? [0, 0, 0, 0]), type: 'vec4<f32>' },
                    uTexel: { value: new Float32Array([1 / source.pixelWidth, 1 / source.pixelHeight]), type: 'vec2<f32>' },
                    uHasAlpha: { value: alphaRect != null ? 1 : 0, type: 'f32' },
                },
            },
        })

        super({ geometry, shader })

        this.naturalWidth = width
        this.naturalHeight = height
        this.lease = lease

        const applyAnchor = () => {
            this.pivot.set((this.anchor.x - 0.5) * width, (this.anchor.y - 0.5) * height)
        }
        this.anchor = new PIXI.ObservablePoint({ _onUpdate: applyAnchor }, 0, 0)
        applyAnchor()
    }

    get video(): HTMLVideoElement | null {
        return this.lease?.source.resource as HTMLVideoElement ?? null
    }

    override destroy(options?: PIXI.DestroyOptions) {
        // the mesh leaves its geometry and shader alive; neither is shared, the video source is
        const geometry = this.geometry
        const shader = this.shader

        super.destroy(options)

        geometry?.destroy()
        shader?.destroy()
        this.lease?.release()
        this.lease = null
    }
}
