import { MapLayer } from './map'
import { tileLayer } from './tile'
import { fullTile, minimalTile } from './testing/fixtures'

describe('tileLayer', () => {

    it('defaults to the object layer when the app leaves the layer out', () => {
        expect(tileLayer(minimalTile())).toBe(MapLayer.object)
    })

    it('reads the layer the app sent', () => {
        expect(tileLayer(fullTile({ layer: MapLayer.map }))).toBe(MapLayer.map)
    })

    it('keeps a layer that is not the default', () => {
        expect(tileLayer(minimalTile({ layer: MapLayer.dm }))).toBe(MapLayer.dm)
    })
})
