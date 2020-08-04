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
   // finalColor.rgb /= finalColor.a; // premultiply alpha not needed

   if (radiusMin <= 0.0 || radiusMax <= 0.0) {
      discard;
   }

   if (dist >= radiusMax) {
      gl_FragColor = mix(intensityColor, color, intensity);
   } else {
      float st = (dist - radiusMin) / (radiusMax - radiusMin);
      if (st <= intensity) {
         gl_FragColor = mix(intensityColor, color, st);
      } else {
         gl_FragColor = mix(intensityColor, color, intensity);;
      }
   }
}
