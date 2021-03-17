precision highp float;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;

uniform vec4 inputSize;
uniform vec4 outputFrame;
uniform float time;

uniform sampler2D texVision;
uniform sampler2D texMap;
uniform sampler2D texFog;
uniform bool fog;
uniform bool los;

void main(void)
{
   if (fog && !los) {
      vec4 fog = texture2D(texFog, vTextureCoord);
      gl_FragColor = vec4(0, 0, 0, 1.0 - fog.r);
   } else if (!fog && los) {
      vec4 vision = texture2D(texVision, vTextureCoord);
      gl_FragColor = vec4(0, 0, 0, 1.0 - vision.a);
   } else {
      vec4 vision = texture2D(texVision, vTextureCoord);
      vec4 map = texture2D(texMap, vTextureCoord);
      vec4 fog = texture2D(texFog, vTextureCoord);

      float grey = (0.21 * map.r + 0.71 * map.g + 0.07 * map.b) * 0.2;
      float alpha = 1.0 - vision.a;
      vec4 color = vec4(grey * alpha, grey * alpha, grey * alpha, alpha);

      gl_FragColor = mix(color,  vec4(0, 0, 0, alpha), 1.0 - fog.r);
   }
}
