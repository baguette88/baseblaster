export const hologramFragment = `
precision highp float;
uniform float uTime;
void main() {
  vec2 uv = gl_FragCoord.xy / vec2(1920.0, 1080.0);
  float t = uTime;
  float jitter = sin(uv.y * 200.0 + t * 12.0) * 0.04;
  float glow = 0.6 + 0.4 * sin(t * 4.0 + uv.y * 6.0);
  vec3 base = vec3(0.17, 0.9, 1.0);
  vec3 color = base * glow + vec3(0.1 * sin(uv.x * 50.0 + t * 20.0));
  color *= 1.0 + jitter;
  gl_FragColor = vec4(color, 1.0);
}
`;
