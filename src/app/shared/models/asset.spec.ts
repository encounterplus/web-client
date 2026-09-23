import { AssetParameters, AssetLayout, AssetVideo } from './asset'
import { fullAsset, minimalAsset, videoAsset } from './testing/fixtures'

/**
 * Asset parameters arrive as free-form JSON, so the app can send a value of the wrong type where
 * the model declares a number. The readers guard against that, and this lets a spec reach those
 * guards without a cast at every call.
 */
function loose(values: { [key: string]: any }): AssetParameters {
    return values
}

describe('AssetLayout', () => {

    describe('scale', () => {

        it('is 1 when the asset, its parameters or the scale are absent', () => {
            expect(AssetLayout.scale(null)).toBe(1)
            expect(AssetLayout.scale(undefined)).toBe(1)
            expect(AssetLayout.scale(minimalAsset())).toBe(1)
            expect(AssetLayout.scale(fullAsset({ parameters: {} }))).toBe(1)
        })

        it('reads a positive scale', () => {
            expect(AssetLayout.scale(fullAsset({ parameters: { scale: 1.5 } }))).toBe(1.5)
        })

        it('ignores a scale that is not a usable number', () => {
            expect(AssetLayout.scale(fullAsset({ parameters: { scale: 0 } }))).toBe(1)
            expect(AssetLayout.scale(fullAsset({ parameters: { scale: -2 } }))).toBe(1)
            expect(AssetLayout.scale(fullAsset({ parameters: { scale: NaN } }))).toBe(1)
            expect(AssetLayout.scale(fullAsset({ parameters: loose({ scale: "2" }) }))).toBe(1)
        })
    })

    describe('offset', () => {

        it('is centred when the asset or its parameters are absent', () => {
            expect(AssetLayout.offset(null)).toEqual({ x: 0, y: 0 })
            expect(AssetLayout.offset(minimalAsset())).toEqual({ x: 0, y: 0 })
        })

        it('reads each axis on its own', () => {
            expect(AssetLayout.offset(fullAsset({ parameters: { offsetX: 25 } }))).toEqual({ x: 25, y: 0 })
            expect(AssetLayout.offset(fullAsset({ parameters: { offsetY: -10 } }))).toEqual({ x: 0, y: -10 })
        })

        it('ignores an offset that is not a finite number', () => {
            expect(AssetLayout.offset(fullAsset({ parameters: loose({ offsetX: "x", offsetY: Infinity }) }))).toEqual({ x: 0, y: 0 })
        })
    })
})

describe('AssetVideo', () => {

    describe('isVideo', () => {

        it('is true only for a video asset that carries a resource', () => {
            expect(AssetVideo.isVideo(videoAsset())).toBe(true)
            expect(AssetVideo.isVideo(videoAsset({ resource: undefined }))).toBe(false)
            expect(AssetVideo.isVideo(minimalAsset())).toBe(false)
            expect(AssetVideo.isVideo(null)).toBe(false)
            expect(AssetVideo.isVideo(undefined)).toBe(false)
        })

        it('narrows the asset to one with a resource', () => {
            const asset = videoAsset()
            if (AssetVideo.isVideo(asset)) {
                // the point of the predicate: `resource` reads as a string, not `string | undefined`
                expect(asset.resource.length).toBeGreaterThan(0)
            } else {
                fail("expected a video asset")
            }
        })
    })

    describe('isSplitAlpha', () => {

        it('is true only when the app set the alpha flag', () => {
            expect(AssetVideo.isSplitAlpha(videoAsset({ parameters: { alpha: true } }))).toBe(true)
            expect(AssetVideo.isSplitAlpha(videoAsset())).toBe(false)
            expect(AssetVideo.isSplitAlpha(videoAsset({ parameters: { alpha: false } }))).toBe(false)
            expect(AssetVideo.isSplitAlpha(minimalAsset({ parameters: { alpha: true } }))).toBe(false)
        })
    })

    describe('layout', () => {

        it('is horizontal unless the app said vertical', () => {
            expect(AssetVideo.layout(videoAsset())).toBe("horizontal")
            expect(AssetVideo.layout(videoAsset({ parameters: { alphaLayout: "horizontal" } }))).toBe("horizontal")
            expect(AssetVideo.layout(videoAsset({ parameters: { alphaLayout: "vertical" } }))).toBe("vertical")
        })
    })

    describe('loops and muted', () => {

        it('default to true when the app leaves them out', () => {
            expect(AssetVideo.loops(videoAsset())).toBe(true)
            expect(AssetVideo.muted(videoAsset())).toBe(true)
        })

        it('read false back', () => {
            expect(AssetVideo.loops(videoAsset({ parameters: { loop: false } }))).toBe(false)
            expect(AssetVideo.muted(videoAsset({ parameters: { muted: false } }))).toBe(false)
        })
    })

    describe('speed', () => {

        it('is 1 when absent or not a usable number', () => {
            expect(AssetVideo.speed(videoAsset())).toBe(1)
            expect(AssetVideo.speed(videoAsset({ parameters: { speed: NaN } }))).toBe(1)
            expect(AssetVideo.speed(videoAsset({ parameters: loose({ speed: "2" }) }))).toBe(1)
        })

        it('clamps to the supported range', () => {
            expect(AssetVideo.speed(videoAsset({ parameters: { speed: 2 } }))).toBe(2)
            expect(AssetVideo.speed(videoAsset({ parameters: { speed: 0 } }))).toBe(AssetVideo.speedRange[0])
            expect(AssetVideo.speed(videoAsset({ parameters: { speed: 100 } }))).toBe(AssetVideo.speedRange[1])
            expect(AssetVideo.speed(videoAsset({ parameters: { speed: -5 } }))).toBe(AssetVideo.speedRange[0])
        })
    })

    describe('colorRect and alphaRect', () => {

        it('take the whole frame, with no mask, for an opaque video', () => {
            expect(AssetVideo.colorRect(videoAsset())).toEqual([0, 0, 1, 1])
            expect(AssetVideo.alphaRect(videoAsset())).toBeNull()
        })

        it('split left and right for a horizontal split-alpha video', () => {
            const asset = videoAsset({ parameters: { alpha: true } })
            expect(AssetVideo.colorRect(asset)).toEqual([0, 0, 0.5, 1])
            expect(AssetVideo.alphaRect(asset)).toEqual([0.5, 0, 0.5, 1])
        })

        it('split top and bottom for a vertical split-alpha video', () => {
            const asset = videoAsset({ parameters: { alpha: true, alphaLayout: "vertical" } })
            expect(AssetVideo.colorRect(asset)).toEqual([0, 0, 1, 0.5])
            expect(AssetVideo.alphaRect(asset)).toEqual([0, 0.5, 1, 0.5])
        })
    })
})
