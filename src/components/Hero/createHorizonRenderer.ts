import {
  BufferGeometry, Float32BufferAttribute, HalfFloatType, Mesh,
  NoColorSpace, LinearSRGBColorSpace, NoToneMapping, OrthographicCamera, Scene, ShaderMaterial,
  Vector2, WebGLRenderer, WebGLRenderTarget,
} from "three";
import type { HorizonInputs } from "./HorizonGlow";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Radiance is accumulated in RGBA16F. Dithering is applied only in the final
// display pass, after sampling the float target; its pattern never animates.
const horizonShader = `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 uSize;
  uniform float uTime;
  uniform float uPower;
  uniform float uHorizon;
  uniform float uRadius;
  void main() {
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    float x = (uv.x - 0.5) * 2.0;
    float dx = (uv.x - 0.5) * uSize.x;
    float arcDrop = (uRadius - sqrt(max(0.0, uRadius * uRadius - dx * dx))) / uSize.y;
    float y = uv.y - (uHorizon + arcDrop);
    float above = max(-y, 0.0);
    float pulse = 1.0 + 0.08 * sin(uTime * 1.04719755);
    float reach = 1.0 + 0.15 * uPower;
    float gain = pulse * (1.0 + 0.15 * uPower);
    float center = exp(-x * x * 2.8);
    float topFade = 1.0 - smoothstep(0.05, 0.37 * reach, above);
    float bottomFade = 1.0 - smoothstep(0.01, 0.20, max(y, 0.0));
    float envelope = topFade * bottomFade;
    float spread = exp(-abs(y) / (y < 0.0 ? 0.075 * reach : 0.040));
    float ember = exp(-abs(y) / 0.021);
    // Broad fans, with no high-frequency noise, grids, particles or road lines.
    float fanWidth = 1.0 + 0.12 * sin(uTime * 0.15);
    float origin = 0.045 * sin(uTime * 0.26);
    float theta = atan((x - origin) * 0.72, max(above, 0.006) * 3.8 * fanWidth);
    float drift = 0.24 * sin(uTime * 0.07);
    float fan = pow(max(0.0, cos(theta * 9.0 + drift)), 8.0);
    fan += 0.45 * pow(max(0.0, cos(theta * 15.0 - drift * 0.7 + 1.3)), 10.0);
    float rays = fan * smoothstep(0.002, 0.045, above)
      * exp(-above / (0.10 * reach)) * center * topFade;
    float line = exp(-pow(y * uSize.y / 1.35, 2.0));
    float halo = exp(-pow(y * uSize.y / 6.0, 2.0));
    vec3 color = vec3(10.0, 10.0, 11.0) / 255.0;
    color += vec3(58.0, 8.0, 20.0) / 255.0 * spread * envelope * 0.85;
    color += vec3(229.0, 23.0, 63.0) / 255.0 * spread * envelope * (0.30 + center * 0.32) * gain;
    color += vec3(1.0, 0.5412, 0.0) * ember * (0.15 + center * 0.45) * gain;
    color += vec3(1.0, 0.36, 0.10) * rays * 0.40 * gain;
    color += vec3(1.0, 0.60, 0.31) * halo * (0.12 + center * 0.28) * gain;
    color = mix(color, vec3(1.0, 0.9569, 0.9098), line * (0.62 + center * 0.36));
    // Soft highlight compression preserves the warm tint at the bright center.
    color /= max(1.0, max(color.r, max(color.g, color.b)));
    gl_FragColor = vec4(color, 1.0);
  }
`;

const displayShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  void main() {
    vec3 color = texture2D(uTexture, vUv).rgb;
    color += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createHorizonRenderer(
  host: HTMLDivElement,
  canvas: HTMLCanvasElement,
  { geometry, motion, reduced }: HorizonInputs,
) {
  const hero = host.closest<HTMLElement>(".hero-card")!;
  const context = canvas.getContext("webgl2", {
    alpha: false, antialias: false, depth: false, stencil: false,
    powerPreference: "low-power",
  });
  if (!context || !context.getExtension("EXT_color_buffer_float")) {
    host.dataset.reason = context ? "Float render target unavailable" : "WebGL2 unavailable";
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return () => {};
  }
  const renderer = new WebGLRenderer({ canvas, context, antialias: false, alpha: false });
  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.setPixelRatio(1);
  const target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType, depthBuffer: false, stencilBuffer: false,
  });
  target.texture.colorSpace = NoColorSpace;
  const uniforms = {
    uSize: { value: new Vector2(1, 1) },
    uTime: { value: 0 },
    uPower: { value: reduced ? 0.6 : 0 },
    uHorizon: { value: geometry.current.horizon },
    uRadius: { value: 3200 * geometry.current.scale },
  };
  const material = new ShaderMaterial({
    vertexShader, fragmentShader: horizonShader, uniforms,
    depthTest: false, depthWrite: false, toneMapped: false,
  });
  const display = new ShaderMaterial({
    vertexShader, fragmentShader: displayShader,
    uniforms: { uTexture: { value: target.texture } },
    depthTest: false, depthWrite: false, toneMapped: false,
  });
  const triangle = new BufferGeometry();
  triangle.setAttribute("position", new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const mesh = new Mesh(triangle, material);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.add(mesh);
  const camera = new OrthographicCamera();
  let raf = 0, last = 0, time = 0, frameCount = 0, sampleMs = 0;
  let visible = false, lost = false, disposed = false, quality = 1;
  let hasStaticFrame = false;
  let warmup = 0;

  const resize = () => {
    if (disposed || lost) return;
    const width = hero.clientWidth, height = hero.clientHeight;
    const mobile = matchMedia("(max-width: 699px)").matches;
    const dpr = Math.min(devicePixelRatio || 1, mobile ? 1 : 1.5) * quality;
    renderer.setSize(Math.max(1, Math.round(width * dpr)), Math.max(1, Math.round(height * dpr)), false);
    target.setSize(canvas.width, canvas.height);
    uniforms.uSize.value.set(width, height);
    host.dataset.dpr = dpr.toFixed(2);
    host.dataset.quality = String(quality);
    hasStaticFrame = false;
    sync();
  };
  const render = (stamp: number) => {
    raf = 0;
    if (disposed || lost || !visible || document.hidden) return;
    // A 144/180 Hz monitor should not triple the GPU cost of slow breathing.
    if (!reduced && last && stamp - last < 1000 / 60 - 0.5) {
      raf = requestAnimationFrame(render);
      return;
    }
    const dt = last ? Math.min((stamp - last) / 1000, 0.1) : 0;
    last = stamp;
    time += dt;
    uniforms.uTime.value = reduced ? 0 : time;
    uniforms.uHorizon.value = geometry.current.horizon;
    uniforms.uRadius.value = 3200 * geometry.current.scale;
    const power = Math.max(0, Math.min(1, motion.current.rpm / 8000));
    if (!reduced) uniforms.uPower.value += (power - uniforms.uPower.value) * (1 - Math.exp(-dt * 2.5));
    mesh.material = material;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    mesh.material = display;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    host.dataset.renderer = "webgl-float";
    host.dataset.state = reduced ? "static" : "running";
    hasStaticFrame = true;
    // Measure actual rAF cadence after startup. A slow device gets half-size
    // buffers (a quarter of the fragments), never a strobing lower frame rate.
    warmup += dt;
    if (!reduced && dt > 0 && warmup > 2.5) {
      frameCount++;
      sampleMs += dt * 1000;
      if (sampleMs >= 1500) {
        const fps = frameCount * 1000 / sampleMs;
        host.dataset.fps = fps.toFixed(1);
        frameCount = 0; sampleMs = 0;
        if (fps < 50 && quality > 0.5) {
          quality = 0.5;
          resize();
        }
      }
    }
    if (!reduced && !raf) raf = requestAnimationFrame(render);
  };
  function sync() {
    if (disposed || lost || document.hidden || !visible) {
      cancelAnimationFrame(raf); raf = 0; last = 0;
      host.dataset.state = "paused";
    } else if (!raf && (!reduced || !hasStaticFrame)) {
      last = 0;
      raf = requestAnimationFrame(render);
    }
  }
  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(raf); raf = 0;
    host.dataset.renderer = "css-fallback";
    host.dataset.state = "static";
  };
  const onRestored = () => { lost = false; resize(); };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  const resizeObserver = new ResizeObserver(resize);
  observer.observe(hero);
  resizeObserver.observe(hero);
  document.addEventListener("visibilitychange", sync);
  resize();
  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    observer.disconnect(); resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", sync);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    triangle.dispose(); material.dispose(); display.dispose(); target.dispose();
    renderer.dispose();
  };
}
