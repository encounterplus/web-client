precision highp float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform vec4 inputSize;
uniform vec4 outputFrame;
uniform float time;

uniform sampler2D texVision;
uniform sampler2D texFog;
uniform bool exploration;

void main(void)
{
   vec2 uv = vTextureCoord;
   
   vec4 vision = texture2D(texVision, vTextureCoord);
   vec4 fog = texture2D(texFog, vTextureCoord);

   if (exploration) {
      if (vision.a > fog.r) {
            gl_FragColor = vec4(vision.a, vision.a, 0, 1.0);
         } else {
            gl_FragColor = vec4(fog.r, vision.a, 0, 1.0);
         }
   } else {
      gl_FragColor = vec4(fog.r, vision.a, 0, 1.0);
   }
}
