export const SwordShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color("#40ffaa") }, // Xanh lá
    uColor2: { value: new THREE.Color("#f0ff00") }, // Vàng rực
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    void main() {
      // Tạo hiệu ứng gradient chạy dọc thanh kiếm
      float strength = smoothstep(0.0, 1.0, vUv.y + sin(uTime * 2.0) * 0.5);
      vec3 finalColor = mix(uColor1, uColor2, strength);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};
