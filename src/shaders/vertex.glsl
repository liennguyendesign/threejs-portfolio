precision highp float;

uniform float uTime;
uniform sampler2D uTexture;

attribute vec3 position;
attribute vec2 uv;

varying float vAlpha;

void main() {
  vec4 tex = texture2D(uTexture, uv);
  float gray = tex.r;

  vec3 transformed = position;
  transformed.xy += (uv - 0.5) * 512.0;
  transformed.z += sin(uTime + uv.x * 10.0) * 10.0 * gray;

  vAlpha = gray;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
