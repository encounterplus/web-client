// Draws a video frame that may carry its alpha channel in one half — see SplitAlphaVideo.
//
// A port of the app's AlphaVideoShaders.metal, minus the YCbCr conversion: the browser hands the
// frame over as RGB, already range-expanded, so the alpha mask is read straight from red. Repeating
// the Metal shader's (a - 16/255) * 255/219 here would expand it twice and harden soft edges.

in vec2 vUV;
out vec4 finalColor;

uniform sampler2D uVideoTexture;
uniform vec4 uColorRect;   // x, y, width, height in unit coordinates of the frame
uniform vec4 uAlphaRect;   // ignored unless uHasAlpha
uniform vec2 uTexel;       // 1 / frame size in pixels
uniform float uHasAlpha;
uniform vec4 uColor;       // pixi's premultiplied tint and world alpha

// Maps a unit coordinate into one half of the frame, kept half a texel clear of the seam.
// Without the inset, a linear sample at the inside edge of the colour half reaches into the alpha
// half — a bright or dark fringe down the middle of everything drawn.
vec2 packedCoord(vec2 uv, vec4 rect) {
    vec2 p = rect.xy + uv * rect.zw;
    return clamp(p, rect.xy + uTexel * 0.5, rect.xy + rect.zw - uTexel * 0.5);
}

void main() {
    vec3 rgb = texture(uVideoTexture, packedCoord(vUV, uColorRect)).rgb;

    float alpha = 1.0;
    if (uHasAlpha > 0.5) {
        alpha = texture(uVideoTexture, packedCoord(vUV, uAlphaRect)).r;
    }

    // premultiplied, as pixi blends
    finalColor = vec4(rgb * alpha, alpha) * uColor;
}
