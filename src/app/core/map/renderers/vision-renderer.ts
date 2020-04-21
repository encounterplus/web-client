import * as PIXI from 'pixi.js';
import TYPES = PIXI.TYPES;
import premultiplyTint = PIXI.utils.premultiplyTint;

export class VisionGeometry extends PIXI.Geometry
{
    _buffer: PIXI.Buffer;
    _indexBuffer : PIXI.Buffer;

    constructor(_static = false)
    {
        super();

        this._buffer = new PIXI.Buffer(null, _static, false);

        this._indexBuffer = new PIXI.Buffer(null, _static, true);

        this.addAttribute('aVertexPosition', this._buffer, 2, false, TYPES.FLOAT)
            .addIndex(this._indexBuffer);
    }
}

export class VisionPluginFactory {
    static shaderVert: String;
    static shaderFrag: String;

    static create(options: any): any
    {
        const { vertex, fragment, vertexSize, geometryClass } = (Object as any).assign({
            vertex: this.shaderVert,
            fragment: this.shaderFrag,
            geometryClass: VisionGeometry,
            vertexSize: 2,
        }, options);

        return class BatchPlugin extends PIXI.AbstractBatchRenderer
        {
            constructor(renderer: PIXI.Renderer)
            {
                super(renderer);

                this.shaderGenerator = new PIXI.BatchShaderGenerator(vertex, fragment);
                this.geometryClass = geometryClass;
                this.vertexSize = vertexSize;
            }

            vertexSize: number;

            packInterleavedGeometry(element: any, attributeBuffer: PIXI.ViewableBuffer, indexBuffer: Uint16Array, aIndex: number, iIndex: number) {
                const {
                    uint32View,
                    float32View,
                } = attributeBuffer;

                const p = aIndex / this.vertexSize;
                const indices = element.indices;
                const vertexData = element.vertexData;

                for (let i = 0; i < vertexData.length; i += 2)
                {
                    float32View[aIndex++] = vertexData[i];
                    float32View[aIndex++] = vertexData[i + 1];
                }

                for (let i = 0; i < indices.length; i++)
                {
                    indexBuffer[iIndex++] = p + indices[i];
                }
            }
        };
    }
}

PIXI.Renderer.registerPlugin('vision', VisionPluginFactory.create({}));