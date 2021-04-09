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
   vec4 intensityColor = vec4(0, 0, 0, intensity);
   vec4 color = vec4(0, 0, 0, 1);
   
   vec4 finalColor = color * intensityColor;

   if (radiusMin <= 0.0 && radiusMax <= 0.0) {
      if (intensity > 0.0) {
         gl_FragColor = vec4(1.0 * intensity, 1.0, 0.0, intensity);
      } else {
         discard;
      } 
      return;
   }

   if (dist >= radiusMax) {
      gl_FragColor = vec4(1.0 * intensity, 1.0, 0.0, intensity);
   } else {
      float st = 1.0 - ((dist - radiusMin) / (radiusMax - radiusMin));
      if (st <= intensity) {
         gl_FragColor = vec4(1.0 * intensity, 1.0, 0.0, intensity);
      } else {
         gl_FragColor = vec4(1.0 * st, 1.0, 0.0, st);
      }
   }
}
