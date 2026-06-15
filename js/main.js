// =============================================================
//  Oyun Motoru Atölyesi — main.js
//  "2D görselden çalışan 3D oyun nesnesine" yolculuğu (6 aşama)
//  1 Texture · 2 Material · 3 GameObject · 4 Lighting · 5 Normal Map · 6 Avatar
//  + Kod sekmesi, mini-quiz, "kendin dene" görevleri, bitirme rozeti
// =============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ------------------------------------------------------------------
//  ORTAK: Prosedürel TEXTURE'lar (harici dosya yok)
// ------------------------------------------------------------------
function newCanvas(size = 256) { const c = document.createElement('canvas'); c.width = c.height = size; return c; }
function cvGrid() {
  const c = newCanvas(), x = c.getContext('2d');
  x.fillStyle = '#2f6f6a'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#aef3e3'; x.lineWidth = 3;
  for (let i = 0; i <= 256; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); }
  x.fillStyle = '#ffffff'; x.font = 'bold 30px monospace'; x.fillText('UV', 92, 142); return c;
}
function cvChecker() { const c = newCanvas(), x = c.getContext('2d'), s = 32; for (let y = 0; y < 256; y += s) for (let xx = 0; xx < 256; xx += s) { x.fillStyle = ((xx + y) / s) % 2 ? '#e0e4ea' : '#39404c'; x.fillRect(xx, y, s, s); } return c; }
function cvPanel() {
  const c = newCanvas(), x = c.getContext('2d'); x.fillStyle = '#8a9099'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#5b626c'; x.lineWidth = 5;
  for (let i = 0; i <= 256; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); }
  x.fillStyle = '#c8ccd2'; for (let y = 32; y < 256; y += 64) for (let xx = 32; xx < 256; xx += 64) { x.beginPath(); x.arc(xx, y, 5, 0, 7); x.fill(); } return c;
}
function cvCircuit() {
  const c = newCanvas(), x = c.getContext('2d'); x.fillStyle = '#0f3d2e'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#39d98a'; x.lineWidth = 3;
  for (let i = 0; i < 24; i++) { const px = (i * 53) % 256, py = (i * 97) % 256; x.beginPath(); x.moveTo(px, py); x.lineTo(px, (py + 60) % 256); x.lineTo((px + 50) % 256, (py + 60) % 256); x.stroke(); x.fillStyle = '#9affd0'; x.fillRect(px - 3, py - 3, 7, 7); } return c;
}
function cvBrick() {
  const c = newCanvas(), x = c.getContext('2d'); x.fillStyle = '#7a3b2e'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#d6c3a8'; x.lineWidth = 6; x.fillStyle = '#9a4a38';
  const bh = 32, bw = 64; for (let row = 0, y = 0; y < 256; y += bh, row++) { const off = (row % 2) ? bw / 2 : 0; for (let xx = -bw; xx < 256; xx += bw) { x.fillRect(xx + off + 3, y + 3, bw - 6, bh - 6); x.strokeRect(xx + off, y, bw, bh); } } return c;
}
const TEXTURES = {
  none:    { label: { tr: 'Yok (düz renk)', en: 'None (solid)' }, canvas: null },
  grid:    { label: { tr: 'Izgara / UV',    en: 'Grid / UV' },    canvas: cvGrid() },
  checker: { label: { tr: 'Damalı',         en: 'Checker' },      canvas: cvChecker() },
  panel:   { label: { tr: 'Metal Panel',    en: 'Metal Panel' },  canvas: cvPanel() },
  circuit: { label: { tr: 'Devre',          en: 'Circuit' },      canvas: cvCircuit() },
  brick:   { label: { tr: 'Tuğla',          en: 'Brick' },        canvas: cvBrick() },
};
Object.values(TEXTURES).forEach(t => { if (t.canvas) { const tex = new THREE.CanvasTexture(t.canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4; t.tex = tex; } else t.tex = null; });

// Prosedürel NORMAL MAP (yükseklikten normal hesaplar — gerçek "pürüz" verir)
function genNormalMapCanvas() {
  const size = 256, c = newCanvas(size), ctx = c.getContext('2d');
  const H = new Float32Array(size * size);
  const hAt = (px, py) => {
    const cs = 40, cx = ((px % cs) / cs - 0.5) * 2, cy = ((py % cs) / cs - 0.5) * 2;
    const r = Math.sqrt(cx * cx + cy * cy);
    let h = r < 1 ? Math.cos(r * Math.PI / 2) : 0;          // kubbe şeklinde çıkıntılar
    h += 0.10 * Math.sin(px * 0.5) * Math.sin(py * 0.5);    // ince gren
    return h;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) H[y * size + x] = hAt(x, y);
  const img = ctx.createImageData(size, size), st = 2.2;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const xl = H[y * size + ((x - 1 + size) % size)], xr = H[y * size + ((x + 1) % size)];
    const yt = H[((y - 1 + size) % size) * size + x], yb = H[((y + 1) % size) * size + x];
    let nx = (xl - xr) * st, ny = (yt - yb) * st, nz = 1;
    const len = Math.hypot(nx, ny, nz); nx /= len; ny /= len; nz /= len;
    const i = (y * size + x) * 4;
    img.data[i] = (nx * 0.5 + 0.5) * 255; img.data[i + 1] = (ny * 0.5 + 0.5) * 255; img.data[i + 2] = (nz * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0); return c;
}
const normalCanvas = genNormalMapCanvas();
const normalTex = new THREE.CanvasTexture(normalCanvas);
normalTex.colorSpace = THREE.NoColorSpace; normalTex.wrapS = normalTex.wrapT = THREE.RepeatWrapping;

// Yumuşak "contact shadow" dokusu (radyal gradyan)
function shadowTex() {
  const c = newCanvas(128), x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const SHADOW_TEX = shadowTex();
function addShadowDisc(scene, y, radius) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({ map: SHADOW_TEX, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = y; scene.add(m); return m;
}

// Prosedürel ENVIRONMENT (IBL) — PBR yansımaları için yumuşak gökyüzü
function makeEnvTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#cfd8e6'); g.addColorStop(0.5, '#7e8a9c'); g.addColorStop(0.75, '#454c58'); g.addColorStop(1, '#23262e');
  x.fillStyle = g; x.fillRect(0, 0, 512, 256);
  const sun = x.createRadialGradient(150, 60, 5, 150, 60, 90); sun.addColorStop(0, 'rgba(255,244,214,0.95)'); sun.addColorStop(1, 'rgba(255,244,214,0)');
  x.fillStyle = sun; x.fillRect(60, 0, 180, 150);
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const ENV = makeEnvTexture();

// Dil yardımcı
let LANG = 'tr';
const L = (o) => (o && (o[LANG] || o.tr)) || '';

// ------------------------------------------------------------------
//  YOLCULUK DURUMU
// ------------------------------------------------------------------
const journey = { texKey: 'grid', material: new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.3, roughness: 0.5, name: 'M_Custom', envMapIntensity: 1 }) };
journey.material.map = TEXTURES[journey.texKey].tex;

// ------------------------------------------------------------------
//  Mini 3D sahne yardımcı
// ------------------------------------------------------------------
function makeMiniScene(container, camPos, opts = {}) {
  // Dayanıklılık: kapsayıcı yoksa (ör. eski/önbellekteki index.html) sayfayı çökertme
  if (!container) { console.warn('makeMiniScene: kapsayıcı bulunamadı — index.html güncel değil olabilir.'); container = document.createElement('div'); }
  const scene = new THREE.Scene();
  if (!opts.noEnv) scene.environment = ENV;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100); camera.position.copy(camPos);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);
  if (opts.bareLights) { scene.add(new THREE.HemisphereLight('#aab8d0', '#1a1d24', 0.14)); }
  else {
    scene.add(new THREE.HemisphereLight('#bcd0ff', '#20242c', 0.6));
    const key = new THREE.DirectionalLight('#ffffff', 2.0); key.position.set(3, 5, 4); scene.add(key);
    const rim = new THREE.DirectionalLight('#4ec9b0', 0.5); rim.position.set(-4, 2, -3); scene.add(rim);
  }
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 2; controls.maxDistance = 9;
  function resize() { const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(container); resize();
  // Görünürlük: ekranda değilken / sekme gizliyken render etme (performans)
  let _visible = false;
  new IntersectionObserver(([e]) => { _visible = e.isIntersecting; }, { rootMargin: '160px' }).observe(container);
  return { scene, camera, renderer, controls, resize, isVisible: () => _visible && !document.hidden };
}

// ==================================================================
//  AŞAMA 1 — TEXTURE
// ==================================================================
const tex2d = document.getElementById('tex2dCanvas'), texTile = document.getElementById('texTileCanvas'), swatchWrap = document.getElementById('texSwatches');
function drawTexturePreview() {
  const cv = TEXTURES[journey.texKey].canvas;
  const x1 = tex2d.getContext('2d'); x1.imageSmoothingEnabled = false; const x2 = texTile.getContext('2d'); x2.imageSmoothingEnabled = false;
  x1.clearRect(0, 0, 220, 220); x2.clearRect(0, 0, 220, 220);
  if (cv) { x1.drawImage(cv, 0, 0, 220, 220); const n = 3, s = 220 / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) x2.drawImage(cv, i * s, j * s, s, s); }
}
function buildSwatches() {
  swatchWrap.innerHTML = '';
  Object.keys(TEXTURES).filter(k => k !== 'none').forEach(key => {
    const b = document.createElement('button'); b.className = 'swatch' + (key === journey.texKey ? ' active' : ''); b.dataset.key = key;
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 52; cv.getContext('2d').drawImage(TEXTURES[key].canvas, 0, 0, 64, 52);
    const span = document.createElement('span'); span.textContent = L(TEXTURES[key].label);
    b.appendChild(cv); b.appendChild(span); b.addEventListener('click', () => setTexture(key, true)); swatchWrap.appendChild(b);
  });
}
function setTexture(key, announce) {
  journey.texKey = key; journey.material.map = TEXTURES[key].tex; journey.material.needsUpdate = true;
  drawTexturePreview();
  [...swatchWrap.children].forEach(b => b.classList.toggle('active', b.dataset.key === key));
  if (matBaseSelect) matBaseSelect.value = key; updateMatThumb();
  if (announce) { showToast('📦 ' + (LANG === 'tr' ? 'Doku → Material Stüdyosu\'na taşındı' : 'Texture → carried to Material Studio')); pulse(matThumb); }
}

// ==================================================================
//  AŞAMA 2 — MATERIAL STÜDYOSU
// ==================================================================
const matBaseSelect = document.getElementById('matBaseSelect'), matThumb = document.getElementById('matThumb'), matColor = document.getElementById('matColor'),
  matMetal = document.getElementById('matMetal'), matRough = document.getElementById('matRough'), matMetalVal = document.getElementById('matMetalVal'), matRoughVal = document.getElementById('matRoughVal');
function fillBaseSelect() { matBaseSelect.innerHTML = ''; Object.keys(TEXTURES).forEach(key => { const o = document.createElement('option'); o.value = key; o.textContent = L(TEXTURES[key].label); matBaseSelect.appendChild(o); }); matBaseSelect.value = journey.texKey; }
function updateMatThumb() { const cv = TEXTURES[journey.texKey].canvas; matThumb.style.backgroundImage = cv ? `url(${cv.toDataURL()})` : 'none'; matThumb.style.backgroundColor = cv ? 'transparent' : '#' + journey.material.color.getHexString(); }
matBaseSelect.addEventListener('change', () => setTexture(matBaseSelect.value, true));
matColor.addEventListener('input', () => { journey.material.color.set(matColor.value); updateMatThumb(); });
matMetal.addEventListener('input', () => { journey.material.metalness = +matMetal.value; matMetalVal.textContent = (+matMetal.value).toFixed(2); });
matRough.addEventListener('input', () => { journey.material.roughness = +matRough.value; matRoughVal.textContent = (+matRough.value).toFixed(2); });
const matMini = makeMiniScene(document.getElementById('matPreview'), new THREE.Vector3(0, 0, 3.4));
const previewSphere = new THREE.Mesh(new THREE.SphereGeometry(1.15, 64, 48), journey.material); matMini.scene.add(previewSphere);
const matPed = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.25, 48), new THREE.MeshStandardMaterial({ color: '#2a2f3a', roughness: 1 })); matPed.position.y = -1.55; matMini.scene.add(matPed);
addShadowDisc(matMini.scene, -1.42, 1.7);
(function loopMat() { requestAnimationFrame(loopMat); if (!matMini.isVisible()) return; previewSphere.rotation.y += 0.004; matMini.controls.update(); matMini.renderer.render(matMini.scene, matMini.camera); })();

// ==================================================================
//  AŞAMA 3 — MESH + GAMEOBJECT
// ==================================================================
const goLab = makeMiniScene(document.getElementById('goLab'), new THREE.Vector3(0, 0.5, 4));
const goGrid = new THREE.GridHelper(6, 12, '#3a4150', '#272c34'); goGrid.position.y = -1.2; goLab.scene.add(goGrid);
addShadowDisc(goLab.scene, -1.18, 2);
const goAxes = new THREE.AxesHelper(0.9); goLab.scene.add(goAxes);
const goDefaultMat = new THREE.MeshStandardMaterial({ color: '#9aa3b2', roughness: 0.85, metalness: 0 });
let goMesh = null, goStep = 0;
const goGeoms = { box: () => new THREE.BoxGeometry(1.4, 1.4, 1.4), sphere: () => new THREE.SphereGeometry(1, 48, 32), cylinder: () => new THREE.CylinderGeometry(0.85, 0.85, 1.7, 40), torus: () => new THREE.TorusKnotGeometry(0.75, 0.27, 120, 16) };
const goShapeNames = { box: 'Cube', sphere: 'Sphere', cylinder: 'Cylinder', torus: 'TorusKnot' };
const goShapeBtn = document.getElementById('goShapeBtn'), goShapeSelect = document.getElementById('goShapeSelect'), goMatBtn = document.getElementById('goMatBtn'),
  goWireBtn = document.getElementById('goWireBtn'), goResetBtn = document.getElementById('goResetBtn'), goStatusTag = document.getElementById('goStatusTag'), goComponents = document.getElementById('goComponents');
const GO_STATUS = { empty: { tr: 'Boş GameObject (yalnızca Transform)', en: 'Empty GameObject (Transform only)' }, mesh: { tr: 'Mesh eklendi — henüz renksiz', en: 'Mesh added — still colorless' }, full: { tr: 'GameObject hazır: Mesh + Material ✓', en: 'GameObject ready: Mesh + Material ✓' } };
function goAddMesh() { const shape = goShapeSelect.value; if (goMesh) goLab.scene.remove(goMesh); goMesh = new THREE.Mesh(goGeoms[shape](), goDefaultMat); goLab.scene.add(goMesh); goAxes.visible = false; goStep = Math.max(goStep, 1); goShapeBtn.dataset.done = 'true'; goMatBtn.disabled = false; goStatusTag.textContent = L(GO_STATUS.mesh); renderGoComponents(); }
function goApplyMaterial() { if (!goMesh) return; goMesh.material = journey.material.clone(); goMesh.material.name = 'M_Custom'; goStep = 2; goMatBtn.dataset.done = 'true'; goStatusTag.textContent = L(GO_STATUS.full); renderGoComponents(); showToast('🎨 ' + (LANG === 'tr' ? 'Material → GameObject\'e uygulandı' : 'Material → applied to the GameObject')); }
function goReset() { if (goMesh) { goLab.scene.remove(goMesh); goMesh = null; } goAxes.visible = true; goStep = 0; goShapeBtn.dataset.done = 'false'; goMatBtn.dataset.done = 'false'; goMatBtn.disabled = true; goStatusTag.textContent = L(GO_STATUS.empty); renderGoComponents(); }
function renderGoComponents() {
  const shape = goShapeNames[goShapeSelect.value], hasMesh = goStep >= 1, hasMat = goStep >= 2;
  goComponents.innerHTML = `
    <div class="comp on"><div class="comp-title"><span class="ci">📐</span> Transform</div><div class="comp-rows"><div><span>Position</span><span class="cv">0, 0, 0</span></div><div><span>Rotation</span><span class="cv">0, 0, 0</span></div><div><span>Scale</span><span class="cv">1, 1, 1</span></div></div></div>
    <div class="comp ${hasMesh ? 'on' : ''}"><div class="comp-title"><span class="ci">🔻</span> Mesh Filter</div><div class="comp-rows"><div><span>Mesh</span><span class="cv">${hasMesh ? shape : '—'}</span></div></div></div>
    <div class="comp ${hasMat ? 'on' : ''}"><div class="comp-title"><span class="ci">🎨</span> Mesh Renderer</div><div class="comp-rows"><div><span>Material</span><span class="cv">${hasMat ? 'M_Custom' : '—'}</span></div><div><span>Base Map</span><span class="cv">${hasMat ? L(TEXTURES[journey.texKey].label) : '—'}</span></div></div></div>`;
}
goShapeBtn.addEventListener('click', goAddMesh);
goShapeSelect.addEventListener('change', () => { if (goStep >= 1) goAddMesh(); });
goMatBtn.addEventListener('click', goApplyMaterial);
goWireBtn.addEventListener('click', () => { if (goMesh) goMesh.material.wireframe = !goMesh.material.wireframe; });
goResetBtn.addEventListener('click', goReset);
(function loopGo() { requestAnimationFrame(loopGo); if (!goLab.isVisible()) return; if (goMesh) goMesh.rotation.y += 0.006; goLab.controls.update(); goLab.renderer.render(goLab.scene, goLab.camera); })();

// ==================================================================
//  AŞAMA 4 — IŞIK & YÜZEY (Lighting + Normal Map birleşik)
// ==================================================================
const lsMini = makeMiniScene(document.getElementById('lsLab'), new THREE.Vector3(0, 1, 4.6), { bareLights: true, noEnv: true });
const lsState = { angle: 50, elev: 55, intensity: 2.4, color: '#ffffff', rough: 0.4, normalOn: false };
const lsMat = new THREE.MeshStandardMaterial({ color: '#c0742e', metalness: 0.18, roughness: 0.4 });
const lsSphere = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 44), lsMat); lsMini.scene.add(lsSphere);
const lsFloor = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), new THREE.MeshStandardMaterial({ color: '#272c34', roughness: 1 })); lsFloor.rotation.x = -Math.PI / 2; lsFloor.position.y = -1.3; lsMini.scene.add(lsFloor);
const lsLight = new THREE.DirectionalLight('#ffffff', 2.4); lsMini.scene.add(lsLight); lsMini.scene.add(lsLight.target);
const lsBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff4d6' })); lsMini.scene.add(lsBulb);
function updateLS() {
  const az = lsState.angle * Math.PI / 180, el = lsState.elev * Math.PI / 180, r = 4.2;
  lsLight.position.set(r * Math.cos(el) * Math.cos(az), r * Math.sin(el), r * Math.cos(el) * Math.sin(az));
  lsBulb.position.copy(lsLight.position); lsLight.intensity = lsState.intensity; lsLight.color.set(lsState.color); lsBulb.material.color.set(lsState.color);
  lsMat.roughness = lsState.rough;
}
const liAngle = document.getElementById('liAngle'), liElev = document.getElementById('liElev'), liInt = document.getElementById('liInt'), liColor = document.getElementById('liColor'), liRough = document.getElementById('liRough'), liIntVal = document.getElementById('liIntVal'), liRoughVal = document.getElementById('liRoughVal');
liAngle.addEventListener('input', () => { lsState.angle = +liAngle.value; updateLS(); });
liElev.addEventListener('input', () => { lsState.elev = +liElev.value; updateLS(); });
liInt.addEventListener('input', () => { lsState.intensity = +liInt.value; liIntVal.textContent = (+liInt.value).toFixed(1); updateLS(); });
liColor.addEventListener('input', () => { lsState.color = liColor.value; updateLS(); });
liRough.addEventListener('input', () => { lsState.rough = +liRough.value; liRoughVal.textContent = (+liRough.value).toFixed(2); updateLS(); });
const nmThumb = document.getElementById('nmThumb'); if (nmThumb) nmThumb.getContext('2d').drawImage(normalCanvas, 0, 0, nmThumb.width, nmThumb.height);
const nmOff = document.getElementById('nmOff'), nmOn = document.getElementById('nmOn'), nmWire = document.getElementById('nmWire');
function setLSNormal(on) { lsState.normalOn = on; lsMat.normalMap = on ? normalTex : null; lsMat.needsUpdate = true; nmOn.classList.toggle('active', on); nmOff.classList.toggle('active', !on); }
nmOn.addEventListener('click', () => setLSNormal(true));
nmOff.addEventListener('click', () => setLSNormal(false));
nmWire.addEventListener('click', () => { lsMat.wireframe = !lsMat.wireframe; nmWire.classList.toggle('active', lsMat.wireframe); });
updateLS();
(function loopLS() { requestAnimationFrame(loopLS); if (!lsMini.isVisible()) return; lsSphere.rotation.y += 0.0035; lsMini.controls.update(); lsMini.renderer.render(lsMini.scene, lsMini.camera); })();

// ==================================================================
//  AŞAMA 5 — DÜNYA / SAHNE (hiyerarşik ev + bahçe + yollar + arabalar)
// ==================================================================
const worldMini = makeMiniScene(document.getElementById('worldLab'), new THREE.Vector3(0, 9, 14));
worldMini.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));   // en ağır sahne — biraz daha düşük
worldMini.scene.background = new THREE.Color('#10131a'); worldMini.scene.fog = new THREE.Fog('#10131a', 16, 32);
worldMini.controls.target.set(0, 0.5, 0); worldMini.controls.maxPolarAngle = Math.PI * 0.48; worldMini.controls.minDistance = 9; worldMini.controls.maxDistance = 28;
worldMini.renderer.shadowMap.enabled = true; worldMini.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const sun = new THREE.DirectionalLight('#fff2dc', 1.7); sun.position.set(7, 13, 6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.near = 1; sun.shadow.camera.far = 44; sun.shadow.camera.left = -10; sun.shadow.camera.right = 10; sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10; sun.shadow.bias = -0.0006; worldMini.scene.add(sun);
sun.shadow.autoUpdate = false; sun.shadow.needsUpdate = true;   // ev/ağaç statik → gölge bir kez hesaplanır, her karede değil
const mapGround = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), new THREE.MeshStandardMaterial({ color: '#33602f', roughness: 1 })); mapGround.rotation.x = -Math.PI / 2; mapGround.receiveShadow = true; worldMini.scene.add(mapGround);
const gardenPlot = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.16, 7.4), new THREE.MeshStandardMaterial({ color: '#4f9140', roughness: 1 })); gardenPlot.position.y = 0.08; gardenPlot.receiveShadow = true; worldMini.scene.add(gardenPlot);
const roadMat = new THREE.MeshStandardMaterial({ color: '#2b2e35', roughness: 0.95 });
function road(w, l, x, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, l), roadMat); m.position.set(x, 0.04, z); m.receiveShadow = true; worldMini.scene.add(m); }
road(46, 1.7, 0, 4.7); road(1.7, 46, 4.7, 0); road(9.4, 1.5, 0, -4.7); road(1.5, 9.4, -4.7, 0);
// EV — hiyerarşik GameObject: Garden → House → (Walls, Roof, Door, Windows, Chimney), Tree
const houseMeshes = [], houseJoints = {};
function hNode(name, parent, pos, icon) { const g = new THREE.Group(); g.name = name; g.position.set(pos[0], pos[1], pos[2]); g.userData = { isHouse: true, icon }; parent.add(g); houseJoints[name] = g; return g; }
function hMesh(node, geom, mat, off = [0, 0, 0]) { const m = new THREE.Mesh(geom, mat); m.position.set(off[0], off[1], off[2]); m.castShadow = true; m.userData.owner = node; node.userData.mesh = m; node.add(m); houseMeshes.push(m); return m; }
const roofMat = new THREE.MeshStandardMaterial({ color: '#9a3b2e', roughness: 0.7 });
const doorMat = new THREE.MeshStandardMaterial({ color: '#5a3b22', roughness: 0.6 });
const winMat = new THREE.MeshStandardMaterial({ color: '#bfe3ff', metalness: 0.1, roughness: 0.1, emissive: '#16344d', emissiveIntensity: 0.5 });
const gardenGroup = hNode('Garden', worldMini.scene, [0, 0, 0], '🌿');
const houseGO = hNode('House', gardenGroup, [0, 0, 0], '🏠');
const wallsGO = hNode('Walls', houseGO, [0, 0, 0], '🧱'); hMesh(wallsGO, new THREE.BoxGeometry(2.4, 1.6, 2.4), journey.material.clone(), [0, 0.9, 0]); wallsGO.userData.mesh.material.name = 'M_Custom';
const roofGO = hNode('Roof', houseGO, [0, 1.7, 0], '🔺'); const rmesh = hMesh(roofGO, new THREE.ConeGeometry(1.95, 1.15, 4), roofMat, [0, 0.55, 0]); rmesh.rotation.y = Math.PI / 4;
const doorGO = hNode('Door', houseGO, [0, 0, 1.21], '🚪'); hMesh(doorGO, new THREE.BoxGeometry(0.55, 0.95, 0.08), doorMat, [0, 0.5, 0]);
const winLGO = hNode('Window_L', houseGO, [-0.72, 0.95, 1.21], '🪟'); hMesh(winLGO, new THREE.BoxGeometry(0.5, 0.5, 0.06), winMat);
const winRGO = hNode('Window_R', houseGO, [0.72, 0.95, 1.21], '🪟'); hMesh(winRGO, new THREE.BoxGeometry(0.5, 0.5, 0.06), winMat);
const chimGO = hNode('Chimney', houseGO, [0.7, 2.2, -0.55], '🏭'); hMesh(chimGO, new THREE.BoxGeometry(0.32, 0.75, 0.32), roofMat);
const treeGO = hNode('Tree', gardenGroup, [-2.5, 0, -2.4], '🌳'); hMesh(treeGO, new THREE.CylinderGeometry(0.12, 0.16, 1, 8), new THREE.MeshStandardMaterial({ color: '#6b4a2a', roughness: 0.9 }), [0, 0.5, 0]); const foliage = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 0), new THREE.MeshStandardMaterial({ color: '#3f8f3a', roughness: 0.8, flatShading: true })); foliage.position.set(0, 1.3, 0); foliage.castShadow = true; treeGO.add(foliage);
// seçim + ev hiyerarşi paneli (editördeki gibi)
const houseSelBox = new THREE.BoxHelper(houseGO, '#c792ea'); houseSelBox.material.depthTest = false; houseSelBox.visible = false; worldMini.scene.add(houseSelBox);
let houseSelected = null;
function selectHouse(node) { houseSelected = node; if (node) { houseSelBox.setFromObject(node); houseSelBox.visible = true; } else houseSelBox.visible = false; renderHouseTree(); }
function renderHouseTree() { const el = document.getElementById('houseTree'); if (!el) return; el.innerHTML = ''; el.appendChild(buildHouseNode(gardenGroup)); }
function buildHouseNode(node) { const li = document.createElement('li'); const row = document.createElement('div'); row.className = 'node-row' + (houseSelected === node ? ' selected' : ''); const kids = node.children.filter(c => c.userData && c.userData.isHouse); row.innerHTML = `<span class="twisty">${kids.length ? '▾' : ''}</span><span class="ico">${node.userData.icon || '◆'}</span><span class="nm">${node.name}</span>` + (node.userData.mesh ? '<span class="mesh-dot"></span>' : ''); row.addEventListener('click', (e) => { e.stopPropagation(); selectHouse(node); }); li.appendChild(row); if (kids.length) { const ul = document.createElement('ul'); kids.forEach(c => ul.appendChild(buildHouseNode(c))); li.appendChild(ul); } return li; }
const wRay = new THREE.Raycaster(), wPtr = new THREE.Vector2();
worldMini.renderer.domElement.addEventListener('pointerdown', (e) => { const r = worldMini.renderer.domElement.getBoundingClientRect(); wPtr.x = ((e.clientX - r.left) / r.width) * 2 - 1; wPtr.y = -((e.clientY - r.top) / r.height) * 2 + 1; wRay.setFromCamera(wPtr, worldMini.camera); const hits = wRay.intersectObjects(houseMeshes, false); if (hits.length) selectHouse(hits[0].object.userData.owner); });
const applyMatBtn = document.getElementById('applyMatBtn');
if (applyMatBtn) applyMatBtn.addEventListener('click', () => { wallsGO.userData.mesh.material = journey.material.clone(); wallsGO.userData.mesh.material.name = 'M_Custom'; showToast('🏠 ' + (LANG === 'tr' ? 'Materyalin evin duvarlarına uygulandı' : 'Your material applied to the house walls')); });
// ARABALAR — yol boyunca ilerler, harita kenarında kaybolur (fade)
function makePath(pts, closed) { const segs = []; let total = 0; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push({ a, b, len, acc: total }); total += len; } return { segs, total, closed }; }
function samplePath(p, d) { d = ((d % p.total) + p.total) % p.total; for (const s of p.segs) { if (d <= s.acc + s.len || s === p.segs[p.segs.length - 1]) { const t = Math.min(1, (d - s.acc) / s.len); return { x: s.a[0] + (s.b[0] - s.a[0]) * t, z: s.a[1] + (s.b[1] - s.a[1]) * t, dx: s.b[0] - s.a[0], dz: s.b[1] - s.a[1] }; } } return { x: 0, z: 0, dx: 1, dz: 0 }; }
function makeCar(color) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.4, transparent: true });
  const cabinMat = new THREE.MeshStandardMaterial({ color: '#e3ecf5', metalness: 0.1, roughness: 0.2, transparent: true });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.34, 0.62), bodyMat); body.position.y = 0.3; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, 0.52), cabinMat); cabin.position.set(-0.05, 0.57, 0); g.add(cabin);
  const wg = new THREE.CylinderGeometry(0.17, 0.17, 0.12, 12), wm = new THREE.MeshStandardMaterial({ color: '#15171c', roughness: 0.8 });
  [[0.37, 0.33], [-0.37, 0.33], [0.37, -0.33], [-0.37, -0.33]].forEach(([x, z]) => { const w = new THREE.Mesh(wg, wm); w.rotation.x = Math.PI / 2; w.position.set(x, 0.17, z); g.add(w); });
  const hlMat = new THREE.MeshBasicMaterial({ color: '#fff7e0' });
  [0.18, -0.18].forEach(z => { const h = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), hlMat); h.position.set(0.59, 0.3, z); g.add(h); });
  g.userData.fadeMats = [bodyMat, cabinMat]; return g;
}
const carColors = ['#ff6b6b', '#5aa9ff', '#ffd34e', '#4ec9b0', '#ffffff', '#c792ea'];
const ringPath = makePath([[-4.7, -4.7], [4.7, -4.7], [4.7, 4.7], [-4.7, 4.7], [-4.7, -4.7]], true);
const cars = [
  { path: ringPath, d: 0, speed: 2.2 },
  { path: ringPath, d: ringPath.total * 0.5, speed: 2.2 },
  { path: makePath([[-23, 5.05], [23, 5.05]]), d: 0, speed: 6.5 },
  { path: makePath([[23, 4.35], [-23, 4.35]]), d: 5, speed: 5.5 },
  { path: makePath([[5.05, -23], [5.05, 23]]), d: 10, speed: 6.0 },
].map((c, i) => { c.mesh = makeCar(carColors[i % carColors.length]); worldMini.scene.add(c.mesh); return c; });
const worldClock = new THREE.Clock();
(function loopWorld() {
  requestAnimationFrame(loopWorld);
  if (!worldMini.isVisible()) { worldClock.getDelta(); return; }   // saati tazele, render etme
  const dt = Math.min(0.05, worldClock.getDelta());
  cars.forEach(c => {
    c.d += c.speed * dt; const p = samplePath(c.path, c.d);
    c.mesh.position.set(p.x, 0, p.z); c.mesh.rotation.y = Math.atan2(-p.dz, p.dx);
    if (!c.path.closed) { const pr = (c.d % c.path.total) / c.path.total; const f = pr < 0.06 ? pr / 0.06 : pr > 0.94 ? (1 - pr) / 0.06 : 1; c.mesh.userData.fadeMats.forEach(m => m.opacity = Math.max(0, Math.min(1, f))); }
  });
  if (houseSelBox.visible) houseSelBox.update();
  worldMini.controls.update(); worldMini.renderer.render(worldMini.scene, worldMini.camera);
})();

// ==================================================================
//  HERO — büyük 3D (oyunsu giriş)
// ==================================================================
const heroMini = makeMiniScene(document.getElementById('heroCanvas'), new THREE.Vector3(0, 0.3, 5.2));
heroMini.controls.enableRotate = false; heroMini.controls.enableZoom = false;
const heroGroup = new THREE.Group(); heroMini.scene.add(heroGroup);
const heroCore = new THREE.Mesh(new THREE.IcosahedronGeometry(1.45, 1), new THREE.MeshStandardMaterial({ color: '#6db1ff', metalness: 0.55, roughness: 0.22, flatShading: true }));
heroGroup.add(heroCore);
const heroColors = ['#4ec9b0', '#ffb454', '#5aa9ff', '#ffd34e', '#c792ea', '#7ee787'];
const heroShapes = [new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.SphereGeometry(0.26, 20, 16), new THREE.TorusGeometry(0.24, 0.1, 12, 24), new THREE.ConeGeometry(0.26, 0.5, 18), new THREE.TetrahedronGeometry(0.34), new THREE.DodecahedronGeometry(0.28)];
const heroOrbs = heroColors.map((col, i) => { const m = new THREE.Mesh(heroShapes[i], new THREE.MeshStandardMaterial({ color: col, metalness: 0.35, roughness: 0.35 })); m.userData = { a: i / 6 * Math.PI * 2, r: 2.7, sp: 0.35 + i * 0.04, yo: (i % 2 ? 0.45 : -0.4) }; heroGroup.add(m); return m; });
const heroClock = new THREE.Clock();
(function loopHero() {
  requestAnimationFrame(loopHero);
  if (!heroMini.isVisible()) return;
  const t = heroClock.getElapsedTime();
  heroCore.rotation.set(t * 0.16, t * 0.3, 0);
  heroOrbs.forEach((m, i) => { const u = m.userData, a = u.a + t * u.sp; m.position.set(Math.cos(a) * u.r, Math.sin(t * 0.8 + i) * 0.4 + u.yo, Math.sin(a) * u.r); m.rotation.set(t * 0.6, t * 0.8, 0); });
  heroGroup.rotation.y = t * 0.06;
  heroMini.controls.update(); heroMini.renderer.render(heroMini.scene, heroMini.camera);
})();

// ==================================================================
//  AŞAMA 6 — TAM EDİTÖR
// ==================================================================
const viewportEl = document.getElementById('viewport'), hierarchyEl = document.getElementById('hierarchy'), inspectorEl = document.getElementById('inspector'), selNameEl = document.getElementById('selName'), loadingEl = document.getElementById('loading');
const scene = new THREE.Scene(); scene.background = new THREE.Color('#14161b'); scene.fog = new THREE.Fog('#14161b', 14, 30); scene.environment = ENV;
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
const DEFAULT_CAM = { pos: new THREE.Vector3(3.4, 2.6, 5.2), target: new THREE.Vector3(0, 1.4, 0) }; camera.position.copy(DEFAULT_CAM.pos);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; viewportEl.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.target.copy(DEFAULT_CAM.target); controls.minDistance = 2.5; controls.maxDistance = 16; controls.maxPolarAngle = Math.PI * 0.92;
scene.add(new THREE.HemisphereLight('#aac4ff', '#2a2a30', 0.45));
const keyLight = new THREE.DirectionalLight('#ffffff', 2.0); keyLight.position.set(4, 7, 5); keyLight.castShadow = true; keyLight.shadow.mapSize.set(1024, 1024); keyLight.shadow.camera.near = 1; keyLight.shadow.camera.far = 25; keyLight.shadow.camera.left = -6; keyLight.shadow.camera.right = 6; keyLight.shadow.camera.top = 6; keyLight.shadow.camera.bottom = -6; keyLight.shadow.bias = -0.0005; scene.add(keyLight);
const rimLight = new THREE.DirectionalLight('#4ec9b0', 0.7); rimLight.position.set(-5, 3, -4); scene.add(rimLight);
const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ color: '#23262e', roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const grid = new THREE.GridHelper(18, 36, '#3a4150', '#2a2f38'); grid.position.y = 0.001; scene.add(grid);

const materials = {
  body: new THREE.MeshStandardMaterial({ color: '#6db1ff', roughness: 0.4, metalness: 0.3, name: 'M_Body' }),
  head: new THREE.MeshStandardMaterial({ color: '#ffd27a', roughness: 0.32, metalness: 0.18, name: 'M_Head' }),
  joint: new THREE.MeshStandardMaterial({ color: '#dfe5ee', roughness: 0.22, metalness: 0.85, name: 'M_Joint' }),
};
const meshes = [], nodeList = [], joints = {};
function gameObject(name, parent, pos, icon = '◆') { const g = new THREE.Group(); g.name = name; g.position.set(pos[0], pos[1], pos[2]); g.userData = { isGameObject: true, icon, baseRot: new THREE.Euler() }; parent.add(g); joints[name] = g; nodeList.push(g); return g; }
function attachMesh(go, geom, mat, offset = [0, 0, 0]) { const m = new THREE.Mesh(geom, mat); m.position.set(offset[0], offset[1], offset[2]); m.castShadow = true; m.userData.owner = go; go.userData.mesh = m; go.add(m); meshes.push(m); return m; }
const G = { torso: new THREE.BoxGeometry(0.62, 0.7, 0.34), pelvis: new THREE.BoxGeometry(0.5, 0.26, 0.32), head: new THREE.SphereGeometry(0.23, 32, 24), upperArm: new THREE.CapsuleGeometry(0.085, 0.3, 6, 12), foreArm: new THREE.CapsuleGeometry(0.075, 0.28, 6, 12), thigh: new THREE.CapsuleGeometry(0.11, 0.34, 6, 12), shin: new THREE.CapsuleGeometry(0.095, 0.32, 6, 12), hand: new THREE.SphereGeometry(0.09, 16, 12), foot: new THREE.BoxGeometry(0.16, 0.1, 0.28), joint: new THREE.SphereGeometry(0.07, 16, 12) };
const avatar = gameObject('Robot_Avatar', scene, [0, 0, 0], '🤖');
const hips = gameObject('Hips', avatar, [0, 1.05, 0], '⬢'); attachMesh(hips, G.pelvis, materials.body);
const spine = gameObject('Spine', hips, [0, 0.28, 0], '┃');
const chest = gameObject('Chest', spine, [0, 0.18, 0], '⬛'); attachMesh(chest, G.torso, materials.body, [0, 0.16, 0]);
const neck = gameObject('Head', chest, [0, 0.55, 0], '🙂'); attachMesh(neck, G.head, materials.head);
// Yüz: gözler + gülümseme + anten (sabit süs, seçilemez)
const faceMat = new THREE.MeshStandardMaterial({ color: '#16181d', roughness: 0.3 });
[-0.08, 0.08].forEach(x => { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 10), faceMat); eye.position.set(x, 0.04, 0.21); neck.add(eye); const gl = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' })); gl.position.set(x + 0.012, 0.06, 0.235); neck.add(gl); });
const smile = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 10, 20, Math.PI), faceMat); smile.position.set(0, -0.04, 0.205); smile.rotation.set(Math.PI, 0, Math.PI); neck.add(smile);
const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8), materials.joint); antenna.position.set(0, 0.27, 0); neck.add(antenna);
const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 14, 10), new THREE.MeshStandardMaterial({ color: '#ff6b6b', emissive: '#ff3b3b', emissiveIntensity: 0.6, roughness: 0.4 })); antTip.position.set(0, 0.36, 0); neck.add(antTip);
function buildArm(side, label) { const sx = 0.36 * side; const shoulder = gameObject(`${label}Shoulder`, chest, [sx, 0.4, 0], '🔵'); attachMesh(shoulder, G.upperArm, materials.body, [0, -0.18, 0]); const elbow = gameObject(`${label}Elbow`, shoulder, [0, -0.38, 0], '🔹'); attachMesh(elbow, G.foreArm, materials.body, [0, -0.17, 0]); gameObject(`${label}Hand`, elbow, [0, -0.34, 0], '✊'); attachMesh(joints[`${label}Hand`], G.hand, materials.joint); attachMesh(shoulder, G.joint, materials.joint, [0, 0, 0]); }
buildArm(-1, 'L_Arm_'); buildArm(1, 'R_Arm_');
function buildLeg(side, label) { const sx = 0.16 * side; const hip = gameObject(`${label}Hip`, hips, [sx, -0.14, 0], '🔵'); attachMesh(hip, G.thigh, materials.body, [0, -0.2, 0]); const knee = gameObject(`${label}Knee`, hip, [0, -0.42, 0], '🔹'); attachMesh(knee, G.shin, materials.body, [0, -0.19, 0]); gameObject(`${label}Foot`, knee, [0, -0.4, 0.04], '👟'); attachMesh(joints[`${label}Foot`], G.foot, materials.joint, [0, -0.03, 0.06]); }
buildLeg(-1, 'L_Leg_'); buildLeg(1, 'R_Leg_');
nodeList.forEach(go => go.userData.baseRot.copy(go.rotation));

// Rig görselleştirme
const rigGroup = new THREE.Group(); rigGroup.visible = false; scene.add(rigGroup);
const boneJointMat = new THREE.MeshBasicMaterial({ color: '#ffb454', depthTest: false }), boneLineMat = new THREE.LineBasicMaterial({ color: '#ffd9a0', depthTest: false, transparent: true, opacity: 0.9 });
const rigJointMeshes = [], rigBones = [];
nodeList.forEach(go => { if (go === avatar) return; const jm = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), boneJointMat); jm.renderOrder = 999; jm.userData.target = go; rigGroup.add(jm); rigJointMeshes.push(jm); if (go.parent && go.parent.userData && go.parent.userData.isGameObject && go.parent !== avatar) { const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const line = new THREE.Line(geo, boneLineMat); line.renderOrder = 998; rigGroup.add(line); rigBones.push({ parent: go.parent, child: go, line }); } });
function updateRig() { if (!rigGroup.visible) return; const v = new THREE.Vector3(); rigJointMeshes.forEach(jm => { jm.userData.target.getWorldPosition(v); jm.position.copy(v); }); const a = new THREE.Vector3(), b = new THREE.Vector3(); rigBones.forEach(({ parent, child, line }) => { parent.getWorldPosition(a); child.getWorldPosition(b); const p = line.geometry.attributes.position; p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b.x, b.y, b.z); p.needsUpdate = true; }); }

let selected = null;
const selBox = new THREE.BoxHelper(avatar, '#5aa9ff'); selBox.material.depthTest = false; selBox.material.transparent = true; selBox.visible = false; scene.add(selBox);
function selectObject(go) { selected = go; selNameEl.textContent = go ? go.name : '—'; if (go) { selBox.setFromObject(go); selBox.visible = true; } else selBox.visible = false; renderHierarchy(); renderInspector(); }
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', (e) => { const r = renderer.domElement.getBoundingClientRect(); pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1; pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1; raycaster.setFromCamera(pointer, camera); const hits = raycaster.intersectObjects(meshes, false); if (hits.length) selectObject(hits[0].object.userData.owner); });

function renderHierarchy() { hierarchyEl.innerHTML = ''; hierarchyEl.appendChild(buildTreeNode(avatar)); }
function buildTreeNode(go) { const li = document.createElement('li'); const row = document.createElement('div'); row.className = 'node-row' + (selected === go ? ' selected' : ''); const childGOs = go.children.filter(c => c.userData && c.userData.isGameObject); row.innerHTML = `<span class="twisty">${childGOs.length ? '▾' : ''}</span><span class="ico">${go.userData.icon || '◆'}</span><span class="nm">${go.name}</span>` + (go.userData.mesh ? '<span class="mesh-dot"></span>' : ''); row.addEventListener('click', (e) => { e.stopPropagation(); selectObject(go); }); li.appendChild(row); if (childGOs.length) { const ul = document.createElement('ul'); childGOs.forEach(c => ul.appendChild(buildTreeNode(c))); li.appendChild(ul); } return li; }

const RAD = 180 / Math.PI;
const I18 = {
  transform: { tr: 'Transform', en: 'Transform' }, pos: { tr: 'Position (Konum)', en: 'Position' }, rot: { tr: 'Rotation (Dönüş °)', en: 'Rotation (°)' }, scale: { tr: 'Scale (Ölçek)', en: 'Scale' },
  material: { tr: 'Material', en: 'Material' }, albedo: { tr: 'Albedo (Renk)', en: 'Albedo (Color)' }, metal: { tr: 'Metalness (Metaliklik)', en: 'Metalness' }, rough: { tr: 'Roughness (Pürüzlülük)', en: 'Roughness' }, texture: { tr: 'Texture (Doku)', en: 'Texture' }, wire: { tr: 'Wireframe (Tel kafes)', en: 'Wireframe' },
  emptyGO: { tr: '🗂️ Bu bir <b>boş GameObject</b> (sadece Transform). Çocuklarını taşımak için kullanılır — örn. <code>Hips</code> tüm vücudu hareket ettirir.', en: '🗂️ This is an <b>empty GameObject</b> (Transform only). It moves its children — e.g. <code>Hips</code> moves the whole body.' },
  shareNote: { tr: 'Bu materyal birçok parça tarafından <b>paylaşılıyor</b>. Değiştirince hepsi birden değişir.', en: 'This material is <b>shared</b> by several parts. Editing it changes them all.' },
};
function renderInspector() {
  if (!selected) { inspectorEl.innerHTML = `<div class="empty-state">${LANG === 'tr' ? 'Bir nesne seç ve özelliklerini burada düzenle.' : 'Select an object to edit its properties.'}</div>`; return; }
  const go = selected, mesh = go.userData.mesh, mat = mesh ? mesh.material : null; inspectorEl.innerHTML = '';
  const head = document.createElement('div'); head.style.marginBottom = '14px'; head.innerHTML = `<div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:4px">${go.userData.icon || '◆'} ${go.name}</div><span class="type-pill">GameObject</span> ${mesh ? '<span class="type-pill" style="background:rgba(78,201,176,.16);color:#4ec9b0;border-color:rgba(78,201,176,.3)">Mesh Renderer</span>' : ''}`; inspectorEl.appendChild(head);
  const tSec = section('📐', L(I18.transform), L({ tr: 'Konum, Dönüş, Ölçek', en: 'Position, Rotation, Scale' }));
  tSec.body.appendChild(vec3Field(L(I18.pos), go.position, 0.01, (axis, val) => { go.position[axis] = val; refreshSelBox(); }));
  tSec.body.appendChild(vec3FieldDeg(L(I18.rot), go, (axis, deg) => { go.rotation[axis] = deg / RAD; go.userData.baseRot[axis] = deg / RAD; refreshSelBox(); }));
  tSec.body.appendChild(sliderField(L(I18.scale), go.scale.x, 0.2, 2.5, 0.01, (v) => { go.scale.setScalar(v); refreshSelBox(); }, (v) => v.toFixed(2) + '×'));
  inspectorEl.appendChild(tSec.sec);
  if (mat) {
    const mSec = section('🎨', L(I18.material), mat.name || 'Standard');
    mSec.body.appendChild(colorField(L(I18.albedo), '#' + mat.color.getHexString(), (hex) => mat.color.set(hex)));
    mSec.body.appendChild(sliderField(L(I18.metal), mat.metalness, 0, 1, 0.01, (v) => mat.metalness = v, (v) => v.toFixed(2)));
    mSec.body.appendChild(sliderField(L(I18.rough), mat.roughness, 0, 1, 0.01, (v) => mat.roughness = v, (v) => v.toFixed(2)));
    const curKey = Object.keys(TEXTURES).find(k => TEXTURES[k].tex === mat.map) || 'none';
    mSec.body.appendChild(selectField(L(I18.texture), TEXTURES, curKey, (key) => { mat.map = TEXTURES[key].tex; mat.needsUpdate = true; }));
    mSec.body.appendChild(checkField(L(I18.wire), mat.wireframe, (v) => mat.wireframe = v));
    const note = document.createElement('p'); note.className = 'material-note'; note.innerHTML = '💡 ' + L(I18.shareNote); mSec.body.appendChild(note); inspectorEl.appendChild(mSec.sec);
  } else { const info = document.createElement('p'); info.className = 'material-note'; info.style.padding = '4px 2px'; info.innerHTML = L(I18.emptyGO); inspectorEl.appendChild(info); }
}
function refreshSelBox() { if (selected) selBox.setFromObject(selected); }
function section(icon, title, sub) { const sec = document.createElement('div'); sec.className = 'insp-section'; const head = document.createElement('div'); head.className = 'insp-section-head'; head.innerHTML = `<span class="si">${icon}</span> ${title} <span style="color:#6b7280;font-weight:400;font-size:11px;margin-left:auto">${sub || ''}</span>`; const body = document.createElement('div'); body.className = 'insp-section-body'; sec.appendChild(head); sec.appendChild(body); return { sec, body }; }
function vec3Field(label, vec, step, onChange) { const f = document.createElement('div'); f.className = 'field'; f.innerHTML = `<div class="field-label"><span>${label}</span></div>`; const grid = document.createElement('div'); grid.className = 'vec3'; ['x', 'y', 'z'].forEach(axis => { const w = document.createElement('div'); w.className = 'axis ' + axis; const i = document.createElement('input'); i.type = 'number'; i.step = step; i.value = vec[axis].toFixed(2); i.addEventListener('input', () => onChange(axis, parseFloat(i.value) || 0)); w.innerHTML = `<label>${axis.toUpperCase()}</label>`; w.appendChild(i); grid.appendChild(w); }); f.appendChild(grid); return f; }
function vec3FieldDeg(label, go, onChange) { const f = document.createElement('div'); f.className = 'field'; f.innerHTML = `<div class="field-label"><span>${label}</span></div>`; const grid = document.createElement('div'); grid.className = 'vec3'; ['x', 'y', 'z'].forEach(axis => { const w = document.createElement('div'); w.className = 'axis ' + axis; const i = document.createElement('input'); i.type = 'number'; i.step = 1; i.value = Math.round(go.rotation[axis] * RAD); i.addEventListener('input', () => onChange(axis, parseFloat(i.value) || 0)); w.innerHTML = `<label>${axis.toUpperCase()}</label>`; w.appendChild(i); grid.appendChild(w); }); f.appendChild(grid); return f; }
function sliderField(label, value, min, max, step, onChange, fmt = (v) => v) { const f = document.createElement('div'); f.className = 'field'; f.innerHTML = `<div class="field-label"><span>${label}</span><span class="val" data-val>${fmt(value)}</span></div>`; const i = document.createElement('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = value; const valEl = f.querySelector('[data-val]'); i.addEventListener('input', () => { const v = parseFloat(i.value); valEl.textContent = fmt(v); onChange(v); }); f.appendChild(i); return f; }
function colorField(label, value, onChange) { const f = document.createElement('div'); f.className = 'field'; f.innerHTML = `<div class="field-label"><span>${label}</span></div>`; const i = document.createElement('input'); i.type = 'color'; i.value = value; i.addEventListener('input', () => onChange(i.value)); f.appendChild(i); return f; }
function selectField(label, options, current, onChange) { const f = document.createElement('div'); f.className = 'field'; f.innerHTML = `<div class="field-label"><span>${label}</span></div>`; const s = document.createElement('select'); Object.keys(options).forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = L(options[k].label); if (k === current) o.selected = true; s.appendChild(o); }); s.addEventListener('change', () => onChange(s.value)); f.appendChild(s); return f; }
function checkField(label, value, onChange) { const f = document.createElement('label'); f.className = 'field checkbox-row'; const i = document.createElement('input'); i.type = 'checkbox'; i.checked = value; i.addEventListener('change', () => onChange(i.checked)); f.appendChild(i); const s = document.createElement('span'); s.textContent = label; f.appendChild(s); return f; }

let currentAnim = 'stop';
const animatable = ['Spine', 'Chest', 'Head', 'L_Arm_Shoulder', 'L_Arm_Elbow', 'R_Arm_Shoulder', 'R_Arm_Elbow', 'L_Leg_Hip', 'L_Leg_Knee', 'R_Leg_Hip', 'R_Leg_Knee'];
function resetPose() { animatable.forEach(n => joints[n].rotation.copy(joints[n].userData.baseRot)); avatar.position.y = 0; }
function applyAnimation(t) {
  if (currentAnim === 'stop') return; resetPose(); const s = Math.sin, c = Math.cos;
  if (currentAnim === 'idle') { const b = s(t * 1.6); joints.Chest.rotation.x = b * 0.04 + 0.02; joints.Head.rotation.y = s(t * 0.8) * 0.18; joints.Head.rotation.z = b * 0.03; joints.L_Arm_Shoulder.rotation.z = -0.08 + b * 0.04; joints.R_Arm_Shoulder.rotation.z = 0.08 - b * 0.04; avatar.position.y = b * 0.015; }
  else if (currentAnim === 'wave') { joints.R_Arm_Shoulder.rotation.z = -2.3; joints.R_Arm_Shoulder.rotation.x = 0.2; joints.R_Arm_Elbow.rotation.z = -0.3 + s(t * 9) * 0.5; joints.Head.rotation.y = 0.25; joints.Chest.rotation.y = 0.1; joints.L_Arm_Shoulder.rotation.z = -0.1 + s(t * 1.6) * 0.05; }
  else if (currentAnim === 'walk') { const w = t * 4.2; joints.L_Leg_Hip.rotation.x = s(w) * 0.6; joints.R_Leg_Hip.rotation.x = s(w + Math.PI) * 0.6; joints.L_Leg_Knee.rotation.x = Math.max(0, -c(w)) * 0.9; joints.R_Leg_Knee.rotation.x = Math.max(0, -c(w + Math.PI)) * 0.9; joints.L_Arm_Shoulder.rotation.x = s(w + Math.PI) * 0.5; joints.R_Arm_Shoulder.rotation.x = s(w) * 0.5; joints.L_Arm_Elbow.rotation.x = -0.3; joints.R_Arm_Elbow.rotation.x = -0.3; joints.Chest.rotation.y = s(w) * 0.12; avatar.position.y = Math.abs(s(w)) * 0.06; }
}
function setAnim(name) { currentAnim = name; document.querySelectorAll('[data-anim]').forEach(b => b.classList.toggle('active', b.dataset.anim === name)); if (name === 'stop') { resetPose(); renderInspector(); } }
document.querySelectorAll('[data-anim]').forEach(b => b.addEventListener('click', () => setAnim(b.dataset.anim)));
let globalWire = false;
document.getElementById('toggleWireframe').addEventListener('click', (e) => { globalWire = !globalWire; Object.values(materials).forEach(m => m.wireframe = globalWire); e.currentTarget.classList.toggle('active', globalWire); renderInspector(); });
document.getElementById('toggleRig').addEventListener('click', (e) => { rigGroup.visible = !rigGroup.visible; e.currentTarget.classList.toggle('active', rigGroup.visible); });
document.getElementById('resetView').addEventListener('click', () => { camera.position.copy(DEFAULT_CAM.pos); controls.target.copy(DEFAULT_CAM.target); });

// Editör turu
const lessons = [
  { chip: 'Hierarchy', icon: '⛬', title: { tr: 'Hiyerarşi — Parent / Child', en: 'Hierarchy — Parent / Child' }, body: { tr: 'Bir <b>parent</b> hareket edince tüm <b>child</b>\'ları onunla hareket eder. <code>Hips</code> seçili: <b>Rotation Y</b>\'yi değiştir → tüm gövde döner.', en: 'When a <b>parent</b> moves, all its <b>children</b> move too. <code>Hips</code> is selected — change <b>Rotation Y</b> and the whole body turns.' }, focus: 'Hips' },
  { chip: 'Mesh', icon: '🔻', title: { tr: 'Mesh — Nesnenin şekli', en: 'Mesh — The shape' }, body: { tr: 'Mesh, köşe ve üçgenlerden oluşur. Üstteki <b>🔲 Wireframe</b>\'e bas → üçgenleri gör.', en: 'A mesh is vertices and triangles. Hit <b>🔲 Wireframe</b> to see them.' }, focus: 'Chest', action: () => { if (!globalWire) document.getElementById('toggleWireframe').click(); } },
  { chip: 'Rig', icon: '🦴', title: { tr: 'Rig — İskelet', en: 'Rig — The skeleton' }, body: { tr: '<b>🦴 Rig</b>\'e bas → eklem ve kemikleri gör. Her eklem bir GameObject\'tir.', en: 'Hit <b>🦴 Rig</b> to see joints and bones. Each joint is a GameObject.' }, focus: 'R_Arm_Shoulder', action: () => { if (globalWire) document.getElementById('toggleWireframe').click(); if (!rigGroup.visible) document.getElementById('toggleRig').click(); } },
  { chip: 'Animation', icon: '🎬', title: { tr: 'Animation — Zamanla pozlar', en: 'Animation — Poses over time' }, body: { tr: '<b>👋 El Salla</b> ve <b>🚶 Yürü</b>\'ye bas. Rig açıkken eklemlerin döndüğünü izle.', en: 'Hit <b>👋 Wave</b> and <b>🚶 Walk</b>. With the rig on, watch the joints rotate.' }, focus: 'R_Arm_Shoulder', action: () => setAnim('wave') },
  { chip: 'Avatar', icon: '🤖', title: { tr: 'Avatar — Hepsi bir arada', en: 'Avatar — All together' }, body: { tr: 'Avatar = Mesh + Material + Texture + Rig + Animation, bir <b>Hiyerarşi</b> içinde. Tebrikler! 🎉', en: 'Avatar = Mesh + Material + Texture + Rig + Animation, in a <b>Hierarchy</b>. Congrats! 🎉' }, focus: 'Robot_Avatar', action: () => setAnim('walk') },
];
let lessonIdx = -1;
const lessonStepEl = document.getElementById('lessonStep'), lessonChipEl = document.getElementById('lessonChip'), lessonTitleEl = document.getElementById('lessonTitle'), lessonBodyEl = document.getElementById('lessonBody'), lessonIconEl = document.getElementById('lessonIcon'), lessonDotsEl = document.getElementById('lessonDots');
lessons.forEach((_, i) => { const d = document.createElement('div'); d.className = 'dot'; d.addEventListener('click', () => gotoLesson(i)); lessonDotsEl.appendChild(d); });
function gotoLesson(i) { if (i < 0 || i >= lessons.length) return; lessonIdx = i; const Ls = lessons[i]; lessonStepEl.textContent = `${LANG === 'tr' ? 'Tur' : 'Tour'} ${i + 1} / ${lessons.length}`; lessonChipEl.textContent = Ls.chip; lessonTitleEl.textContent = L(Ls.title); lessonBodyEl.innerHTML = L(Ls.body); lessonIconEl.textContent = Ls.icon;[...lessonDotsEl.children].forEach((d, k) => d.classList.toggle('active', k === i)); if (Ls.action) Ls.action(); if (Ls.focus && joints[Ls.focus]) selectObject(joints[Ls.focus]); const bar = document.getElementById('lessonBar'); bar.classList.remove('flash'); void bar.offsetWidth; bar.classList.add('flash'); }
document.getElementById('nextLesson').addEventListener('click', () => gotoLesson(Math.min(lessonIdx + 1, lessons.length - 1)));
document.getElementById('prevLesson').addEventListener('click', () => gotoLesson(Math.max(lessonIdx - 1, 0)));

// ------------------------------------------------------------------
//  KOD SEKMESİ — snippet + basit vurgulayıcı + kopyala
// ------------------------------------------------------------------
const CODE = {
  1: `// A texture is a 2D image wrapped on a surface\nconst tex = new THREE.CanvasTexture(myCanvas);\ntex.colorSpace = THREE.SRGBColorSpace;\ntex.wrapS = THREE.RepeatWrapping;   // tiling\ntex.wrapT = THREE.RepeatWrapping;\ntex.repeat.set(3, 3);               // 3x3 tiles`,
  2: `// A material = texture + surface properties\nconst material = new THREE.MeshStandardMaterial({\n  map: tex,            // Base / Albedo map\n  color: 0xffffff,     // tint\n  metalness: 0.3,      // is it metal?\n  roughness: 0.5       // matte or glossy?\n});`,
  3: `// Mesh = geometry (shape) + material (look)\nconst geometry = new THREE.BoxGeometry(1, 1, 1);\nconst mesh = new THREE.Mesh(geometry, material);\n\n// A GameObject holds a Transform + components\nmesh.position.set(0, 0, 0);   // Transform\nscene.add(mesh);              // now it is visible`,
  4: `// Light decides how a surface looks\nconst light = new THREE.DirectionalLight(0xffffff, 2.4);\nlight.position.set(3, 5, 4);\nscene.add(light);\n\n// Normal map = bumpy detail, no extra geometry\nmaterial.normalMap = normalTexture;   // toggle on/off\nmaterial.roughness = 0.4;             // matte vs glossy`,
  5: `// A whole scene is a hierarchy of GameObjects too\nconst garden = new THREE.Group();\nconst house  = new THREE.Group();        // parent\nhouse.add(walls);   // walls wear YOUR material\nhouse.add(roof);\nhouse.add(door);\ngarden.add(house);  // house nested in the garden\nscene.add(garden);\n\n// A car drives a path, fading out at the map edge\ncar.position.copy(path.sampleAt(distance));`,
  6: `// Hierarchy: a parent moves all its children\nconst shoulder = new THREE.Group();\nconst elbow = new THREE.Group();\nshoulder.add(elbow);     // elbow is child of shoulder\nchest.add(shoulder);\n\n// Animation: rotate joints over time\nfunction animate(t) {\n  shoulder.rotation.z = Math.sin(t * 4) * 0.5;   // wave\n  requestAnimationFrame(animate);\n}`,
};
function hl(src) {
  // HTML kaçışı, sonra TEK geçişte tokenize (eklenen span'ler yeniden taranmaz)
  src = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const re = /(\/\/[^\n]*)|('[^'\n]*'|"[^"\n]*"|`[^`]*`)|(\b0x[0-9a-fA-F]+\b|\b\d+\.?\d*\b)|(\b(?:const|let|var|new|function|return|for|if|else|import|from|export)\b)/g;
  return src.replace(re, (m, c, s, n, k) => {
    if (c) return '<span class="tok-c">' + c + '</span>';
    if (s) return '<span class="tok-s">' + s + '</span>';
    if (n) return '<span class="tok-n">' + n + '</span>';
    if (k) return '<span class="tok-k">' + k + '</span>';
    return m;
  });
}
function renderCode() { for (let n = 1; n <= 6; n++) { const pre = document.getElementById('code-' + n); if (pre) pre.innerHTML = hl(CODE[n]); } }
document.querySelectorAll('.copy-btn').forEach(btn => btn.addEventListener('click', async () => { const n = btn.dataset.code; try { await navigator.clipboard.writeText(CODE[n]); const sp = btn.querySelector('span'); const old = sp.textContent; sp.textContent = LANG === 'tr' ? 'Kopyalandı ✓' : 'Copied ✓'; setTimeout(() => sp.textContent = old, 1400); } catch (e) {} }));

// "Kodu Göster" aç/kapat
document.querySelectorAll('.code-toggle').forEach(btn => btn.addEventListener('click', () => {
  const panel = document.getElementById('codePanel-' + btn.dataset.code);
  const nowHidden = panel.classList.toggle('hidden');
  btn.classList.toggle('open', !nowHidden);
  const label = btn.querySelector('[data-i18n="code.show"]');
  if (label) label.textContent = nowHidden ? L(STR['code.show']) : L(STR['code.hide']);
}));
// Üstteki rozet takipçisine tıkla → bitirme rozetine git
document.getElementById('badgeTracker').addEventListener('click', () => document.getElementById('finale').scrollIntoView({ behavior: 'smooth' }));

// ------------------------------------------------------------------
//  MİNİ GÖREVLER (tek şerit) + BİTİRME ROZETİ
// ------------------------------------------------------------------
const CHAL = {
  1: { goal: { tr: '<b>Tuğla</b> dokusunu seç.', en: 'Pick the <b>Brick</b> texture.' }, check: () => journey.texKey === 'brick' },
  2: { goal: { tr: 'Altın gibi parlak metal yap: <b>Metalness ≥ 0.8</b> ve <b>Roughness ≤ 0.2</b>.', en: 'Make shiny gold metal: <b>Metalness ≥ 0.8</b> and <b>Roughness ≤ 0.2</b>.' }, check: () => journey.material.metalness >= 0.8 && journey.material.roughness <= 0.2 },
  3: { goal: { tr: 'Bir <b>Mesh ekle</b> ve üstüne <b>Material uygula</b>.', en: '<b>Add a Mesh</b> and <b>apply a Material</b> to it.' }, check: () => goStep >= 2 },
  4: { goal: { tr: '<b>Normal Map\'i aç</b> ve ışığı gezdirip pürüzü gör.', en: '<b>Turn on the Normal Map</b> and move the light to see the bumps.' }, check: () => lsState.normalOn === true },
  5: { goal: { tr: 'Hiyerarşiden <b>evin bir parçasını seç</b> (örn. Çatı).', en: '<b>Select a house part</b> from the hierarchy (e.g. Roof).' }, check: () => houseSelected !== null && houseSelected !== gardenGroup },
  6: { goal: { tr: '<b>🚶 Yürü</b> animasyonunu oynat.', en: 'Play the <b>🚶 Walk</b> animation.' }, check: () => currentAnim === 'walk' },
};
const doneSet = new Set();
function renderTasks() {
  for (let n = 1; n <= 6; n++) {
    const el = document.getElementById('task-' + n); if (!el) continue; const isDone = doneSet.has(n);
    el.innerHTML = `<div class="task-icon">🎯</div>` +
      `<div class="task-main"><div class="task-label">${LANG === 'tr' ? '◆ GÖREV' : '◆ QUEST'}</div><div class="task-goal">${L(CHAL[n].goal)}</div></div>` +
      `<div class="task-status ${isDone ? 'done' : ''}"><span>${isDone ? '✅' : '⏳'}</span><span>${isDone ? (LANG === 'tr' ? 'TAMAM' : 'COMPLETE') : (LANG === 'tr' ? 'BEKLİYOR' : 'LOCKED')}</span></div>` +
      `<div class="task-progress">🏅 <b>${doneSet.size}/6</b></div>`;
  }
}
function updateTracker() {
  const c = document.getElementById('trackerCount'); if (c) c.textContent = `${doneSet.size}/6`;
  const t = document.getElementById('badgeTracker'); if (t) { t.classList.toggle('complete', doneSet.size >= 6); t.classList.toggle('locked', doneSet.size < 6); }
}
function markDone(n) {
  if (doneSet.has(n)) return; doneSet.add(n);
  renderTasks(); updateTracker(); updateFinale();
  const pill = document.querySelector(`#roadmap a[href="#stage-${n}"]`); if (pill) pill.classList.add('done');
  showToast('⚡ ' + (LANG === 'tr' ? `GÖREV TAMAM!  ·  🏅 ${doneSet.size}/6` : `QUEST COMPLETE!  ·  🏅 ${doneSet.size}/6`));
}
function evaluateChallenges() { for (let n = 1; n <= 6; n++) { if (!doneSet.has(n)) { try { if (CHAL[n].check()) markDone(n); } catch (e) {} } } }
function updateFinale() {
  const cnt = doneSet.size; const fc = document.getElementById('finaleCount'); if (fc) fc.textContent = `${cnt} / 6`;
  const fill = document.getElementById('finaleFill'); if (fill) fill.style.width = (cnt / 6 * 100) + '%';
  const fin = document.getElementById('finale'); const ft = document.getElementById('finaleTitle'), fb = document.getElementById('finaleBody');
  if (cnt >= 6) { fin.classList.remove('locked'); ft.textContent = L(STR['finale.doneTitle']); fb.innerHTML = L(STR['finale.doneBody']); }
  else { fin.classList.add('locked'); ft.textContent = L(STR['finale.lockedTitle']); fb.innerHTML = L(STR['finale.lockedBody']); }
}

// ------------------------------------------------------------------
//  Kavram sözlüğü
// ------------------------------------------------------------------
const glossary = [
  ['📷', 'Texture', { tr: 'Doku', en: 'Texture' }, { tr: 'Yüzeye UV ile sarılan 2B görüntü.', en: 'A 2D image wrapped on a surface via UV.' }],
  ['🎨', 'Material', { tr: 'Materyal', en: 'Material' }, { tr: 'Texture + özellikler (renk, metalness, roughness).', en: 'Texture + properties (color, metalness, roughness).' }],
  ['🔻', 'Mesh', { tr: 'Ağ / Örgü', en: 'Mesh' }, { tr: 'Vertices ve faces\'ten oluşan 3B şekil.', en: 'A 3D shape of vertices and faces.' }],
  ['🧊', 'GameObject', { tr: 'Oyun Nesnesi', en: 'GameObject' }, { tr: 'Transform + bileşenler taşıyan kap.', en: 'A container with a Transform + components.' }],
  ['💡', 'Lighting', { tr: 'Işık', en: 'Lighting' }, { tr: 'Materyali görünür kılan; yön/şiddet/renk önemli.', en: 'Makes materials visible; direction/intensity/color matter.' }],
  ['🗿', 'Normal Map', { tr: 'Normal Map', en: 'Normal Map' }, { tr: 'Geometri değişmeden ışıkla pürüz taklidi.', en: 'Fakes bumps via lighting, geometry unchanged.' }],
  ['⛬', 'Hierarchy', { tr: 'Hiyerarşi', en: 'Hierarchy' }, { tr: 'Parent-child ağacı; parent\'ı taşı, çocuklar gelir.', en: 'Parent-child tree; move the parent, children follow.' }],
  ['🦴', 'Rig', { tr: 'İskelet', en: 'Rig' }, { tr: 'Eklem hiyerarşisi; avatarı hareket ettirir.', en: 'A joint hierarchy that moves the avatar.' }],
  ['🎬', 'Animation', { tr: 'Animasyon', en: 'Animation' }, { tr: 'Eklem değerlerinin zamanla değişmesi.', en: 'Joint values changing over time.' }],
  ['🤖', 'Avatar', { tr: 'Avatar', en: 'Avatar' }, { tr: 'Tüm katmanların birleştiği tam karakter.', en: 'The full character where all layers meet.' }],
];
const glossaryGrid = document.getElementById('glossaryGrid');
function renderGlossary() { glossaryGrid.innerHTML = ''; glossary.forEach(([ico, en, tr, desc]) => { const card = document.createElement('div'); card.className = 'gloss-card'; card.innerHTML = `<div class="gico">${ico}</div><h3>${L(tr)}</h3><div class="en">${en}</div><p>${L(desc)}</p>`; glossaryGrid.appendChild(card); }); }

// ------------------------------------------------------------------
//  Scroll-reveal, ilerleme çubuğu, toast, pulse
// ------------------------------------------------------------------
const revealObs = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } }); }, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
const progressEl = document.getElementById('scrollProgress');
function updateProgress() { const h = document.documentElement.scrollHeight - window.innerHeight; progressEl.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%'; }
window.addEventListener('scroll', updateProgress, { passive: true });
let toastTimer = null;
function showToast(msg) { const t = document.getElementById('toast'); t.innerHTML = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2300); }
function pulse(el) { if (!el) return; el.classList.remove('pulse-once'); void el.offsetWidth; el.classList.add('pulse-once'); }

// Yol haritası scroll-spy (6 aşama)
const rmLinks = [...document.querySelectorAll('#roadmap a')];
const stageEls = ['stage-1', 'stage-2', 'stage-3', 'stage-4', 'stage-5', 'stage-6'].map(id => document.getElementById(id));
const spy = new IntersectionObserver((entries) => { entries.forEach(en => { if (en.isIntersecting) { const i = stageEls.indexOf(en.target); rmLinks.forEach((a, k) => a.classList.toggle('active', k === i)); } }); }, { rootMargin: '-40% 0px -55% 0px' });
stageEls.forEach(s => spy.observe(s));

// ------------------------------------------------------------------
//  i18n
// ------------------------------------------------------------------
const STR = {
  'brand.title': { tr: 'Oyun Motoru Atölyesi', en: 'Game Engine Studio' },
  'brand.sub': { tr: '2D Görsel → 3D Oyun Nesnesi', en: '2D Image → 3D Game Object' },
  'brand.start': { tr: '▶ PRESS START', en: '▶ PRESS START' },
  'hero.eyebrow': { tr: '🕹️ ETKİLEŞİMLİ 3D ARCADE', en: '🕹️ INTERACTIVE 3D ARCADE' },
  'hero.title': { tr: 'Bir 2D görselden,<br>yaşayan bir 3D oyun nesnesine', en: 'From a 2D image<br>to a living 3D game object' },
  'hero.lead': { tr: 'Bir karakter aslında tek parça değildir; üst üste binen katmanlardan oluşur. Burada o katmanları kendi ellerinle koyacaksın: doku, materyal, ışık, iskelet, animasyon. Ben anlatmıyorum, sen yapıyorsun.', en: 'A character isn\'t one solid thing; it\'s layers stacked on top of each other. Here you put those layers down yourself: texture, material, light, rig, animation. I\'m not lecturing — you\'re building.' },
  'hero.hint': { tr: '6 aşama · her birinde mini görev · TR/EN', en: '6 stages · a mini task in each · TR/EN' },
  'rm.texture': { tr: 'Texture', en: 'Texture' }, 'rm.material': { tr: 'Material', en: 'Material' }, 'rm.gameobject': { tr: 'GameObject', en: 'GameObject' }, 'rm.surface': { tr: 'Işık & Yüzey', en: 'Light & Surface' }, 'rm.world': { tr: 'Dünya', en: 'World' }, 'rm.avatar': { tr: 'Avatar', en: 'Avatar' },
  'copy': { tr: 'Kopyala', en: 'Copy' }, 'code.show': { tr: 'Kodu Göster', en: 'Show Code' }, 'code.hide': { tr: 'Kodu Gizle', en: 'Hide Code' }, 'code.note': { tr: 'Yukarıdaki kavramın gerçek Three.js karşılığı budur.', en: 'This is the real Three.js code behind the concept above.' },
  's1.title': { tr: 'Her şey bir 2D görselle başlar', en: 'It all starts with a 2D image' },
  's1.p1': { tr: '<b>Doku (texture)</b> dediğimiz şey aslında sıradan bir resimdir. Telefonundaki bir fotoğraftan farkı yok: yan yana dizilmiş pikseller. Tek başına 3 boyutlu hiçbir şey yapmaz; bir yüzeye giydirilmeyi bekler.', en: 'A <b>texture</b> is really just an image. No different from a photo on your phone: pixels in a grid. By itself it does nothing in 3D; it\'s waiting to be wrapped onto a surface.' },
  's1.p2': { tr: 'Aşağıdan bir desen seç. Sağda iki şeyi yan yana göreceksin: resmin düz hâli ve bir yüzeye yayıldığında nasıl tekrar tekrar döşendiği (buna <b>tiling</b> denir). Peki resim modelin neresine denk gelecek? Onu <b>UV haritası</b> belirler — modelin açılıp düzleştirilmiş hâli gibi düşün.', en: 'Pick a pattern below. On the right you\'ll see two things side by side: the flat image, and how it tiles across a surface. So which part of the image lands where on the model? A <b>UV map</b> decides — think of it as the model unfolded and flattened.' },
  's1.note': { tr: '💡 Seçtiğin doku bir sonraki adıma, <b>Material Stüdyosu</b>\'na kendiliğinden geçecek.', en: '💡 The texture you pick carries over to the next step, the <b>Material Studio</b>, on its own.' },
  's1.fact': { tr: 'Eski oyunlarda dokular neden hep 256×256, 512×512 gibi 2\'nin kuvveti boyutlardaydı? Ekran kartları bu boyutları belleğe daha verimli yerleştirir ve uzaktaki yüzeyler için küçültülmüş kopyalar (<b>mipmap</b>) üretmek kolaylaşır. Bugün zorunlu değil ama alışkanlık hâlâ sürüyor.', en: 'Ever notice old-game textures were always sizes like 256×256 or 512×512? Powers of two pack into GPU memory more efficiently and make shrunk-down copies for distant surfaces (<b>mipmaps</b>) easy to build. Not required today, but the habit stuck.' },
  's1.cap2d': { tr: '2B görüntü (piksel ızgarası)', en: '2D image (pixel grid)' }, 's1.captile': { tr: 'Yüzeyde tekrarlanışı (tiling)', en: 'Tiling on a surface' },
  's2.title': { tr: 'Texture + Özellikler = Material', en: 'Texture + Properties = Material' },
  's2.p1': { tr: '<b>Materyal</b>, bir yüzeyin ışıkla nasıl davranacağının tarifidir. İçine bir doku koyarsın (Base/Albedo), sonra birkaç ayar eklersin: rengini, ne kadar metalik olduğunu (<b>metalness</b>) ve pürüzlü mü yoksa cilalı mı olduğunu (<b>roughness</b>).', en: 'A <b>material</b> is a recipe for how a surface behaves with light. You drop a texture in (Base/Albedo), then add a few dials: its tint, how metallic it is (<b>metalness</b>), and whether it\'s rough or polished (<b>roughness</b>).' },
  's2.p2': { tr: 'Aşağıdaki kart, Unity\'deki Material panelinin neredeyse aynısı. Doku yuvasını doldur, kaydırıcılarla oyna; sağdaki küre her dokunuşunda anında değişir. Kaydırıcıları uçlara çek, abart — sezgi en iyi böyle gelişir.', en: 'The card below is almost exactly Unity\'s Material panel. Fill the texture slot, push the sliders, and the sphere updates instantly. Crank them to the extremes — that\'s how the intuition clicks.' },
  's2.basemap': { tr: 'Base Map (Albedo · Texture)', en: 'Base Map (Albedo · Texture)' }, 's2.tint': { tr: 'Tint / Renk Tonu', en: 'Tint / Color' }, 's2.note': { tr: '💡 Burada hazırladığın materyal, sonraki adımlarda hem bir <b>GameObject</b>\'e hem de bir <b>eve</b> giydirilecek.', en: '💡 The material you build here gets put onto a <b>GameObject</b> and onto a <b>house</b> in the next steps.' }, 's2.previewtag': { tr: 'Canlı Material Önizleme', en: 'Live Material Preview' },
  's2.fact': { tr: '<b>metalness</b> ve <b>roughness</b> aslında PBR\'den gelir: <b>Physically Based Rendering</b>, yani ışığı gerçek fizik kurallarına yakın hesaplama. Mantık şu: gerçek malzemeler de ya metaldir ya değil, ya pürüzlüdür ya parlak. Bu yüzden iyi bir materyal güneşte de mum ışığında da inandırıcı görünür.', en: '<b>metalness</b> and <b>roughness</b> come from PBR: <b>Physically Based Rendering</b>, computing light close to real physics. The idea: real materials are either metal or not, either rough or glossy. That\'s why a good material looks believable in sunlight and candlelight alike.' },
  's3.title': { tr: 'Mesh\'e Material ekle → GameObject doğsun', en: 'Add a Material to a Mesh → a GameObject is born' },
  's3.p1': { tr: '<b>GameObject</b>, sahnedeki boş bir kutu gibidir. Başlangıçta elinde sadece bir <b>Transform</b> vardır: nerede durduğu, nasıl döndüğü, ne kadar büyük olduğu. Görünür olması için ona <b>bileşenler</b> takarsın.', en: 'A <b>GameObject</b> is like an empty box in the scene. At first all it has is a <b>Transform</b>: where it sits, how it\'s rotated, how big it is. To make it visible, you bolt <b>components</b> onto it.' },
  's3.p2': { tr: '<b>Mesh</b>, nesnenin iskeletsiz şeklidir: köşe noktaları ve onları birleştiren üçgenler. Ama tek başına renksiz, gri bir hayalettir. <b>Material</b> ise o şeklin derisi. İkisini bir GameObject\'te birleştirdiğin an ekranda gerçek bir nesne belirir.', en: 'A <b>Mesh</b> is the object\'s bare shape: vertices and the triangles connecting them. On its own it\'s a gray, colorless ghost. The <b>Material</b> is its skin. The moment you combine the two in a GameObject, a real object appears on screen.' },
  's3.instr': { tr: 'Sırayla adımları çalıştır:', en: 'Run the steps in order:' }, 's3.step1': { tr: '+ Mesh (şekil) ekle', en: '+ Add Mesh (shape)' }, 's3.step2': { tr: '+ Material uygula (Aşama 2\'den)', en: '+ Apply Material (from Stage 2)' }, 's3.wire': { tr: 'Wireframe (mesh\'i göster)', en: 'Wireframe (show the mesh)' }, 's3.reset': { tr: 'Sıfırla', en: 'Reset' }, 's3.empty': { tr: 'Boş GameObject (yalnızca Transform)', en: 'Empty GameObject (Transform only)' }, 's3.box': { tr: 'Küp (Cube)', en: 'Cube' }, 's3.sphere': { tr: 'Küre (Sphere)', en: 'Sphere' }, 's3.cylinder': { tr: 'Silindir (Cylinder)', en: 'Cylinder' }, 's3.torus': { tr: 'Simit (Torus)', en: 'Torus Knot' },
  's4l.title': { tr: 'Yüzey ışıkla buluşunca: parlaklık + pürüz', en: 'Where surface meets light: shine + bumps' },
  's4l.p1': { tr: 'Aslında bir yüzeyin rengini doğrudan görmeyiz; ışığın o yüzeyden gözümüze yansıyan kısmını görürüz. Yani materyal aynı kalsa bile, ışığı değiştirince her şey değişir. Işığı gezdir, parlak lekenin (<b>specular</b>) yüzeyde nasıl kaydığına bak. <b>Roughness</b>\'ı kıs: pürüzlü yüzey ışığı dağıtır (mat), pürüzsüz yüzey toplar (parlak).', en: 'We don\'t really see a surface\'s color directly; we see the slice of light that bounces off it into our eyes. So even with the same material, change the light and everything changes. Move the light and watch the bright spot (<b>specular</b>) slide across. Lower the <b>roughness</b>: a rough surface scatters light (matte), a smooth one focuses it (glossy).' },
  's4l.p2': { tr: 'Şimdi aynı yüzeye bir <b>Normal Map</b> ekle. Motor ışığı hesaplarken yüzeyin gerçek yönü yerine bu dokudaki "sahte yön"leri kullanır ve yüzey bir anda girintili çıkıntılı görünür. Püf noktası şu: <b>geometri kılını bile kıpırdatmaz</b>. İnanmıyorsan <b>Wireframe</b>\'i aç, küre hâlâ pürüzsüz.', en: 'Now add a <b>Normal Map</b> to the same surface. Computing light, the engine uses the "fake directions" baked into this texture instead of the real surface direction, and suddenly it looks full of bumps. The catch: the <b>geometry doesn\'t move a hair</b>. Don\'t believe me? Turn on <b>Wireframe</b> — the sphere is still smooth.' },
  's4l.angle': { tr: 'Işık açısı', en: 'Light angle' }, 's4l.height': { tr: 'Işık yüksekliği', en: 'Light height' }, 's4l.intensity': { tr: 'Şiddet (Intensity)', en: 'Intensity' }, 's4l.color': { tr: 'Işık rengi', en: 'Light color' }, 's4l.tag': { tr: 'Işık & Yüzey', en: 'Light & Surface' },
  's5w.title': { tr: 'Bir dünya da GameObject hiyerarşisidir', en: 'A world is a GameObject hierarchy too' },
  's5w.p1': { tr: 'Az önce tek bir GameObject kurdun. Koca bir dünya da aslında bundan başka bir şey değil: yüzlerce GameObject\'in iç içe dizilmesi. Şu evi seç ve panele bak; tıpkı bir karakterin iskeleti gibi dallanıyor: <code>Bahçe → Ev → Çatı, Duvarlar, Kapı, Pencereler…</code>', en: 'You just built a single GameObject. A whole world is nothing more than that, scaled up: hundreds of GameObjects nested inside one another. Select the house and look at the panel; it branches like a character\'s skeleton: <code>Garden → House → Roof, Walls, Door, Windows…</code>' },
  's5w.p2': { tr: 'Hiyerarşiden ya da doğrudan 3D\'de bir parçaya tıkla; seçtiğin parça kutuyla işaretlensin. Dikkat et: <b>evin duvarları, 2. adımda senin yaptığın materyali giyiyor.</b> Arka planda arabalar yolda gidip haritanın ucunda kayboluyor — bu da bir sonraki notumuzun konusu.', en: 'Click a part in the hierarchy, or right in the 3D view; the part you pick gets boxed. Notice the <b>house walls are wearing the very material you made in step 2.</b> In the background, cars drive down the road and disappear at the edge of the map — which is exactly what the note below is about.' },
  's5w.apply': { tr: '🎨 Materyalimi eve uygula', en: '🎨 Apply my material to the house' }, 's5w.hier': { tr: '⛬ Ev Hiyerarşisi', en: '⛬ House Hierarchy' }, 's5w.tag': { tr: 'Bahçe · Yollar · Arabalar', en: 'Garden · Roads · Cars' },
  's5n.title': { tr: 'Geometri değişmeden detay: Normal Map', en: 'Detail without geometry: Normal Map' },
  's5n.p1': { tr: 'Bir <b>Normal Map</b>, her piksele bir <b>yön (yüzey normali)</b> kodlayan özel bir dokudur (o mavimsi görüntü). Motor, ışığı hesaplarken bu yönleri kullanır ve yüzey <b>girintili-çıkıntılıymış gibi</b> görünür.', en: 'A <b>Normal Map</b> is a special texture (that bluish image) encoding a <b>direction (surface normal)</b> per pixel. The engine uses these when computing light, so the surface looks <b>bumpy</b>.' },
  's5n.p2': { tr: 'Ama hile şu: <b>geometri hiç değişmez</b>. Aşağıda aç/kapat ve <b>Wireframe</b> ile kontrol et — tüm o pürüz, sadece bir <b>ışık aldatmacası</b>. Milyonlarca poligon yerine tek bir doku.', en: 'But the trick: <b>geometry never changes</b>. Toggle below and check with <b>Wireframe</b> — all that bumpiness is just a <b>lighting illusion</b>. One texture instead of millions of polygons.' },
  's5n.off': { tr: 'Normal Map: Kapalı', en: 'Normal Map: Off' }, 's5n.on': { tr: 'Normal Map: Açık', en: 'Normal Map: On' }, 's5n.wire': { tr: 'Wireframe (geometriyi göster)', en: 'Wireframe (show geometry)' }, 's5n.note': { tr: '💡 Wireframe açıkken küre hâlâ pürüzsüz görünür — tüm detay normal map\'ten gelir.', en: '💡 With wireframe on, the sphere is still smooth — all detail comes from the normal map.' }, 's5n.thumb': { tr: 'Kullanılan normal map:', en: 'The normal map used:' }, 's5n.tag': { tr: 'Normal Map etkisi', en: 'Normal Map effect' },
  's6.title': { tr: 'Çok sayıda GameObject → yaşayan bir Avatar', en: 'Many GameObjects → a living Avatar' },
  's6.lead': { tr: 'Ve işte hepsi bir arada. Onlarca GameObject bir <b>Hiyerarşi</b> içinde iç içe geçiyor, bir <b>Rig (iskelet)</b> hepsini birbirine bağlıyor, <b>Animation</b> da bu iskeleti zamanla kıpırdatıyor. Aşağısı oyuncak değil, gerçek bir editör mantığı: bir parçaya tıkla, Inspector\'dan değerini değiştir, animasyonu oynat.', en: 'And here\'s all of it at once. Dozens of GameObjects nest inside a <b>Hierarchy</b>, a <b>Rig (skeleton)</b> ties them together, and <b>Animation</b> moves that skeleton over time. What\'s below isn\'t a toy — it\'s how a real editor works: click a part, change its values in the Inspector, play an animation.' },
  'fact.label': { tr: '🎓 Bilgi Notu', en: '🎓 Did you know?' },
  's3.fact': { tr: 'Unity\'de buna "GameObject", Unreal\'de "Actor", Godot\'ta "Node" denir. İsim motordan motora değişir ama fikir hep aynı: sahnedeki her şey, üzerine bileşen ve kod (<b>script</b>) eklenebilen boş bir kaptır. İşin sihri, bu kapların iç içe geçebilmesinde — birazdan göreceğiz.', en: 'Unity calls it a "GameObject", Unreal an "Actor", Godot a "Node". The name changes per engine, but the idea is always the same: everything in a scene is an empty container you attach components and code (<b>scripts</b>) to. The magic is that these containers nest — you\'ll see soon.' },
  's4.fact': { tr: 'Normal map\'ler neden hep o tuhaf mavi-mor renktedir? Her piksel bir yönü (X, Y, Z) saklar ve bu yön R, G, B\'ye çevrilir. Düz bir yüzey "yukarı" bakar; yukarı yönü Z eksenine, Z de maviye denk geldiği için harita ağırlıklı mavi çıkar.', en: 'Why are normal maps always that odd bluish-purple? Each pixel stores a direction (X, Y, Z), encoded as R, G, B. A flat surface points "up"; up is the Z axis, Z maps to blue — so the map comes out mostly blue.' },
  's5.fact': { tr: 'Arabaların harita kenarında yok olması tesadüf değil, bir oyun tekniği. Görünmeyen nesneleri hiç çizmemeye <b>culling</b>, silip yeniden yaratmak yerine aynı nesneyi defalarca kullanmaya <b>object pooling</b> denir. Büyük açık dünya oyunları akıcı kalmayı işte bu tür hilelere borçlu.', en: 'The cars vanishing at the edge isn\'t random — it\'s a game technique. Not drawing what you can\'t see is <b>culling</b>; reusing the same object instead of destroying and recreating it is <b>object pooling</b>. Big open-world games stay smooth thanks to tricks like these.' },
  's6.fact': { tr: 'Gerçek oyunlarda karakter animasyonu çoğunlukla <b>skinning</b> ile yapılır: tek bir mesh, görünmez kemiklere "ağırlıklarla" bağlanır; kemik kıpırdayınca yüzey de onunla esner. Biz burada bunu, parçaları iç içe gruplayarak basitleştirdik. Mantık birebir aynı: ebeveyn kemiği döndür, ona bağlı her şey döner.', en: 'In real games, character animation is usually done with <b>skinning</b>: one mesh is bound to invisible bones by "weights", and when a bone moves the surface flexes with it. Here we simplified that by nesting parts inside groups. The logic is identical: rotate a parent bone and everything attached follows.' },
  'ed.hierarchy': { tr: '⛬ Hiyerarşi', en: '⛬ Hierarchy' }, 'ed.scenegraph': { tr: 'Sahne Grafiği', en: 'Scene Graph' }, 'ed.hierarchyhint': { tr: 'Parent → Child ilişkisi. Bir öğeye tıkla → seç.', en: 'Parent → Child. Click an item → select.' }, 'ed.animation': { tr: 'Animasyon', en: 'Animation' }, 'ed.manual': { tr: '⏹ Manuel', en: '⏹ Manual' }, 'ed.wave': { tr: '👋 El Salla', en: '👋 Wave' }, 'ed.walk': { tr: '🚶 Yürü', en: '🚶 Walk' }, 'ed.view': { tr: 'Görünüm', en: 'View' }, 'ed.rig': { tr: '🦴 Rig / İskelet', en: '🦴 Rig / Skeleton' }, 'ed.resetcam': { tr: '🎯 Kamerayı Sıfırla', en: '🎯 Reset Camera' }, 'ed.selected': { tr: 'Seçili:', en: 'Selected:' }, 'ed.loading': { tr: '3D sahne hazırlanıyor…', en: 'Preparing 3D scene…' }, 'ed.inspector': { tr: '⚙ Inspector', en: '⚙ Inspector' }, 'ed.properties': { tr: 'Özellikler', en: 'Properties' }, 'ed.empty': { tr: 'Bir nesne seç ve özelliklerini burada düzenle.', en: 'Select an object to edit its properties here.' },
  'tour.intro.title': { tr: 'Editör turunu başlatmak için "Sonraki"ye bas', en: 'Hit "Next" to start the editor tour' }, 'tour.intro.body': { tr: 'Her adım ilgili nesneyi otomatik seçer ve ne deneyeceğini söyler.', en: 'Each step auto-selects the relevant object and tells you what to try.' }, 'tour.prev': { tr: '‹ Önceki', en: '‹ Prev' }, 'tour.next': { tr: 'Sonraki ›', en: 'Next ›' },
  'finale.lockedTitle': { tr: 'Atölyeyi tamamla', en: 'Complete the studio' }, 'finale.lockedBody': { tr: 'Her aşamadaki <b>mini görevi</b> bitir (sağ üstteki 🏅 sayacı dolacak); 6/6 olunca bu rozet parlayacak.', en: 'Finish the <b>mini task</b> in every stage (the 🏅 counter at the top right fills up); at 6/6 this badge lights up.' }, 'finale.doneTitle': { tr: '🏆 BAŞARIM AÇILDI! Atölyeyi tamamladın!', en: '🏆 ACHIEVEMENT UNLOCKED! Studio complete!' }, 'finale.doneBody': { tr: 'Texture\'dan animasyona, bir oyun nesnesinin tüm katmanlarını kendi ellerinle kurdun. Artık gerçek motora hazırsın!', en: 'From textures to animation, you built every layer of a game object yourself. You are ready for a real engine!' },
  'gloss.title': { tr: 'Kavram Sözlüğü', en: 'Concept Glossary' },
  'footer': { tr: 'Oyun Motoru Atölyesi · Three.js ile geliştirildi · Öğrenciler için açık eğitim materyali', en: 'Game Engine Studio · Built with Three.js · Open educational material for students' },
};
function applyI18n() { document.querySelectorAll('[data-i18n]').forEach(el => { const s = STR[el.dataset.i18n]; if (s) el.innerHTML = L(s); }); }
function setLang(lang) {
  LANG = lang; try { localStorage.setItem('atolye_lang', lang); } catch (e) {}
  document.documentElement.lang = lang;
  document.title = lang === 'tr' ? 'Oyun Motoru Atölyesi · 2D Görselden 3D Oyun Nesnesine' : 'Game Engine Studio · From a 2D Image to a 3D Game Object';
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  applyI18n();
  buildSwatches(); fillBaseSelect(); updateMatThumb(); renderGoComponents(); refreshGoStatus(); renderGlossary(); renderInspector(); renderHouseTree(); renderTasks(); updateTracker(); updateFinale();
  if (lessonIdx >= 0) gotoLesson(lessonIdx); else lessonStepEl.textContent = `${lang === 'tr' ? 'Tur' : 'Tour'} 1 / ${lessons.length}`;
}
function refreshGoStatus() { goStatusTag.textContent = L(goStep >= 2 ? GO_STATUS.full : goStep >= 1 ? GO_STATUS.mesh : GO_STATUS.empty); }
document.getElementById('langSwitch').addEventListener('click', (e) => { const b = e.target.closest('.lang-btn'); if (b) setLang(b.dataset.lang); });
const savedLang = (() => { try { return localStorage.getItem('atolye_lang'); } catch (e) { return null; } })();
const navLang = (navigator.language || 'tr').toLowerCase();
const initialLang = (savedLang === 'tr' || savedLang === 'en') ? savedLang : (navLang.startsWith('tr') ? 'tr' : 'en');

// ------------------------------------------------------------------
//  Editör render döngüsü
// ------------------------------------------------------------------
function resizeEditor() { const w = viewportEl.clientWidth, h = viewportEl.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
window.addEventListener('resize', resizeEditor); new ResizeObserver(resizeEditor).observe(viewportEl);
let editorVisible = false;
new IntersectionObserver(([e]) => { editorVisible = e.isIntersecting; }, { rootMargin: '160px' }).observe(viewportEl);
const clock = new THREE.Clock();
function tick() { requestAnimationFrame(tick); if (!editorVisible || document.hidden) return; const t = clock.getElapsedTime(); applyAnimation(t); controls.update(); updateRig(); if (selBox.visible && selected) selBox.update(); renderer.render(scene, camera); }

// ------------------------------------------------------------------
//  Başlat
// ------------------------------------------------------------------
drawTexturePreview();
matColor.value = '#' + journey.material.color.getHexString();
renderCode();
resizeEditor();
renderHierarchy();
selectObject(avatar);
setLang(initialLang);
updateProgress();
setInterval(evaluateChallenges, 500);
loadingEl.classList.add('hidden');
window.__sceneReady = true;
tick();
