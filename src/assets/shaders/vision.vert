// precision mediump float;
// attribute vec2 aVertexPosition;
// attribute vec2 aUvs;

// varying vec2 vTextureCoord;

// uniform mat3 translationMatrix;
// uniform mat3 projectionMatrix;

// void main() {
//     gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
//     vTextureCoord = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0).xy;
// }

// attribute vec2 aVertexPosition;
// attribute vec2 aTextureCoord;

// uniform mat3 projectionMatrix;
// uniform mat3 translationMatrix;
// uniform mat3 uTextureMatrix;

// varying vec2 vTextureCoord;

// void main(void)
// {
//     gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

//     vTextureCoord = (uTextureMatrix * vec3(aTextureCoord, 1.0)).xy;
// }


// ----------

precision mediump float;
attribute vec2 aVertexPosition;
uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
varying vec2 vTextureCoord;

void main(void) 
{
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aVertexPosition;
}