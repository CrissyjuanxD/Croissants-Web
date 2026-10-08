// Fondo: las capturas del servidor pasando despacio (zoom y paneo suaves) y encima una capa WebGL de viento:
// bruma difuminada que se retuerce en remolinos lentos y corrientes de aire muy suaves, como nubes transparentes.

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uIntensity;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v;
}

// Gira el espacio alrededor de un centro: mucho cerca del centro y nada lejos. Aplicado a la bruma deja remolinos
// suaves, sin líneas
vec2 swirl(vec2 p, vec2 c, float strength, float radius) {
  vec2 d = p - c;
  float a = strength * exp(-dot(d, d) / (radius * radius));
  float s = sin(a);
  float k = cos(a);
  return c + vec2(k * d.x - s * d.y, s * d.x + k * d.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  float t = uTime;
  p += uMouse * 0.02;

  // Dos remolinos muy abiertos y lentos: apenas curvan la bruma, sin formar anillos
  vec2 c1 = vec2(-0.6 + sin(t * 0.017) * 0.3, 0.15 + cos(t * 0.013) * 0.2);
  vec2 c2 = vec2(0.65 + cos(t * 0.015) * 0.25, -0.2 + sin(t * 0.019) * 0.18);
  vec2 q = swirl(p, c1, 1.1 + sin(t * 0.07) * 0.3, 1.15);
  q = swirl(q, c2, -0.9 + cos(t * 0.06) * 0.25, 1.05);

  // Bruma que fluye con el viento hacia la derecha
  vec2 flow = vec2(-t * 0.03, t * 0.006);
  vec2 w = vec2(fbm(q * 0.7 + flow), fbm(q * 0.7 - flow + 4.7)) - 0.5;
  float m1 = fbm(q * 0.85 + w * 1.1 + flow * 1.2);
  float m2 = fbm(q * 1.6 - w * 0.8 + flow * 1.8 + 9.1);
  float mist = smoothstep(0.3, 0.95, m1) * 0.65 + smoothstep(0.4, 0.95, m2) * 0.25;

  // Ráfagas: nubes alargadas en la dirección del viento y rotas en parches, nunca líneas
  float streak = fbm(vec2(q.x * 0.45 - t * 0.07, q.y * 1.15 + w.x * 0.9));
  float patches = fbm(q * 0.6 + vec2(-t * 0.05, 0.0) + 3.3);
  float gust = smoothstep(0.45, 0.85, streak) * smoothstep(0.35, 0.75, patches) * 0.36;

  // Un poco de niebla abajo
  float low = smoothstep(0.42, 0.0, uv.y) * 0.1 * (0.5 + 0.5 * fbm(p * 1.4 + flow * 2.0));

  float alpha = clamp(mist * 0.34 + gust * 0.3 + low, 0.0, 0.4) * uIntensity;
  vec3 tint = mix(vec3(0.82, 0.88, 1.0), vec3(0.88, 0.82, 1.0), uv.x * 0.6 + uv.y * 0.4);
  gl_FragColor = vec4(tint * alpha, alpha);
}
`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log || 'shader');
  }
  return sh;
}

export function startWind(canvas, { intensity = 1 } = {}) {
  if (!canvas) return { setIntensity() {} };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gl;
  try {
    gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'low-power' });
  } catch { gl = null; }
  if (!gl) { document.documentElement.classList.add('no-webgl'); return { setIntensity() {} }; }

  let prog, uni, raf = 0, running = true, lost = false;
  let level = intensity, target = intensity;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  function init() {
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) {
      console.warn('[viento] WebGL no disponible:', e);
      return false;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    uni = {};
    for (const n of ['uRes', 'uTime', 'uMouse', 'uIntensity']) uni[n] = gl.getUniformLocation(prog, n);
    gl.clearColor(0, 0, 0, 0);
    return true;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const scale = window.innerWidth < 768 ? 0.4 : 0.5;
    const w = Math.max(2, Math.round(window.innerWidth * dpr * scale));
    const h = Math.max(2, Math.round(window.innerHeight * dpr * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  const speed = reduced ? 0.15 : 1;
  const start = performance.now();
  let last = 0;
  const minFrame = reduced ? 1000 / 10 : 1000 / 45;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!running || lost) return;
    if (now - last < minFrame) return;
    last = now;
    level += (target - level) * 0.05;
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uni.uRes, canvas.width, canvas.height);
    gl.uniform1f(uni.uTime, ((now - start) / 1000) * speed);
    gl.uniform2f(uni.uMouse, mouse.x, mouse.y);
    gl.uniform1f(uni.uIntensity, level);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  if (!init()) { document.documentElement.classList.add('no-webgl'); return { setIntensity() {} }; }
  resize();
  canvas.classList.add('is-ready');
  raf = requestAnimationFrame(frame);

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); }, { passive: true });
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });
  if (!reduced) {
    window.addEventListener('pointermove', (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; });
  canvas.addEventListener('webglcontextrestored', () => { if (init()) { lost = false; resize(); } });
  return { setIntensity(v) { target = v; } };
}

// Las capturas del servidor van pasando con un fundido lento y un zoom/paneo suave (Ken Burns)
export function startPhotos(host, photos, { every = 13000 } = {}) {
  if (!host) return { set() {} };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let list = [];
  let index = -1;
  let timer = 0;
  const layers = [document.createElement('div'), document.createElement('div')];
  layers.forEach((l) => { l.className = 'bg-photo'; host.appendChild(l); });
  let front = 0;

  const load = (src) => new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });

  async function show(i) {
    if (!list.length) return;
    index = (i + list.length) % list.length;
    const src = list[index];
    const ok = await load(src);
    if (!ok) return;
    const next = layers[1 - front];
    const dirs = [[-3, -2], [3, -2], [-3, 2], [3, 2], [0, -3], [-4, 0]];
    const [dx, dy] = dirs[index % dirs.length];
    next.style.setProperty('--dx', `${dx}%`);
    next.style.setProperty('--dy', `${dy}%`);
    next.style.backgroundImage = `url("${src.replace(/"/g, '%22')}")`;
    next.classList.remove('is-on');
    void next.offsetWidth;
    next.classList.add('is-on');
    layers[front].classList.remove('is-on');
    front = 1 - front;
    host.classList.add('is-ready');
  }

  function schedule() {
    clearInterval(timer);
    if (reduced || list.length < 2) return;
    timer = setInterval(() => { if (!document.hidden) show(index + 1); }, every);
  }

  return {
    set(srcs) {
      const next = (srcs || []).filter(Boolean);
      if (next.join('|') === list.join('|')) return;
      list = next;
      show(Math.floor(Math.random() * Math.max(1, list.length)));
      schedule();
    },
  };
}
