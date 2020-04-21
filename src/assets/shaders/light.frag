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
   vec4 darkColor = vec4(0.0, 0.0, 0.0, 0.0);

   if (radiusMin <= 0.0 || radiusMax <= 0.0) {
      discard;
   }

   if (dist >= radiusMax) {
      discard;
      gl_FragColor = darkColor;
   } else {
      // float attenuation = clamp( 10.0 / dist, 0.0, 1.0);
      // calculate attenuation
      float d = dist / radiusMax;
      float attenuation = 1.0 / (falloff.x + (falloff.y * d) + (falloff.z * d * d));
      gl_FragColor = color * attenuation * intensity;
   }
}
