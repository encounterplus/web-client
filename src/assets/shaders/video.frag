in vec2 vTextureCoord;
in vec2 vVideoCoord;
out vec4 finalColor;
uniform sampler2D uVideoTexture;

void main() {
   vec2 colorCoord = vec2(vVideoCoord.x, vVideoCoord.y * 0.5);
   vec2 alphaCoord = vec2(vVideoCoord.x, 0.5 + vVideoCoord.y * 0.5);

   vec4 color = texture(uVideoTexture, colorCoord);
   float alpha = texture(uVideoTexture, alphaCoord).r;

   finalColor = color * alpha;
}