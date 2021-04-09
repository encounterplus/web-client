// precision highp float;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;

uniform vec4 inputSize;
uniform vec4 outputFrame;
uniform float time;

uniform sampler2D texVision;
uniform sampler2D texMap;
// uniform sampler2D texFog;
uniform bool fog;
uniform bool los;
uniform vec2 offs_blur;

void main(void)
{
   if (fog && !los) {
      vec4 vision = texture2D(texVision, vTextureCoord);
      gl_FragColor = vec4(0, 0, 0, 1.0 - vision.r);
   } else if (!fog && los) {
      vec4 vision = texture2D(texVision, vTextureCoord);
      gl_FragColor = vec4(0, 0, 0, 1.0 - vision.a);
   } else {
      vec4 map = texture2D(texMap, vTextureCoord);
      vec4 vision = texture2D(texVision, vTextureCoord);

      float grey = (0.21 * map.r + 0.71 * map.g + 0.07 * map.b) * 0.2;
      float alpha = 1.0 - vision.g;
      vec4 color = vec4(grey * alpha, grey * alpha, grey * alpha, alpha);

      gl_FragColor = mix(color,  vec4(0, 0, 0, alpha), 1.0 - vision.r);
   }
}
