import { Size } from './token'

describe('Size.toGridSize', () => {

    it('treats an empty size as one square', () => {
        expect(Size.toGridSize("")).toEqual({ width: 1, height: 1 })
    })

    it('reads an explicit WxH size', () => {
        expect(Size.toGridSize("3x2")).toEqual({ width: 3, height: 2 })
    })

    it('maps the named sizes', () => {
        expect(Size.toGridSize(Size.tiny)).toEqual({ width: 1, height: 1 })
        expect(Size.toGridSize(Size.small)).toEqual({ width: 1, height: 1 })
        expect(Size.toGridSize(Size.medium)).toEqual({ width: 1, height: 1 })
        expect(Size.toGridSize(Size.large)).toEqual({ width: 2, height: 2 })
        expect(Size.toGridSize(Size.huge)).toEqual({ width: 3, height: 3 })
        expect(Size.toGridSize(Size.gargantuan)).toEqual({ width: 4, height: 4 })
        expect(Size.toGridSize(Size.colossal)).toEqual({ width: 6, height: 6 })
    })

    it('falls back to one square for an unknown size', () => {
        expect(Size.toGridSize("whatever")).toEqual({ width: 1, height: 1 })
    })
})
