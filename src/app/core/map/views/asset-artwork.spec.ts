import { Asset } from 'src/app/shared/models/asset';
import { resolveLayout } from './asset-artwork';

function asset(parameters: { [key: string]: any } = {}): Asset {
    return { id: "a", type: "image", resource: "a.png", parameters } as Asset
}

describe('resolveLayout', () => {

    it('stretches to the frame, centred, by default', () => {
        const layout = resolveLayout({ width: 100, height: 50 }, { width: 10, height: 10 }, asset())
        expect(layout.width).toBe(100)
        expect(layout.height).toBe(50)
        expect(layout.anchor).toEqual({ x: 0.5, y: 0.5 })
    })

    it('keeps proportions with aspectFit', () => {
        const layout = resolveLayout({ width: 100, height: 100, fit: "aspectFit" }, { width: 200, height: 100 }, asset())
        expect(layout.width).toBeCloseTo(100)
        expect(layout.height).toBeCloseTo(50)
    })

    it('multiplies the object scale with the asset scale', () => {
        const layout = resolveLayout({ width: 100, height: 100, scale: 2 }, { width: 10, height: 10 }, asset({ scale: 1.5 }))
        expect(layout.width).toBeCloseTo(300)
        expect(layout.height).toBeCloseTo(300)
    })

    it('shifts the anchor by the offset percentage', () => {
        const layout = resolveLayout({ width: 100, height: 100, anchor: { x: 0, y: 0.5 } }, { width: 10, height: 10 }, asset({ offsetX: 25, offsetY: -10 }))
        expect(layout.anchor.x).toBeCloseTo(0.25)
        expect(layout.anchor.y).toBeCloseTo(0.4)
    })

    it('ignores invalid scales and offsets', () => {
        const layout = resolveLayout({ width: 100, height: 100, scale: -1 }, { width: 10, height: 10 }, asset({ scale: 0, offsetX: "x" }))
        expect(layout.width).toBe(100)
        expect(layout.anchor).toEqual({ x: 0.5, y: 0.5 })
    })

    it('works without an asset', () => {
        const layout = resolveLayout({ width: 40, height: 20 }, { width: 10, height: 10 }, null)
        expect(layout.width).toBe(40)
        expect(layout.height).toBe(20)
    })
})
