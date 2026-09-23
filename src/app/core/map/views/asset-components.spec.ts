import { Component } from 'src/app/shared/models/component';
import { ColorMatrix, componentFilters, concatColorMatrices, enabledComponents, sampleAnimation, tintMatrix } from './asset-components';

function animation(values: Partial<Component>): Component {
    return { type: "animation.opacity", enabled: true, ...values } as Component
}

/** Applies a colour matrix to an RGBA colour. */
function transform(matrix: ColorMatrix, color: number[]): number[] {
    return [0, 1, 2, 3].map(row =>
        matrix[row * 5] * color[0] + matrix[row * 5 + 1] * color[1] + matrix[row * 5 + 2] * color[2] + matrix[row * 5 + 3] * color[3] + matrix[row * 5 + 4])
}

describe('sampleAnimation', () => {

    it('interpolates linearly over the duration', () => {
        const component = animation({ from: 0, to: 2, duration: 1 })
        expect(sampleAnimation(component, 0)).toBeCloseTo(0)
        expect(sampleAnimation(component, 500)).toBeCloseTo(1)
    })

    it('runs downward when from is above to', () => {
        const component = animation({ from: 1, to: 0, duration: 1 })
        expect(sampleAnimation(component, 250)).toBeCloseTo(0.75)
    })

    it('plays back with autoreverse', () => {
        const component = animation({ from: 0, to: 1, duration: 1, autoreverse: true })
        expect(sampleAnimation(component, 1000)).toBeCloseTo(1)
        expect(sampleAnimation(component, 1500)).toBeCloseTo(0.5)
        expect(sampleAnimation(component, 2250)).toBeCloseTo(0.25)
    })

    it('repeats forever when repeat is unset', () => {
        const component = animation({ from: 0, to: 1, duration: 1 })
        expect(sampleAnimation(component, 1_000_250)).toBeCloseTo(0.25)
    })

    it('finishes after a finite repeat count', () => {
        const component = animation({ from: 0, to: 1, duration: 1, repeat: 2 })
        expect(sampleAnimation(component, 1999)).not.toBeNull()
        expect(sampleAnimation(component, 2000)).toBeNull()
    })

    it('counts a round trip as one repeat', () => {
        const component = animation({ from: 0, to: 1, duration: 1, repeat: 1, autoreverse: true })
        expect(sampleAnimation(component, 1999)).toBeCloseTo(0, 2)
        expect(sampleAnimation(component, 2000)).toBeNull()
    })

    it('plays a repeat count of zero once, as Core Animation does', () => {
        const component = animation({ from: 0, to: 1, duration: 1, repeat: 0 })
        expect(sampleAnimation(component, 999)).not.toBeNull()
        expect(sampleAnimation(component, 1000)).toBeNull()
    })

    it('falls back to the app defaults', () => {
        const component = animation({ to: 1 })
        expect(sampleAnimation(component, 500)).toBeCloseTo(0.5)
        expect(sampleAnimation(animation({ to: 1, duration: 0 }), 500)).toBeCloseTo(0.5)
    })
})

describe('enabledComponents', () => {

    it('drops only the components switched off', () => {
        const on = animation({ enabled: true })
        const off = animation({ enabled: false })
        const unset = animation({ enabled: undefined })
        expect(enabledComponents([on, off, unset])).toEqual([on, unset])
        expect(enabledComponents(undefined)).toEqual([])
    })
})

describe('componentFilters', () => {

    const tint = (color: string): Component => ({ type: "filter.tint", enabled: true, color })
    const hsb = (hue: number, saturation: number, brightness: number): Component =>
        ({ type: "filter.hsb", enabled: true, hue, saturation, brightness })

    it('keeps tints as a tint, with no filter pass', () => {
        const filters = componentFilters([tint("#00FF00"), tint("#FFFFFF")])
        expect(filters.tint).toBe(0x00ff00)
        expect(filters.matrix).toBeNull()
    })

    it('skips an hsb filter that changes nothing', () => {
        const filters = componentFilters([hsb(0, 0, 0)])
        expect(filters.matrix).toBeNull()
    })

    it('folds tints into the matrix once an hsb filter is present', () => {
        const filters = componentFilters([tint("#808080"), hsb(0, 0, 20)])
        expect(filters.tint).toBe(0xffffff)
        const matrix = filters.matrix
        if (matrix == null) {
            fail("expected a colour matrix")
            return
        }
        // tint halves first, then brightness lifts: 0.8 × 0.5 + 0.2
        expect(transform(matrix, [1, 1, 1, 1])[0]).toBeCloseTo(0.8 * (0x80 / 0xff) + 0.2)
    })
})

describe('concatColorMatrices', () => {

    it('applies the first matrix first', () => {
        const half: ColorMatrix = tintMatrix({ type: "filter.tint", enabled: true, color: "#808080" })
        const lift: ColorMatrix = [
            0.8, 0, 0, 0, 0.2,
            0, 0.8, 0, 0, 0.2,
            0, 0, 0.8, 0, 0.2,
            0, 0, 0, 1, 0,
        ]
        const r = 0x80 / 0xff
        expect(transform(concatColorMatrices(half, lift), [1, 1, 1, 1])[0]).toBeCloseTo(0.8 * r + 0.2)
        expect(transform(concatColorMatrices(lift, half), [1, 1, 1, 1])[0]).toBeCloseTo(1.0 * r)
    })
})
