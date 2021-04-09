import { Loader } from "../core/map/models/loader"

export class ProgramManager {
    static cached = new Map<string, PIXI.Program>()

    static async preload() {
        console.debug("preloading shaders")

        // vision
        let visionVert = await Loader.shared.loadResource("/assets/shaders/vision.vert")
        let visionFrag = await Loader.shared.loadResource("/assets/shaders/vision.frag")
        ProgramManager.cached.set("vision", PIXI.Program.from(visionVert.data, visionFrag.data, "vision"))

        // light
        let lightFrag = await Loader.shared.loadResource("/assets/shaders/light.frag")
        ProgramManager.cached.set("light", PIXI.Program.from(visionVert.data, lightFrag.data, "light"))

        // map
        let mapVert = await Loader.shared.loadResource("/assets/shaders/map.vert")
        let mapFrag = await Loader.shared.loadResource("/assets/shaders/map.frag")
        ProgramManager.cached.set("map", PIXI.Program.from(mapVert.data, mapFrag.data, "map"))
        
        // fog
        let fogFrag = await Loader.shared.loadResource("/assets/shaders/fog.frag")
        ProgramManager.cached.set("fog", PIXI.Program.from(mapVert.data, fogFrag.data, "fog"))
    }
}

export class CacheManager {
    static sightPolygon = new Map<string, number[]>()
    static geometryPolygon = new Map<string, number[]>()
}

export class Utils {

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
}