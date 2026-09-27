// Işık türleri ve gölge maliyeti (3B).
import * as THREE from 'three';
import { h, slider, loop, clamp } from './ui.js';

export default function mount(root) {
  const stage = h('div', { class: 'w-stage dark', style: { cursor: 'grab', touchAction: 'pan-y' } });
  const over = h('div', { class: 'w-overlay', style: { left: '14px', top: '12px', color: '#c8ccd6' } });
  stage.append(over); root.append(stage);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.prepend(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x151821);
  const M = (c, r = 0.7) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const add = (g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; scene.add(o); return o; };
  add(new THREE.BoxGeometry(12, 0.2, 8), M(0xcfc6b2), 0, -0.1, 0).castShadow = false;
  add(new THREE.BoxGeometry(0.2, 3, 8), M(0xe6dfd0), -6, 1.5, 0).castShadow = false;
  add(new THREE.BoxGeometry(1.2, 1.2, 1.2), M(0xd0831c), -1.8, 0.6, 0.4);
  add(new THREE.SphereGeometry(0.7, 32, 20), M(0x0d8a7d, 0.25), 0.4, 0.7, -0.6);
  add(new THREE.CylinderGeometry(0.45, 0.45, 1.8, 28), M(0x3e44b8), 2.3, 0.9, 0.8);
  add(new THREE.TorusKnotGeometry(0.45, 0.16, 90, 14), M(0xc9543f, 0.35), -0.3, 1.0, 2.1);

  const amb = new THREE.HemisphereLight(0xffffff, 0x6d6450, 0.25); scene.add(amb);
  const sun = new THREE.DirectionalLight(0xfff3e0, 2.2); sun.position.set(-5, 8, 4);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 }); sun.shadow.mapSize.set(1024, 1024);
  const lamp = new THREE.PointLight(0xffb45a, 18, 9, 2); lamp.position.set(1.5, 2.2, 2.4); lamp.shadow.mapSize.set(512, 512);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd9a0 })); lamp.add(bulb);
  const spot = new THREE.SpotLight(0x9fb6ff, 60, 14, 0.42, 0.35, 2); spot.position.set(3.5, 5, -2.5); spot.target.position.set(0, 0, 0.5); spot.shadow.mapSize.set(1024, 1024);
  scene.add(sun, lamp, spot, spot.target);

  const L = [
    { id: 'sun', n: 'Directional (güneş)', o: sun, on: true, sh: true, cost: 1 },
    { id: 'lamp', n: 'Point (lamba)', o: lamp, on: true, sh: false, cost: 6 },
    { id: 'spot', n: 'Spot (fener)', o: spot, on: false, sh: false, cost: 1 },
  ];
  const cam = new THREE.PerspectiveCamera(42, 2, 0.1, 100);
  let az = 0.6, W = 600, H = 320;
  const place = () => { cam.position.set(Math.sin(az) * 10, 5.5, Math.cos(az) * 10); cam.lookAt(0, 0.6, 0); };
  const resize = () => { W = stage.clientWidth || 600; H = Math.round(clamp(W * 0.5, 260, 460)); renderer.setSize(W, H); cam.aspect = W / H; cam.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(stage);

  const panel = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))', gap: '.3rem', flex: '1 1 100%' } });
  L.forEach((l) => {
    const on = h('input', { type: 'checkbox', checked: l.on }), sh = h('input', { type: 'checkbox', checked: l.sh });
    on.addEventListener('change', () => { l.on = on.checked; apply(); }); sh.addEventListener('change', () => { l.sh = sh.checked; apply(); });
    panel.append(h('div', { style: { border: '1px solid #ece9e2', borderRadius: '8px', padding: '.4rem .5rem' } },
      h('label', { class: 'chk', style: { padding: '.1rem .2rem' } }, on, h('span', { class: 't' }, l.n)),
      h('label', { class: 'chk', style: { padding: '.1rem .2rem .1rem 1.5rem', fontSize: '.78rem' } }, sh, h('span', {}, 'Gölge üretsin'))));
  });
  const ambS = slider({ label: 'Ortam ışığı', min: 0, max: 1.2, step: 0.01, value: 0.25, fmt: (v) => Math.round(v * 100) + '%', oninput: (v) => (amb.intensity = v) });
  const rd = h('div', { class: 'read', style: { flex: '1 1 100%' } });
  root.append(h('div', { class: 'w-bar' }, panel, ambS.el, rd));
  root.append(h('p', { class: 'try', html: '<b>Dene</b>Sahneyi sürükleyerek çevirin. Lambanın gölgesini açınca tahmini çizim sayısının 6 arttığına dikkat edin: noktasal ışık her yöne gölge düşürdüğü için sahneyi altı yönden çizmek zorunda. Yalnızca güneşin gölgesini bırakınca görüntü ne kadar değişiyor?' }));

  function apply() {
    L.forEach((l) => { l.o.visible = l.on; l.o.castShadow = l.on && l.sh; });
    const passes = 1 + L.reduce((a, l) => a + (l.on && l.sh ? l.cost : 0), 0);
    rd.innerHTML = `<span>Gölge üreten ışık <b>${L.filter((l) => l.on && l.sh).length}</b></span><span>Sahne karede yaklaşık <b>${passes}</b> kez çiziliyor</span>`;
    over.textContent = passes > 4 ? 'Maliyetli: web ve mobilde kare hızı düşer' : passes > 1 ? 'Makul' : 'Ucuz: gölge yok';
  }
  let drag = null;
  stage.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, a: az }; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', (e) => { if (drag) az = drag.a - (e.clientX - drag.x) / 160; });
  stage.addEventListener('pointerup', () => (drag = null));
  let tt = 0;
  loop(root, (dt) => { tt += dt; lamp.position.x = 1.5 + Math.sin(tt * 0.8) * 1.2; place(); renderer.render(scene, cam); });
  resize(); apply();
}
