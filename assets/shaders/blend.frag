precision highp float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform sampler2D texVision;
uniform sampler2D texFog;

void main(void)
{
   vec4 vision = texture2D(texVision, vTextureCoord);
   vec4 fog = texture2D(texFog, vTextureCoord);

   if (vision.a > fog.r) {
      gl_FragColor = vec4(vision.a, vision.a, vision.a, 1.0);
   } else {
      gl_FragColor = vec4(fog.r, fog.r, fog.r, 1.0);
   }
}
