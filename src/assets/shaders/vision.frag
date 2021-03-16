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

   if (radiusMin <= 0.0 || radiusMax <= 0.0) {
      discard;
   }

   if (dist >= radiusMax) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      // return;
      // gl_FragColor = mix(intensityColor, color, intensity);
   } else {
      float st = (dist - radiusMin) / (radiusMax - radiusMin);
      if (st <= intensity) {
         float alpha = 1.0 - st;
         // premultiply
         gl_FragColor = vec4(1.0 * alpha, 1.0 * alpha, 1.0 * alpha, alpha);
      } else {
         gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      }
   }
}
