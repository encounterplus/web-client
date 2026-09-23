import * as PIXI from 'pixi.js'
import { Loader } from "../core/map/models/loader"
import visionVert from '../../assets/shaders/vision.vert'
import visionFrag from '../../assets/shaders/vision.frag'
import lightFrag from '../../assets/shaders/light.frag'
import mapVert from '../../assets/shaders/map.vert'
import mapFrag from '../../assets/shaders/map.frag'
import fogFrag from '../../assets/shaders/fog.frag'
import videoVert from '../../assets/shaders/video.vert'
import videoFrag from '../../assets/shaders/video.frag'

// from pixi.js source
type ArrayFixed<T, L extends number> = [ T, ...Array<T> ] & { length: L }

export class ProgramManager {
    static cached = new Map<string, PIXI.GlProgram>()

    static async preload() {
        console.debug("preloading shaders")

        // vision
        // let visionFrag = await Loader.shared.loadResource("/assets/shaders/vision.frag")
        let visionProgram = PIXI.GlProgram.from({vertex: visionVert, fragment: visionFrag})
        ProgramManager.cached.set("vision", visionProgram)

        // light
         let lightProgram = PIXI.GlProgram.from({vertex: visionVert, fragment: lightFrag})
        ProgramManager.cached.set("light", lightProgram)

        // map
        let mapProgram = PIXI.GlProgram.from({vertex: mapVert, fragment: mapFrag})
        ProgramManager.cached.set("map", mapProgram)

        // fog
        let fogProgram = PIXI.GlProgram.from({vertex: mapVert, fragment: fogFrag})
        ProgramManager.cached.set("fog", fogProgram)

        // split video
        let splitVideoProgram = PIXI.GlProgram.from({vertex: videoVert, fragment: videoFrag})
        ProgramManager.cached.set("splitVideo", splitVideoProgram)
    }
}

export class CacheManager {
    static sightPolygon = new Map<string, number[]>()
    static geometryPolygon = new Map<string, number[]>()
}

export class Utils {

    /**
     * The colour this client marks its pointers and messages with, generating and storing one on
     * first use.
     *
     * The app has no notion of a default colour, so any client that has never been through the
     * settings modal picks its own and keeps it.
     */
    static userColor(): string {
        let color = localStorage.getItem("userColor")
        if (!color) {
            color = '#' + (Math.random() * 0xFFFFFF << 0).toString(16)
            localStorage.setItem("userColor", color)
        }
        return color
    }

    /**
     * Replaces the entry carrying the same id, or appends the model when there is none.
     *
     * The app has no `created` event for the objects on a map — a `tokenUpdated` for an id the
     * client has not seen is how a new token arrives — so an update has to cover both.
     */
    static upsertById<T extends { id: string }>(collection: Array<T>, model: T) {
        const index = collection.findIndex(entry => entry.id == model.id)
        if (index > -1) {
            collection[index] = model
        } else {
            collection.push(model)
        }
    }

    static generateUniqueId(parts: number = 2): string {
        const stringArr = [];
        for(let i = 0; i< parts; i++){
          const S4 = (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
          stringArr.push(S4);
        }
        return stringArr.join('-');
    }

    static fitScaleFactor(srcWidth: number, srcHeight: number, dstWidth: number, dstHeight: number): number {
        let srcRatio = srcWidth / srcHeight
        let dstRatio = dstWidth / dstHeight

        if (srcRatio > dstRatio) {
            return dstWidth / srcWidth
        } else {
             return dstHeight / srcHeight
        }
    }

    static brightnessMatrix(b: number): ArrayFixed<number, 20> {
        if(b > 0){
            return [
                1-b, 0, 0, 0, b,
                0, 1-b, 0, 0, b,
                0, 0, 1-b, 0, b,
                0, 0, 0, 1, 0];
        } else {
            return [
                1, 0, 0, 0, b,
                0, 1, 0, 0, b,
                0, 0, 1, 0, b,
                0, 0, 0, 1, 0];
        }
    }
}