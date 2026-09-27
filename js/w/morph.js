// 2B ⟷ 3B: aynı sahnenin iki görünümü.
// Kaydırıcı; kamerayı neredeyse dik izdüşümden perspektife taşır,
// düz rengi ışıklı gölgelendirmeye, gölgesiz sahneyi gölgeli sahneye çevirir.
import * as THREE from 'three';
import { h, slider, seg, loop, reduced, clamp, lerp, ease } from './ui.js';

export default function mount(root) {
  const dark = root.dataset.variant === 'hero';
  const stage = h('div', { class: 'w-stage' + (dark ? ' dark' : ''), style: { cursor: 'grab', touchAction: 'pan-y' } });
  const tag = h('div', { class: 'w-overlay', style: { left: '14px', top: '12px', color: dark ? '#c8ccd8' : '#3f434d' } });
  stage.append(tag);
  root.append(stage);

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(dark ? 0x181c26 : 0xf1efe9);

  const mats = [];
  const mat = (c) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, emissive: new THREE.Color(c) }); mats.push(m); return m; };
  const add = (geo, c, x, y, z) => {
    const m = new THREE.Mesh(geo, mat(c)); m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
  };

  // zemin ve dekor
  const ground = add(new THREE.BoxGeometry(13, 0.4, 5), 0xd9cfba, 0, -0.2, 0); ground.castShadow = false;
  add(new THREE.BoxGeometry(2.1, 1.6, 1.6), 0xf3efe6, -3.6, 0.8, -1.0);
  const roof = add(new THREE.ConeGeometry(1.65, 1.1, 4), 0xc9543f, -3.6, 2.15, -1.0); roof.rotation.y = Math.PI / 4;
  add(new THREE.BoxGeometry(0.5, 0.95, 0.06), 0x7a4e33, -3.6, 0.48, -0.17);
  add(new THREE.BoxGeometry(0.45, 0.45, 0.06), 0x8fc1e0, -3.05, 1.05, -0.17);
  add(new THREE.CylinderGeometry(0.14, 0.2, 1.3, 12), 0x7a4e33, 3.9, 0.65, -1.4);
  add(new THREE.SphereGeometry(0.85, 28, 18), 0x4f9a55, 3.9, 1.8, -1.4);
  add(new THREE.SphereGeometry(0.55, 24, 16), 0x5fae63, 4.6, 1.3, -0.9);
  // karakter
  const hero = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 6, 18), mat(0x3e44b8)); body.position.y = 0.57;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 22, 16), mat(0xf0c8a4)); head.position.y = 1.28;
  [body, head].forEach((m) => { m.castShadow = true; hero.add(m); });
  hero.position.set(-0.6, 0, 0.8); scene.add(hero);
  // kasalar ve top
  add(new THREE.BoxGeometry(0.8, 0.8, 0.8), 0xe0962f, 1.25, 0.4, 0.0);
  add(new THREE.BoxGeometry(0.8, 0.8, 0.8), 0xd0831c, 1.25, 1.2, 0.0).rotation.y = 0.25;
  const ball = add(new THREE.SphereGeometry(0.34, 26, 18), 0x0d8a7d, 2.5, 0.34, 1.35);

  // ışık
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8d826b, 1.1);
  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(-4, 8, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 6, bottom: -4, near: 1, far: 30 });
  sun.shadow.bias = -0.0004;
  scene.add(hemi, sun);

  const cam = new THREE.PerspectiveCamera(40, 2, 0.1, 200);
  const target = new THREE.Vector3(0, 1.05, 0);

  let t = 0, userAz = 0, W = 600, H = 300;
  const apply = () => {
    const e = ease(t);
    const s = clamp((t - 0.12) / 0.7, 0, 1);                 // ışık payı
    mats.forEach((m) => { m.emissiveIntensity = 1 - s; });
    hemi.intensity = 1.1 * s; sun.intensity = 2.6 * s;
    const fov = lerp(2.5, 44, e);
    const el = lerp(0, 0.40, e);
    const az = lerp(0, 0.55, e) + userAz * e;
    const frameH = Math.max(4.4, 12.2 / (W / H)) * lerp(1, 1.16, e);
    const dist = (frameH / 2) / Math.tan((fov * Math.PI) / 360);
    cam.fov = fov; cam.aspect = W / H;
    cam.near = Math.max(0.1, dist - 25); cam.far = dist + 40;
    cam.position.set(
      target.x + dist * Math.sin(az) * Math.cos(el),
      target.y + dist * Math.sin(el),
      target.z + dist * Math.cos(az) * Math.cos(el));
    cam.lookAt(target);
    cam.updateProjectionMatrix();
    const mode = t < 0.08 ? '2B görünüm' : t > 0.92 ? '3B görünüm' : 'Geçiş';
    tag.innerHTML = `<b style="font-weight:600">${mode}</b> · kamera açısı ${fov.toFixed(0)}° · ışık %${Math.round(s * 100)}`;
  };

  const resize = () => {
    W = stage.clientWidth || 600;
    H = Math.round(clamp(W * (dark ? 0.62 : 0.5), 240, 560));
    renderer.setSize(W, H);
    apply();
  };
  new ResizeObserver(resize).observe(stage);

  // denetimler
  let auto = !reduced && dark, dir = 1, hold = 1.2, tween = null;
  const stopAuto = () => { auto = false; };
  const sl = slider({
    label: '2B', min: 0, max: 1, step: 0.001, value: 0, cls: 'dual',
    fmt: () => '3B', oninput: (v) => { stopAuto(); tween = null; t = v; apply(); },
  });
  const go = (v) => { stopAuto(); tween = v; };
  const sg = seg({ options: [{ v: 0, t: '2B' }, { v: 1, t: '3B' }], value: 0, onchange: (v) => go(+v) });
  const bar = h('div', { class: 'w-bar' + (dark ? ' dark' : '') }, sl.el, sg.el);
  root.append(bar);

  // sürükleyerek 3B'de etrafında dön
  let drag = null;
  stage.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, a: userAz }; stage.setPointerCapture(e.pointerId); stage.style.cursor = 'grabbing'; stopAuto(); });
  stage.addEventListener('pointermove', (e) => { if (drag) { userAz = clamp(drag.a - (e.clientX - drag.x) / 180, -1.4, 1.4); apply(); } });
  const end = () => { drag = null; stage.style.cursor = 'grab'; };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);

  let clock = 0;
  loop(root, (dt) => {
    clock += dt;
    if (auto) {
      if (hold > 0) hold -= dt;
      else { t = clamp(t + dir * dt * 0.28, 0, 1); if (t === 0 || t === 1) { dir *= -1; hold = 1.6; } }
      sl.set(t); apply();
    } else if (tween != null) {
      t += (tween - t) * Math.min(1, dt * 4);
      if (Math.abs(tween - t) < 0.002) { t = tween; tween = null; }
      sl.set(t); apply();
    }
    sg.set(t < 0.5 ? 0 : 1);
    // küçük canlılık: top zıplar, karakter hafifçe salınır
    ball.position.y = 0.34 + Math.abs(Math.sin(clock * 2.2)) * 0.7;
    hero.rotation.y = Math.sin(clock * 0.8) * 0.35;
    renderer.render(scene, cam);
  });
  resize();
}
