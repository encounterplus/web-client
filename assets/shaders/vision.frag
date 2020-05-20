precision highp float;
varying vec2 vTextureCoord;
uniform vec2 position;
uniform float radiusMin;
uniform float radiusMax;
uniform vec4 color;
uniform float intensity;
uniform vec3 falloff;

varying mat3 projection;
varying mat3 translation;

void main(void)
{
   vec2 uv = vTextureCoord;
   vec2 center = position;

   float dist = length(center - uv);
   vec4 intensityColor = vec4(1.0,1.0,1.0, intensity);
   vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
   
   vec4 finalColor = color * intensityColor;
   finalColor.rgb /= finalColor.a;

   if (radiusMin <= 0.0 || radiusMax <= 0.0) {
      // gl_FragColor = finalColor;
      // return;
      discard;
   }

   if (dist >= radiusMax) {
      discard;
   } else {
      float st = (dist - radiusMin) / (radiusMax - radiusMin);
      vec4 adjustedColor = vec4(1.0,1.0,1.0, st);
      if (st <= intensity) {
         finalColor = mix(intensityColor, color, st);
         finalColor.rgb /= finalColor.a;
         gl_FragColor = finalColor;
      } else {
         gl_FragColor = finalColor;
      }
   }
}
