precision mediump float;

varying vec2 vTextureCoord;
varying vec4 vColor;
// varying vec3 vPos;

uniform sampler2D uSampler;
uniform vec2 position;
uniform float radiusMin;
uniform float radiusMax;
uniform vec4 color;
uniform float intensity;

varying mat3 projection;
varying mat3 translation;

void main(void)
{
   // gl_FragColor = vec4(vTextureCoord.x, vTextureCoord.y, 0.0, 1.0);
   // return;

   vec2 uv = vTextureCoord;
   vec2 center = position;

   float dist = length(center - uv);

   // if (dist <= 100.0) {
   //    // If within diamond, turn purple
   //    gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
   // }

   vec4 intensityColor = vec4(1.0,1.0,1.0, intensity);
   vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
   
   vec4 finalColor = color * intensityColor;
   finalColor.rgb /= finalColor.a;

   if (radiusMin <= 0.0 || radiusMax <= 0.0) {
      gl_FragColor = finalColor;
      return;
   }

   if (dist >= radiusMax) {
      gl_FragColor = finalColor;
      return;
   } else {
      float st = (dist - radiusMin) / (radiusMax - radiusMin);
      vec4 adjustedColor = vec4(1.0,1.0,1.0, st);
      if (st <= intensity) {
         finalColor = color * adjustedColor;
         finalColor.rgb /= finalColor.a;
         gl_FragColor = finalColor;
      } else {
         gl_FragColor = finalColor;
      }
   }
}
