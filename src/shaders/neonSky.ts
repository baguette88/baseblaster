export const basicVertex = `
precision highp float;
attribute vec3 position;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const neonSkyFragment = `
precision highp float;
uniform float uTime;
void main() {
  vec2 uv = gl_FragCoord.xy / vec2(1920.0, 1080.0);
  float t = uTime * 0.05;
  float y = uv.y;
  vec3 top = vec3(0.02, 0.01, 0.06);
  vec3 mid = vec3(0.10, 0.0, 0.20);
  vec3 bot = vec3(0.48, 0.17, 0.94);
  vec3 col = mix(mix(bot, mid, smoothstep(0.0, 0.6, y)), top, smoothstep(0.3, 1.0, y));
  col += 0.05 * sin(uv.y * 12.0 + t) * vec3(0.2, 0.6, 1.0);
  float scan = 0.06 * sin(uv.y * 1100.0 + t * 20.0);
  col -= scan;
  gl_FragColor = vec4(col, 1.0);
}
`;
