// =============================================================
//  Oyun Motoru Atölyesi — main.js
//  "2D görselden çalışan 3D oyun nesnesine" yolculuğu.
//  Aşamalar: 1) Texture  2) Material  3) Mesh+GameObject  4) Hierarchy/Rig/Animation/Avatar
// =============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ------------------------------------------------------------------
//  ORTAK: Prosedürel TEXTURE'lar (harici dosya yok — canvas ile çizilir)
//  Her üretici bir <canvas> döndürür; ondan hem 2B önizleme hem 3D doku üretiriz.
// ------------------------------------------------------------------
function newCanvas(size = 256) { const c = document.createElement('canvas'); c.width = c.height = size; return c; }

function cvGrid() {
  const c = newCanvas(), x = c.getContext('2d');
  x.fillStyle = '#2f6f6a'; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = '#aef3e3'; x.lineWidth = 3;
  for (let i = 0; i <= 256; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); }
  x.fillStyle = '#ffffff'; x.font = 'bold 30px monospace'; x.fillText('UV', 92, 142);
  return c;
}
function cvChecker() {
  const c = newCanvas(), x = c.getContext('2d'), s = 32;
  for (let y = 0; y < 256; y += s) for (let xx = 0; xx < 256; xx += s) { x.fillStyle = ((xx + y) / s) % 2 ? '#e0e4ea' : '#39404c'; x.fillRect(xx, y, s, s); }
  return c;
}
function cvPanel() {
  const c = newCanvas(), x = c.getContext('2d');
  x.fillStyle = '#8a9099'; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = '#5b626c'; x.lineWidth = 5;
  for (let i = 0; i <= 256; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); }
  x.fillStyle = '#c8ccd2';
  for (let y = 32; y < 256; y += 64) for (let xx = 32; xx < 256; xx += 64) { x.beginPath(); x.arc(xx, y, 5, 0, 7); x.fill(); }
  return c;
}
function cvCircuit() {
  const c = newCanvas(), x = c.getContext('2d');
  x.fillStyle = '#0f3d2e'; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = '#39d98a'; x.lineWidth = 3;
  for (let i = 0; i < 24; i++) { const px = (i * 53) % 256, py = (i * 97) % 256; x.beginPath(); x.moveTo(px, py); x.lineTo(px, (py + 60) % 256); x.lineTo((px + 50) % 256, (py + 60) % 256); x.stroke(); x.fillStyle = '#9affd0'; x.fillRect(px - 3, py - 3, 7, 7); }
  return c;
}
function cvBrick() {
  const c = newCanvas(), x = c.getContext('2d');
  x.fillStyle = '#7a3b2e'; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = '#d6c3a8'; x.lineWidth = 6; x.fillStyle = '#9a4a38';
  const bh = 32, bw = 64;
  for (let row = 0, y = 0; y < 256; y += bh, row++) {
    const off = (row % 2) ? bw / 2 : 0;
    for (let xx = -bw; xx < 256; xx += bw) { x.fillRect(xx + off + 3, y + 3, bw - 6, bh - 6); x.strokeRect(xx + off, y, bw, bh); }
  }
  return c;
}

// Registry — etiketler şimdiden iki dilli (i18n son adımda devreye girecek)
const TEXTURES = {
  none:    { label: { tr: 'Yok (düz renk)', en: 'None (solid)' }, canvas: null },
  grid:    { label: { tr: 'Izgara / UV',    en: 'Grid / UV' },    canvas: cvGrid() },
  checker: { label: { tr: 'Damalı',         en: 'Checker' },      canvas: cvChecker() },
  panel:   { label: { tr: 'Metal Panel',    en: 'Metal Panel' },  canvas: cvPanel() },
  circuit: { label: { tr: 'Devre',          en: 'Circuit' },      canvas: cvCircuit() },
  brick:   { label: { tr: 'Tuğla',          en: 'Brick' },        canvas: cvBrick() },
};
Object.values(TEXTURES).forEach(t => {
  if (t.canvas) {
    const tex = new THREE.CanvasTexture(t.canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    t.tex = tex;
  } else t.tex = null;
});

// Basit dil yardımcı (tam i18n son adımda) — şimdilik TR
let LANG = 'tr';
const L = (o) => (o && (o[LANG] || o.tr)) || '';

// ------------------------------------------------------------------
//  YOLCULUK DURUMU — seçimler ileri taşınır
// ------------------------------------------------------------------
const journey = {
  texKey: 'grid',
  // Stage 2'de inşa edilen materyal; Stage 3'te GameObject'e uygulanır.
  material: new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.3, roughness: 0.5, name: 'M_Custom' }),
};
journey.material.map = TEXTURES[journey.texKey].tex;

// ------------------------------------------------------------------
//  Mini 3D sahne yardımcı (küçük önizleme kutuları için)
// ------------------------------------------------------------------
function makeMiniScene(container, camPos) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.copy(camPos);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight('#bcd0ff', '#20242c', 0.75));
  const key = new THREE.DirectionalLight('#ffffff', 2.3); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight('#4ec9b0', 0.6); rim.position.set(-4, 2, -3); scene.add(rim);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 2; controls.maxDistance = 8;
  function resize() { const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(container);
  resize();
  return { scene, camera, renderer, controls, resize };
}

// ==================================================================
//  AŞAMA 1 — TEXTURE (2B görsel önizleme + desen seçimi)
// ==================================================================
const tex2d = document.getElementById('tex2dCanvas');
const texTile = document.getElementById('texTileCanvas');
const swatchWrap = document.getElementById('texSwatches');

function drawTexturePreview() {
  const cv = TEXTURES[journey.texKey].canvas;
  const x1 = tex2d.getContext('2d'); x1.imageSmoothingEnabled = false;
  const x2 = texTile.getContext('2d'); x2.imageSmoothingEnabled = false;
  x1.clearRect(0, 0, tex2d.width, tex2d.height);
  x2.clearRect(0, 0, texTile.width, texTile.height);
  if (cv) {
    x1.drawImage(cv, 0, 0, tex2d.width, tex2d.height);
    const n = 3, s = texTile.width / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) x2.drawImage(cv, i * s, j * s, s, s);
  }
}
function buildSwatches() {
  swatchWrap.innerHTML = '';
  Object.keys(TEXTURES).filter(k => k !== 'none').forEach(key => {
    const b = document.createElement('button');
    b.className = 'swatch' + (key === journey.texKey ? ' active' : '');
    b.dataset.key = key;
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 52;
    cv.getContext('2d').drawImage(TEXTURES[key].canvas, 0, 0, 64, 52);
    const span = document.createElement('span'); span.textContent = L(TEXTURES[key].label);
    b.appendChild(cv); b.appendChild(span);
    b.addEventListener('click', () => setTexture(key));
    swatchWrap.appendChild(b);
  });
}
function setTexture(key) {
  journey.texKey = key;
  journey.material.map = TEXTURES[key].tex;
  journey.material.needsUpdate = true;
  drawTexturePreview();
  [...swatchWrap.children].forEach(b => b.classList.toggle('active', b.dataset.key === key));
  // Material kartındaki seçimi de güncelle
  if (matBaseSelect) matBaseSelect.value = key;
  updateMatThumb();
}

// ==================================================================
//  AŞAMA 2 — MATERIAL STÜDYOSU (Texture + özellikler → Material)
// ==================================================================
const matBaseSelect = document.getElementById('matBaseSelect');
const matThumb = document.getElementById('matThumb');
const matColor = document.getElementById('matColor');
const matMetal = document.getElementById('matMetal');
const matRough = document.getElementById('matRough');
const matMetalVal = document.getElementById('matMetalVal');
const matRoughVal = document.getElementById('matRoughVal');

function fillBaseSelect() {
  matBaseSelect.innerHTML = '';
  Object.keys(TEXTURES).forEach(key => {
    const o = document.createElement('option'); o.value = key; o.textContent = L(TEXTURES[key].label);
    matBaseSelect.appendChild(o);
  });
  matBaseSelect.value = journey.texKey;
}
function updateMatThumb() {
  const cv = TEXTURES[journey.texKey].canvas;
  matThumb.style.backgroundImage = cv ? `url(${cv.toDataURL()})` : 'none';
  matThumb.style.backgroundColor = cv ? 'transparent' : '#' + journey.material.color.getHexString();
}
matBaseSelect.addEventListener('change', () => setTexture(matBaseSelect.value));
matColor.addEventListener('input', () => { journey.material.color.set(matColor.value); updateMatThumb(); });
matMetal.addEventListener('input', () => { journey.material.metalness = +matMetal.value; matMetalVal.textContent = (+matMetal.value).toFixed(2); });
matRough.addEventListener('input', () => { journey.material.roughness = +matRough.value; matRoughVal.textContent = (+matRough.value).toFixed(2); });

// Canlı önizleme küresi
const matMini = makeMiniScene(document.getElementById('matPreview'), new THREE.Vector3(0, 0, 3.4));
const previewSphere = new THREE.Mesh(new THREE.SphereGeometry(1.15, 64, 48), journey.material);
matMini.scene.add(previewSphere);
const matPedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.25, 48), new THREE.MeshStandardMaterial({ color: '#2a2f3a', roughness: 1 }));
matPedestal.position.y = -1.55; matMini.scene.add(matPedestal);
(function loopMat() { requestAnimationFrame(loopMat); previewSphere.rotation.y += 0.004; matMini.controls.update(); matMini.renderer.render(matMini.scene, matMini.camera); })();

// ==================================================================
//  AŞAMA 3 — MESH + GAMEOBJECT LABORATUVARI
// ==================================================================
const goLab = makeMiniScene(document.getElementById('goLab'), new THREE.Vector3(0, 0.5, 4));
const goGrid = new THREE.GridHelper(6, 12, '#3a4150', '#272c34'); goGrid.position.y = -1.2; goLab.scene.add(goGrid);
const goAxes = new THREE.AxesHelper(0.9); goLab.scene.add(goAxes);   // boş GameObject = sadece Transform (eksenler)
const goDefaultMat = new THREE.MeshStandardMaterial({ color: '#9aa3b2', roughness: 0.85, metalness: 0 });
let goMesh = null;
let goStep = 0; // 0 boş, 1 mesh var, 2 material uygulandı
const goGeoms = {
  box: () => new THREE.BoxGeometry(1.4, 1.4, 1.4),
  sphere: () => new THREE.SphereGeometry(1, 48, 32),
  cylinder: () => new THREE.CylinderGeometry(0.85, 0.85, 1.7, 40),
  torus: () => new THREE.TorusKnotGeometry(0.75, 0.27, 120, 16),
};
const goShapeNames = { box: 'Cube', sphere: 'Sphere', cylinder: 'Cylinder', torus: 'TorusKnot' };

const goShapeBtn = document.getElementById('goShapeBtn');
const goShapeSelect = document.getElementById('goShapeSelect');
const goMatBtn = document.getElementById('goMatBtn');
const goWireBtn = document.getElementById('goWireBtn');
const goResetBtn = document.getElementById('goResetBtn');
const goStatusTag = document.getElementById('goStatusTag');
const goComponents = document.getElementById('goComponents');

const GO_STATUS = {
  empty: { tr: 'Boş GameObject (yalnızca Transform)', en: 'Empty GameObject (Transform only)' },
  mesh:  { tr: 'Mesh eklendi — henüz renksiz', en: 'Mesh added — still colorless' },
  full:  { tr: 'GameObject hazır: Mesh + Material ✓', en: 'GameObject ready: Mesh + Material ✓' },
};

function goAddMesh() {
  const shape = goShapeSelect.value;
  if (goMesh) goLab.scene.remove(goMesh);
  goMesh = new THREE.Mesh(goGeoms[shape](), goDefaultMat);
  goLab.scene.add(goMesh);
  goAxes.visible = false;
  goStep = Math.max(goStep, 1);
  goShapeBtn.dataset.done = 'true';
  goMatBtn.disabled = false;
  goStatusTag.textContent = L(GO_STATUS.mesh);
  renderGoComponents();
}
function goApplyMaterial() {
  if (!goMesh) return;
  // Stage 2'de inşa edilen materyalin bir kopyasını (anlık görüntü) uygula
  goMesh.material = journey.material.clone();
  goMesh.material.name = 'M_Custom';
  goStep = 2;
  goMatBtn.dataset.done = 'true';
  goStatusTag.textContent = L(GO_STATUS.full);
  renderGoComponents();
}
function goReset() {
  if (goMesh) { goLab.scene.remove(goMesh); goMesh = null; }
  goAxes.visible = true; goStep = 0;
  goShapeBtn.dataset.done = 'false'; goMatBtn.dataset.done = 'false'; goMatBtn.disabled = true;
  goStatusTag.textContent = L(GO_STATUS.empty);
  renderGoComponents();
}
function renderGoComponents() {
  const shape = goShapeNames[goShapeSelect.value];
  const hasMesh = goStep >= 1, hasMat = goStep >= 2;
  const matLine = hasMat ? `M_Custom` : '—';
  const texLine = hasMat ? L(TEXTURES[journey.texKey].label) : '—';
  goComponents.innerHTML = `
    <div class="comp on">
      <div class="comp-title"><span class="ci">📐</span> Transform</div>
      <div class="comp-rows"><div><span>Position</span><span class="cv">0, 0, 0</span></div><div><span>Rotation</span><span class="cv">0, 0, 0</span></div><div><span>Scale</span><span class="cv">1, 1, 1</span></div></div>
    </div>
    <div class="comp ${hasMesh ? 'on' : ''}">
      <div class="comp-title"><span class="ci">🔻</span> Mesh Filter</div>
      <div class="comp-rows"><div><span>Mesh</span><span class="cv">${hasMesh ? shape : '—'}</span></div></div>
    </div>
    <div class="comp ${hasMat ? 'on' : ''}">
      <div class="comp-title"><span class="ci">🎨</span> Mesh Renderer</div>
      <div class="comp-rows"><div><span>Material</span><span class="cv">${matLine}</span></div><div><span>Base Map</span><span class="cv">${texLine}</span></div></div>
    </div>`;
}
goShapeBtn.addEventListener('click', goAddMesh);
goShapeSelect.addEventListener('change', () => { if (goStep >= 1) goAddMesh(); });
goMatBtn.addEventListener('click', goApplyMaterial);
goWireBtn.addEventListener('click', () => { if (goMesh) goMesh.material.wireframe = !goMesh.material.wireframe; });
goResetBtn.addEventListener('click', goReset);
(function loopGo() { requestAnimationFrame(loopGo); if (goMesh) goMesh.rotation.y += 0.006; goLab.controls.update(); goLab.renderer.render(goLab.scene, goLab.camera); })();

// ==================================================================
//  AŞAMA 4 — TAM EDİTÖR (Hiyerarşi + Rig + Animation + Avatar)
// ==================================================================
const viewportEl = document.getElementById('viewport');
const hierarchyEl = document.getElementById('hierarchy');
const inspectorEl = document.getElementById('inspector');
const selNameEl = document.getElementById('selName');
const loadingEl = document.getElementById('loading');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#14161b');
scene.fog = new THREE.Fog('#14161b', 14, 30);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
const DEFAULT_CAM = { pos: new THREE.Vector3(3.4, 2.6, 5.2), target: new THREE.Vector3(0, 1.4, 0) };
camera.position.copy(DEFAULT_CAM.pos);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewportEl.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.target.copy(DEFAULT_CAM.target);
controls.minDistance = 2.5; controls.maxDistance = 16; controls.maxPolarAngle = Math.PI * 0.92;

scene.add(new THREE.HemisphereLight('#aac4ff', '#2a2a30', 0.55));
const keyLight = new THREE.DirectionalLight('#ffffff', 2.1);
keyLight.position.set(4, 7, 5); keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1; keyLight.shadow.camera.far = 25;
keyLight.shadow.camera.left = -6; keyLight.shadow.camera.right = 6; keyLight.shadow.camera.top = 6; keyLight.shadow.camera.bottom = -6;
keyLight.shadow.bias = -0.0005; scene.add(keyLight);
const rimLight = new THREE.DirectionalLight('#4ec9b0', 0.7); rimLight.position.set(-5, 3, -4); scene.add(rimLight);

const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ color: '#23262e', roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const grid = new THREE.GridHelper(18, 36, '#3a4150', '#2a2f38'); grid.position.y = 0.001; scene.add(grid);

// Materyaller (bölgelere göre paylaşılan)
const materials = {
  body: new THREE.MeshStandardMaterial({ color: '#5aa9ff', roughness: 0.45, metalness: 0.35, name: 'M_Body' }),
  head: new THREE.MeshStandardMaterial({ color: '#ffb454', roughness: 0.3, metalness: 0.2, name: 'M_Head' }),
  joint: new THREE.MeshStandardMaterial({ color: '#cfd6e0', roughness: 0.25, metalness: 0.85, name: 'M_Joint' }),
};

// --- Avatar (rig'li robot) ---
const meshes = [], nodeList = [], joints = {};
function gameObject(name, parent, pos, icon = '◆') {
  const g = new THREE.Group(); g.name = name; g.position.set(pos[0], pos[1], pos[2]);
  g.userData = { isGameObject: true, icon, baseRot: new THREE.Euler() };
  parent.add(g); joints[name] = g; nodeList.push(g); return g;
}
function attachMesh(go, geom, mat, offset = [0, 0, 0]) {
  const m = new THREE.Mesh(geom, mat); m.position.set(offset[0], offset[1], offset[2]);
  m.castShadow = true; m.userData.owner = go; go.userData.mesh = m; go.add(m); meshes.push(m); return m;
}
const G = {
  torso: new THREE.BoxGeometry(0.62, 0.7, 0.34), pelvis: new THREE.BoxGeometry(0.5, 0.26, 0.32),
  head: new THREE.SphereGeometry(0.22, 32, 24),
  upperArm: new THREE.CapsuleGeometry(0.085, 0.3, 6, 12), foreArm: new THREE.CapsuleGeometry(0.075, 0.28, 6, 12),
  thigh: new THREE.CapsuleGeometry(0.11, 0.34, 6, 12), shin: new THREE.CapsuleGeometry(0.095, 0.32, 6, 12),
  hand: new THREE.SphereGeometry(0.09, 16, 12), foot: new THREE.BoxGeometry(0.16, 0.1, 0.28), joint: new THREE.SphereGeometry(0.07, 16, 12),
};
const avatar = gameObject('Robot_Avatar', scene, [0, 0, 0], '🤖');
const hips = gameObject('Hips', avatar, [0, 1.05, 0], '⬢'); attachMesh(hips, G.pelvis, materials.body);
const spine = gameObject('Spine', hips, [0, 0.28, 0], '┃');
const chest = gameObject('Chest', spine, [0, 0.18, 0], '⬛'); attachMesh(chest, G.torso, materials.body, [0, 0.16, 0]);
const neck = gameObject('Head', chest, [0, 0.55, 0], '🙂'); attachMesh(neck, G.head, materials.head);
const eyeMat = new THREE.MeshStandardMaterial({ color: '#16181d', roughness: 0.2 });
[-0.08, 0.08].forEach(x => { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), eyeMat); eye.position.set(x, 0.03, 0.2); neck.add(eye); });
function buildArm(side, label) {
  const sx = 0.36 * side;
  const shoulder = gameObject(`${label}Shoulder`, chest, [sx, 0.4, 0], '🔵'); attachMesh(shoulder, G.upperArm, materials.body, [0, -0.18, 0]);
  const elbow = gameObject(`${label}Elbow`, shoulder, [0, -0.38, 0], '🔹'); attachMesh(elbow, G.foreArm, materials.body, [0, -0.17, 0]);
  gameObject(`${label}Hand`, elbow, [0, -0.34, 0], '✊'); attachMesh(joints[`${label}Hand`], G.hand, materials.joint);
  attachMesh(shoulder, G.joint, materials.joint, [0, 0, 0]);
}
buildArm(-1, 'L_Arm_'); buildArm(1, 'R_Arm_');
function buildLeg(side, label) {
  const sx = 0.16 * side;
  const hip = gameObject(`${label}Hip`, hips, [sx, -0.14, 0], '🔵'); attachMesh(hip, G.thigh, materials.body, [0, -0.2, 0]);
  const knee = gameObject(`${label}Knee`, hip, [0, -0.42, 0], '🔹'); attachMesh(knee, G.shin, materials.body, [0, -0.19, 0]);
  gameObject(`${label}Foot`, knee, [0, -0.4, 0.04], '👟'); attachMesh(joints[`${label}Foot`], G.foot, materials.joint, [0, -0.03, 0.06]);
}
buildLeg(-1, 'L_Leg_'); buildLeg(1, 'R_Leg_');
nodeList.forEach(go => go.userData.baseRot.copy(go.rotation));

// --- Rig görselleştirme ---
const rigGroup = new THREE.Group(); rigGroup.visible = false; scene.add(rigGroup);
const boneJointMat = new THREE.MeshBasicMaterial({ color: '#ffb454', depthTest: false });
const boneLineMat = new THREE.LineBasicMaterial({ color: '#ffd9a0', depthTest: false, transparent: true, opacity: 0.9 });
const rigJointMeshes = [], rigBones = [];
nodeList.forEach(go => {
  if (go === avatar) return;
  const jm = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), boneJointMat); jm.renderOrder = 999; jm.userData.target = go; rigGroup.add(jm); rigJointMeshes.push(jm);
  if (go.parent && go.parent.userData && go.parent.userData.isGameObject && go.parent !== avatar) {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const line = new THREE.Line(geo, boneLineMat); line.renderOrder = 998; rigGroup.add(line); rigBones.push({ parent: go.parent, child: go, line });
  }
});
function updateRig() {
  if (!rigGroup.visible) return;
  const v = new THREE.Vector3();
  rigJointMeshes.forEach(jm => { jm.userData.target.getWorldPosition(v); jm.position.copy(v); });
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  rigBones.forEach(({ parent, child, line }) => { parent.getWorldPosition(a); child.getWorldPosition(b); const p = line.geometry.attributes.position; p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b.x, b.y, b.z); p.needsUpdate = true; });
}

// --- Seçim ---
let selected = null;
const selBox = new THREE.BoxHelper(avatar, '#5aa9ff'); selBox.material.depthTest = false; selBox.material.transparent = true; selBox.visible = false; scene.add(selBox);
function selectObject(go) {
  selected = go; selNameEl.textContent = go ? go.name : '—';
  if (go) { selBox.setFromObject(go); selBox.visible = true; } else selBox.visible = false;
  renderHierarchy(); renderInspector();
}
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', (e) => {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1; pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length) selectObject(hits[0].object.userData.owner);
});

// --- Hiyerarşi paneli ---
function renderHierarchy() { hierarchyEl.innerHTML = ''; hierarchyEl.appendChild(buildTreeNode(avatar)); }
function buildTreeNode(go) {
  const li = document.createElement('li');
  const row = document.createElement('div');
  row.className = 'node-row' + (selected === go ? ' selected' : '');
  const childGOs = go.children.filter(c => c.userData && c.userData.isGameObject);
  row.innerHTML = `<span class="twisty">${childGOs.length ? '▾' : ''}</span><span class="ico">${go.userData.icon || '◆'}</span><span class="nm">${go.name}</span>` + (go.userData.mesh ? '<span class="mesh-dot" title="Mesh Renderer"></span>' : '');
  row.addEventListener('click', (e) => { e.stopPropagation(); selectObject(go); });
  li.appendChild(row);
  if (childGOs.length) { const ul = document.createElement('ul'); childGOs.forEach(c => ul.appendChild(buildTreeNode(c))); li.appendChild(ul); }
  return li;
}

// --- Inspector ---
const RAD = 180 / Math.PI;
const I18 = {
  transform: { tr: 'Transform', en: 'Transform' },
  pos: { tr: 'Position (Konum)', en: 'Position' }, rot: { tr: 'Rotation (Dönüş °)', en: 'Rotation (°)' }, scale: { tr: 'Scale (Ölçek)', en: 'Scale' },
  material: { tr: 'Material', en: 'Material' }, albedo: { tr: 'Albedo (Renk)', en: 'Albedo (Color)' },
  metal: { tr: 'Metalness (Metaliklik)', en: 'Metalness' }, rough: { tr: 'Roughness (Pürüzlülük)', en: 'Roughness' },
  texture: { tr: 'Texture (Doku)', en: 'Texture' }, wire: { tr: 'Wireframe (Tel kafes)', en: 'Wireframe' },
  emptyGO: { tr: '🗂️ Bu bir <b>boş GameObject</b> (sadece Transform). Çocuklarını taşımak/döndürmek için kullanılır — örn. <code>Hips</code> tüm vücudu hareket ettirir.', en: '🗂️ This is an <b>empty GameObject</b> (Transform only). It moves/rotates its children — e.g. <code>Hips</code> moves the whole body.' },
  shareNote: { tr: 'Bu materyal birçok parça tarafından <b>paylaşılıyor</b>. Değiştirince hepsi birden değişir.', en: 'This material is <b>shared</b> by several parts. Editing it changes them all at once.' },
};
function renderInspector() {
  if (!selected) { inspectorEl.innerHTML = `<div class="empty-state">${LANG === 'tr' ? 'Bir nesne seç ve özelliklerini burada düzenle.' : 'Select an object to edit its properties.'}</div>`; return; }
  const go = selected, mesh = go.userData.mesh, mat = mesh ? mesh.material : null;
  inspectorEl.innerHTML = '';
  const head = document.createElement('div'); head.style.marginBottom = '14px';
  head.innerHTML = `<div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:4px">${go.userData.icon || '◆'} ${go.name}</div><span class="type-pill">GameObject</span> ${mesh ? '<span class="type-pill" style="background:rgba(78,201,176,.16);color:#4ec9b0;border-color:rgba(78,201,176,.3)">Mesh Renderer</span>' : ''}`;
  inspectorEl.appendChild(head);

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
    const note = document.createElement('p'); note.className = 'material-note'; note.innerHTML = '💡 ' + L(I18.shareNote); mSec.body.appendChild(note);
    inspectorEl.appendChild(mSec.sec);
  } else {
    const info = document.createElement('p'); info.className = 'material-note'; info.style.padding = '4px 2px'; info.innerHTML = L(I18.emptyGO); inspectorEl.appendChild(info);
  }
}
function refreshSelBox() { if (selected) selBox.setFromObject(selected); }
function section(icon, title, sub) {
  const sec = document.createElement('div'); sec.className = 'insp-section';
  const head = document.createElement('div'); head.className = 'insp-section-head';
  head.innerHTML = `<span class="si">${icon}</span> ${title} <span style="color:#6b7280;font-weight:400;font-size:11px;margin-left:auto">${sub || ''}</span>`;
  const body = document.createElement('div'); body.className = 'insp-section-body'; sec.appendChild(head); sec.appendChild(body); return { sec, body };
}
function vec3Field(label, vec, step, onChange) {
  const f = document.createElement('div'); f.className = 'field'; f.innerHTML = `<div class="field-label"><span>${label}</span></div>`;
  const grid = document.createElement('div'); grid.className = 'vec3';
  ['x', 'y', 'z'].forEach(axis => { const w = document.createElement('div'); w.className = 'axis ' + axis; const i = document.createElement('input'); i.type = 'number'; i.step = step; i.value = vec[axis].toFixed(2); i.addEventListener('input', () => onChange(axis, parseFloat(i.value) || 0)); w.innerHTML = `<label>${axis.toUpperCase()}</label>`; w.appendChild(i); grid.appendChild(w); });
  f.appendChild(grid); return f;
}
function vec3FieldDeg(label, go, onChange) {
  const f = document.createElement('div'); f.className = 'field'; f.innerHTML = `<div class="field-label"><span>${label}</span></div>`;
  const grid = document.createElement('div'); grid.className = 'vec3';
  ['x', 'y', 'z'].forEach(axis => { const w = document.createElement('div'); w.className = 'axis ' + axis; const i = document.createElement('input'); i.type = 'number'; i.step = 1; i.value = Math.round(go.rotation[axis] * RAD); i.addEventListener('input', () => onChange(axis, parseFloat(i.value) || 0)); w.innerHTML = `<label>${axis.toUpperCase()}</label>`; w.appendChild(i); grid.appendChild(w); });
  f.appendChild(grid); return f;
}
function sliderField(label, value, min, max, step, onChange, fmt = (v) => v) {
  const f = document.createElement('div'); f.className = 'field';
  f.innerHTML = `<div class="field-label"><span>${label}</span><span class="val" data-val>${fmt(value)}</span></div>`;
  const i = document.createElement('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = value;
  const valEl = f.querySelector('[data-val]'); i.addEventListener('input', () => { const v = parseFloat(i.value); valEl.textContent = fmt(v); onChange(v); }); f.appendChild(i); return f;
}
function colorField(label, value, onChange) { const f = document.createElement('div'); f.className = 'field'; f.innerHTML = `<div class="field-label"><span>${label}</span></div>`; const i = document.createElement('input'); i.type = 'color'; i.value = value; i.addEventListener('input', () => onChange(i.value)); f.appendChild(i); return f; }
function selectField(label, options, current, onChange) { const f = document.createElement('div'); f.className = 'field'; f.innerHTML = `<div class="field-label"><span>${label}</span></div>`; const s = document.createElement('select'); Object.keys(options).forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = L(options[k].label); if (k === current) o.selected = true; s.appendChild(o); }); s.addEventListener('change', () => onChange(s.value)); f.appendChild(s); return f; }
function checkField(label, value, onChange) { const f = document.createElement('label'); f.className = 'field checkbox-row'; const i = document.createElement('input'); i.type = 'checkbox'; i.checked = value; i.addEventListener('change', () => onChange(i.checked)); f.appendChild(i); const s = document.createElement('span'); s.textContent = label; f.appendChild(s); return f; }

// --- Animasyon ---
let currentAnim = 'stop';
const animatable = ['Spine', 'Chest', 'Head', 'L_Arm_Shoulder', 'L_Arm_Elbow', 'R_Arm_Shoulder', 'R_Arm_Elbow', 'L_Leg_Hip', 'L_Leg_Knee', 'R_Leg_Hip', 'R_Leg_Knee'];
function resetPose() { animatable.forEach(n => joints[n].rotation.copy(joints[n].userData.baseRot)); avatar.position.y = 0; }
function applyAnimation(t) {
  if (currentAnim === 'stop') return;
  resetPose(); const s = Math.sin, c = Math.cos;
  if (currentAnim === 'idle') {
    const b = s(t * 1.6); joints.Chest.rotation.x = b * 0.04 + 0.02; joints.Head.rotation.y = s(t * 0.8) * 0.18; joints.Head.rotation.z = b * 0.03;
    joints.L_Arm_Shoulder.rotation.z = -0.08 + b * 0.04; joints.R_Arm_Shoulder.rotation.z = 0.08 - b * 0.04; avatar.position.y = b * 0.015;
  } else if (currentAnim === 'wave') {
    joints.R_Arm_Shoulder.rotation.z = -2.3; joints.R_Arm_Shoulder.rotation.x = 0.2; joints.R_Arm_Elbow.rotation.z = -0.3 + s(t * 9) * 0.5;
    joints.Head.rotation.y = 0.25; joints.Chest.rotation.y = 0.1; joints.L_Arm_Shoulder.rotation.z = -0.1 + s(t * 1.6) * 0.05;
  } else if (currentAnim === 'walk') {
    const w = t * 4.2; joints.L_Leg_Hip.rotation.x = s(w) * 0.6; joints.R_Leg_Hip.rotation.x = s(w + Math.PI) * 0.6;
    joints.L_Leg_Knee.rotation.x = Math.max(0, -c(w)) * 0.9; joints.R_Leg_Knee.rotation.x = Math.max(0, -c(w + Math.PI)) * 0.9;
    joints.L_Arm_Shoulder.rotation.x = s(w + Math.PI) * 0.5; joints.R_Arm_Shoulder.rotation.x = s(w) * 0.5;
    joints.L_Arm_Elbow.rotation.x = -0.3; joints.R_Arm_Elbow.rotation.x = -0.3; joints.Chest.rotation.y = s(w) * 0.12; avatar.position.y = Math.abs(s(w)) * 0.06;
  }
}
function setAnim(name) { currentAnim = name; document.querySelectorAll('[data-anim]').forEach(b => b.classList.toggle('active', b.dataset.anim === name)); if (name === 'stop') { resetPose(); renderInspector(); } }
document.querySelectorAll('[data-anim]').forEach(b => b.addEventListener('click', () => setAnim(b.dataset.anim)));

// --- Araç çubuğu ---
let globalWire = false;
document.getElementById('toggleWireframe').addEventListener('click', (e) => { globalWire = !globalWire; Object.values(materials).forEach(m => m.wireframe = globalWire); e.currentTarget.classList.toggle('active', globalWire); renderInspector(); });
document.getElementById('toggleRig').addEventListener('click', (e) => { rigGroup.visible = !rigGroup.visible; e.currentTarget.classList.toggle('active', rigGroup.visible); });
document.getElementById('resetView').addEventListener('click', () => { camera.position.copy(DEFAULT_CAM.pos); controls.target.copy(DEFAULT_CAM.target); });

// --- Editör turu (dersler) ---
const lessons = [
  { chip: 'Hierarchy', icon: '⛬',
    title: { tr: 'Hiyerarşi — Parent / Child', en: 'Hierarchy — Parent / Child' },
    body: { tr: 'GameObject\'ler ağaç gibi iç içe geçer. Bir <b>parent</b> hareket edince tüm <b>child</b>\'ları onunla hareket eder. Inspector\'da <code>Hips</code> seçili: <b>Rotation Y</b>\'yi değiştir → tüm gövde birlikte döner.', en: 'GameObjects nest like a tree. When a <b>parent</b> moves, all its <b>children</b> move with it. <code>Hips</code> is selected — change <b>Rotation Y</b> and the whole body turns together.' },
    focus: 'Hips' },
  { chip: 'Mesh', icon: '🔻',
    title: { tr: 'Mesh — Nesnenin şekli', en: 'Mesh — The object\'s shape' },
    body: { tr: 'Mesh, <b>köşe noktaları (vertices)</b> ve <b>üçgenlerden (faces)</b> oluşur. Üstteki <b>🔲 Wireframe</b>\'e bas → modelin üçgenlerden oluştuğunu gör.', en: 'A mesh is made of <b>vertices</b> and <b>faces (triangles)</b>. Hit <b>🔲 Wireframe</b> above to see the triangles.' },
    focus: 'Chest', action: () => { if (!globalWire) document.getElementById('toggleWireframe').click(); } },
  { chip: 'Rig / Skeleton', icon: '🦴',
    title: { tr: 'Rig — Avatarı hareket ettiren iskelet', en: 'Rig — The skeleton that moves the avatar' },
    body: { tr: 'Rig, birbirine bağlı <b>eklemlerden</b> oluşur. Üstteki <b>🦴 Rig / İskelet</b>\'e bas → turuncu eklem ve kemikleri gör. Her eklem aslında bir GameObject\'tir.', en: 'A rig is a hierarchy of connected <b>joints (bones)</b>. Hit <b>🦴 Rig</b> above to see the orange joints and bones. Each joint is actually a GameObject.' },
    focus: 'R_Arm_Shoulder', action: () => { if (globalWire) document.getElementById('toggleWireframe').click(); if (!rigGroup.visible) document.getElementById('toggleRig').click(); } },
  { chip: 'Animation', icon: '🎬',
    title: { tr: 'Animation — Zaman içinde pozlar', en: 'Animation — Poses over time' },
    body: { tr: 'Animasyon, eklem değerlerinin <b>zamana göre</b> değişmesidir. <b>👋 El Salla</b> ve <b>🚶 Yürü</b>\'ye bas. Rig açıkken eklemlerin nasıl döndüğünü izle.', en: 'Animation is joint values changing <b>over time</b>. Hit <b>👋 Wave</b> and <b>🚶 Walk</b>. With the rig on, watch the joints rotate.' },
    focus: 'R_Arm_Shoulder', action: () => setAnim('wave') },
  { chip: 'Avatar', icon: '🤖',
    title: { tr: 'Avatar — Hepsi bir arada', en: 'Avatar — All together' },
    body: { tr: 'Avatar = <b>Mesh</b> + <b>Material</b> + <b>Texture</b> + <b>Rig</b> + <b>Animation</b>, hepsi bir <b>Hiyerarşi</b> içinde. <code>🚶 Yürü</code>\'ye basıp kamerayı döndür. Tebrikler — bir oyun motorunun çekirdeğini anladın! 🎉', en: 'Avatar = <b>Mesh</b> + <b>Material</b> + <b>Texture</b> + <b>Rig</b> + <b>Animation</b>, all inside a <b>Hierarchy</b>. Hit <code>🚶 Walk</code> and orbit the camera. Congrats — you understand a game engine\'s core! 🎉' },
    focus: 'Robot_Avatar', action: () => setAnim('walk') },
];
let lessonIdx = -1;
const lessonStepEl = document.getElementById('lessonStep'), lessonChipEl = document.getElementById('lessonChip'), lessonTitleEl = document.getElementById('lessonTitle'), lessonBodyEl = document.getElementById('lessonBody'), lessonIconEl = document.getElementById('lessonIcon'), lessonDotsEl = document.getElementById('lessonDots');
lessons.forEach((_, i) => { const d = document.createElement('div'); d.className = 'dot'; d.addEventListener('click', () => gotoLesson(i)); lessonDotsEl.appendChild(d); });
function gotoLesson(i) {
  if (i < 0 || i >= lessons.length) return;
  lessonIdx = i; const Ls = lessons[i];
  lessonStepEl.textContent = `${LANG === 'tr' ? 'Tur' : 'Tour'} ${i + 1} / ${lessons.length}`;
  lessonChipEl.textContent = Ls.chip; lessonTitleEl.textContent = L(Ls.title); lessonBodyEl.innerHTML = L(Ls.body); lessonIconEl.textContent = Ls.icon;
  [...lessonDotsEl.children].forEach((d, k) => d.classList.toggle('active', k === i));
  if (Ls.action) Ls.action();
  if (Ls.focus && joints[Ls.focus]) selectObject(joints[Ls.focus]);
  const bar = document.getElementById('lessonBar'); bar.classList.remove('flash'); void bar.offsetWidth; bar.classList.add('flash');
}
document.getElementById('nextLesson').addEventListener('click', () => gotoLesson(Math.min(lessonIdx + 1, lessons.length - 1)));
document.getElementById('prevLesson').addEventListener('click', () => gotoLesson(Math.max(lessonIdx - 1, 0)));

// ------------------------------------------------------------------
//  Kavram sözlüğü
// ------------------------------------------------------------------
const glossary = [
  ['📷', 'Texture', { tr: 'Doku', en: 'Texture' }, { tr: 'Yüzeye UV ile sarılan 2B görüntü; detay ve desen ekler.', en: 'A 2D image wrapped on a surface via UV; adds detail/pattern.' }],
  ['🎨', 'Material', { tr: 'Materyal', en: 'Material' }, { tr: 'Texture + özellikler (renk, metalness, roughness) tarifi.', en: 'A recipe: texture + properties (color, metalness, roughness).' }],
  ['🔻', 'Mesh', { tr: 'Ağ / Örgü', en: 'Mesh' }, { tr: 'Vertices ve faces\'ten oluşan 3B şekil (geometri).', en: 'A 3D shape made of vertices and faces (geometry).' }],
  ['🧊', 'GameObject', { tr: 'Oyun Nesnesi', en: 'GameObject' }, { tr: 'Transform + bileşenler (Mesh, Material...) taşıyan kap.', en: 'A container holding a Transform + components (Mesh, Material...).' }],
  ['⛬', 'Hierarchy', { tr: 'Hiyerarşi', en: 'Hierarchy' }, { tr: 'Parent-child ağacı; parent hareket edince çocuklar da hareket eder.', en: 'Parent-child tree; moving a parent moves its children.' }],
  ['🦴', 'Rig', { tr: 'İskelet', en: 'Rig' }, { tr: 'Eklemlerin hiyerarşisi; avatarı hareket ettirir.', en: 'A hierarchy of joints that moves the avatar.' }],
  ['🎬', 'Animation', { tr: 'Animasyon', en: 'Animation' }, { tr: 'Eklem değerlerinin keyframe\'lerle zaman içinde değişmesi.', en: 'Joint values changing over time via keyframes.' }],
  ['🤖', 'Avatar', { tr: 'Avatar', en: 'Avatar' }, { tr: 'Mesh+Material+Texture+Rig+Animation\'ın tam karakter hâli.', en: 'The full character: Mesh+Material+Texture+Rig+Animation.' }],
];
const glossaryGrid = document.getElementById('glossaryGrid');
function renderGlossary() {
  glossaryGrid.innerHTML = '';
  glossary.forEach(([ico, en, tr, desc]) => { const card = document.createElement('div'); card.className = 'gloss-card'; card.innerHTML = `<div class="gico">${ico}</div><h3>${L(tr)}</h3><div class="en">${en}</div><p>${L(desc)}</p>`; glossaryGrid.appendChild(card); });
}

// ------------------------------------------------------------------
//  Yol haritası — kaydırma takibi (scroll-spy)
// ------------------------------------------------------------------
const rmLinks = [...document.querySelectorAll('#roadmap a')];
const stageEls = ['stage-1', 'stage-2', 'stage-3', 'stage-4'].map(id => document.getElementById(id));
const spy = new IntersectionObserver((entries) => {
  entries.forEach(en => { if (en.isIntersecting) { const i = stageEls.indexOf(en.target); rmLinks.forEach((a, k) => a.classList.toggle('active', k === i)); } });
}, { rootMargin: '-40% 0px -55% 0px' });
stageEls.forEach(s => spy.observe(s));

// ------------------------------------------------------------------
//  Editör boyutlandırma + render döngüsü
// ------------------------------------------------------------------
function resizeEditor() { const w = viewportEl.clientWidth, h = viewportEl.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
window.addEventListener('resize', resizeEditor);
new ResizeObserver(resizeEditor).observe(viewportEl);

const clock = new THREE.Clock();
function tick() {
  const t = clock.getElapsedTime();
  applyAnimation(t); controls.update(); updateRig();
  if (selBox.visible && selected) selBox.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// ------------------------------------------------------------------
//  i18n — TR / EN (tarayıcı diline göre otomatik + elle anahtar)
// ------------------------------------------------------------------
const STR = {
  'brand.title': { tr: 'Oyun Motoru Atölyesi', en: 'Game Engine Studio' },
  'brand.sub': { tr: '2D Görsel → Texture → Material → GameObject → Avatar', en: '2D Image → Texture → Material → GameObject → Avatar' },
  'brand.start': { tr: '▶ Yolculuğa Başla', en: '▶ Start the Journey' },
  'hero.title': { tr: 'Bir 2D görselden, yaşayan bir 3D oyun nesnesine', en: 'From a 2D image to a living 3D game object' },
  'hero.lead': { tr: 'Bir oyun motorundaki her karakter aslında katman katman inşa edilir. Bu sayfada o yolu <strong>baştan sona</strong>, her adımda kendin deneyerek yürüyeceksin. Aşağıdaki yol haritasına tıklayarak da gezebilirsin.', en: 'Every character in a game engine is built layer by layer. Here you walk that path <strong>from start to finish</strong>, trying each step yourself. You can also jump around using the roadmap below.' },
  'rm.texture': { tr: '2D Görsel · Texture', en: '2D Image · Texture' },
  'rm.material': { tr: 'Material', en: 'Material' },
  'rm.gameobject': { tr: 'Mesh · GameObject', en: 'Mesh · GameObject' },
  'rm.avatar': { tr: 'Hiyerarşi · Rig · Avatar', en: 'Hierarchy · Rig · Avatar' },
  's1.title': { tr: 'Her şey bir 2D görselle başlar', en: 'It all starts with a 2D image' },
  's1.p1': { tr: 'Bir <b>Texture (doku)</b>, sıradan bir 2B görüntüdür — tıpkı bir fotoğraf gibi piksellerden oluşur. Tek başına 3 boyutlu bir şey yapmaz; bir yüzeye <b>sarılmayı</b> bekler.', en: 'A <b>Texture</b> is just a 2D image — pixels, like a photo. On its own it does nothing in 3D; it waits to be <b>wrapped</b> onto a surface.' },
  's1.p2': { tr: 'Aşağıdan bir desen seç. Sağda görüntünün hem <b>2B hâlini</b> hem de bir yüzeye sarıldığında nasıl <b>tekrarlandığını (tiling)</b> göreceksin. Bir resmin model üzerine nasıl oturacağını <b>UV haritası</b> belirler.', en: 'Pick a pattern below. On the right you see both its <b>2D form</b> and how it <b>tiles</b> when wrapped on a surface. A <b>UV map</b> decides how an image sits on a model.' },
  's1.note': { tr: '💡 Seçtiğin bu doku otomatik olarak bir sonraki adıma — <b>Material Stüdyosu</b>\'na — taşınacak.', en: '💡 The texture you pick carries over automatically to the next step — the <b>Material Studio</b>.' },
  's1.cap2d': { tr: '2B görüntü (piksel ızgarası)', en: '2D image (pixel grid)' },
  's1.captile': { tr: 'Yüzeyde tekrarlanışı (tiling)', en: 'Tiling on a surface' },
  's2.title': { tr: 'Texture + Özellikler = Material', en: 'Texture + Properties = Material' },
  's2.p1': { tr: 'Bir <b>Material (materyal)</b>, bir yüzeyin ışığa nasıl tepki vereceğini tanımlayan bir <b>tariftir</b>. İçine bir <b>Texture</b> koyarsın (Base / Albedo Map) ve birkaç sayısal özellik eklersin: renk tonu, <b>metalness</b> (metal mi?), <b>roughness</b> (mat mı, parlak mı?).', en: 'A <b>Material</b> is a <b>recipe</b> for how a surface responds to light. You put a <b>Texture</b> inside it (Base / Albedo Map) and add a few numbers: tint color, <b>metalness</b> (is it metal?), <b>roughness</b> (matte or glossy?).' },
  's2.p2': { tr: 'Tıpkı Unity\'deki gibi: aşağıdaki <b>Material kartında</b> doku slot\'unu doldur, kaydırıcılarla oyna. Sağdaki küre bu materyali <b>canlı</b> gösterir.', en: 'Just like in Unity: fill the texture slot in the <b>Material card</b> below and play with the sliders. The sphere on the right shows the material <b>live</b>.' },
  's2.basemap': { tr: 'Base Map (Albedo · Texture)', en: 'Base Map (Albedo · Texture)' },
  's2.tint': { tr: 'Tint / Renk Tonu', en: 'Tint / Color' },
  's2.note': { tr: '💡 Hazırladığın bu materyal, bir sonraki adımda bir <b>GameObject</b>\'e giydirilecek.', en: '💡 The material you build here gets put onto a <b>GameObject</b> in the next step.' },
  's2.previewtag': { tr: 'Canlı Material Önizleme', en: 'Live Material Preview' },
  's3.title': { tr: 'Mesh\'e Material ekle → GameObject doğsun', en: 'Add a Material to a Mesh → a GameObject is born' },
  's3.p1': { tr: 'Bir <b>GameObject</b>, sahnedeki boş bir kutudur — başlangıçta yalnızca bir <b>Transform</b> (Konum/Dönüş/Ölçek) taşır. Görünür olması için ona <b>bileşenler</b> ekleriz:', en: 'A <b>GameObject</b> is an empty box in the scene — at first it only holds a <b>Transform</b> (Position/Rotation/Scale). To make it visible we add <b>components</b>:' },
  's3.p2': { tr: '<b>Mesh</b> nesnenin <i>şeklidir</i> (köşe noktaları + üçgenler), ama renksizdir. <b>Material</b> ise o şeklin <i>nasıl göründüğüdür</i>. İkisini bir GameObject\'te birleştirince ekranda görünen bir nesne elde ederiz.', en: 'A <b>Mesh</b> is the object\'s <i>shape</i> (vertices + triangles), but colorless. A <b>Material</b> is <i>how that shape looks</i>. Combine both in a GameObject and you get a visible object.' },
  's3.instr': { tr: 'Sırayla adımları çalıştır:', en: 'Run the steps in order:' },
  's3.step1': { tr: '+ Mesh (şekil) ekle', en: '+ Add Mesh (shape)' },
  's3.step2': { tr: '+ Material uygula (Aşama 2\'den)', en: '+ Apply Material (from Step 2)' },
  's3.wire': { tr: 'Wireframe (mesh\'i göster)', en: 'Wireframe (show the mesh)' },
  's3.reset': { tr: 'Sıfırla', en: 'Reset' },
  's3.empty': { tr: 'Boş GameObject (yalnızca Transform)', en: 'Empty GameObject (Transform only)' },
  's3.box': { tr: 'Küp (Cube)', en: 'Cube' },
  's3.sphere': { tr: 'Küre (Sphere)', en: 'Sphere' },
  's3.cylinder': { tr: 'Silindir (Cylinder)', en: 'Cylinder' },
  's3.torus': { tr: 'Simit (Torus)', en: 'Torus Knot' },
  's4.title': { tr: 'Çok sayıda GameObject → yaşayan bir Avatar', en: 'Many GameObjects → a living Avatar' },
  's4.lead': { tr: 'Şimdi her şey bir arada. Onlarca GameObject bir <b>Hiyerarşi</b> içinde iç içe geçer, bir <b>Rig (iskelet)</b> onları birbirine bağlar ve <b>Animation</b> bu iskeleti hareket ettirir. Aşağıda gerçek bir oyun motoru editörü var — bir nesneye tıkla, özelliklerini değiştir, animasyonu oynat.', en: 'Now everything comes together. Dozens of GameObjects nest inside a <b>Hierarchy</b>, a <b>Rig (skeleton)</b> links them, and <b>Animation</b> moves that skeleton. Below is a real game-engine editor — click an object, edit its properties, play an animation.' },
  'ed.hierarchy': { tr: '⛬ Hiyerarşi', en: '⛬ Hierarchy' },
  'ed.scenegraph': { tr: 'Sahne Grafiği', en: 'Scene Graph' },
  'ed.hierarchyhint': { tr: 'Parent → Child ilişkisi. Bir öğeye tıkla → seç.', en: 'Parent → Child relationship. Click an item → select.' },
  'ed.animation': { tr: 'Animasyon', en: 'Animation' },
  'ed.manual': { tr: '⏹ Manuel', en: '⏹ Manual' },
  'ed.wave': { tr: '👋 El Salla', en: '👋 Wave' },
  'ed.walk': { tr: '🚶 Yürü', en: '🚶 Walk' },
  'ed.view': { tr: 'Görünüm', en: 'View' },
  'ed.rig': { tr: '🦴 Rig / İskelet', en: '🦴 Rig / Skeleton' },
  'ed.resetcam': { tr: '🎯 Kamerayı Sıfırla', en: '🎯 Reset Camera' },
  'ed.selected': { tr: 'Seçili:', en: 'Selected:' },
  'ed.loading': { tr: '3D sahne hazırlanıyor…', en: 'Preparing 3D scene…' },
  'ed.inspector': { tr: '⚙ Inspector', en: '⚙ Inspector' },
  'ed.properties': { tr: 'Özellikler', en: 'Properties' },
  'ed.empty': { tr: 'Bir nesne seç ve özelliklerini burada düzenle.', en: 'Select an object to edit its properties here.' },
  'tour.intro.title': { tr: 'Editör turunu başlatmak için "Sonraki"ye bas', en: 'Hit "Next" to start the editor tour' },
  'tour.intro.body': { tr: 'Her adım ilgili nesneyi otomatik seçer ve ne deneyeceğini söyler.', en: 'Each step auto-selects the relevant object and tells you what to try.' },
  'tour.prev': { tr: '‹ Önceki', en: '‹ Prev' },
  'tour.next': { tr: 'Sonraki ›', en: 'Next ›' },
  'gloss.title': { tr: 'Kavram Sözlüğü', en: 'Concept Glossary' },
  'footer': { tr: 'Oyun Motoru Atölyesi · Three.js ile geliştirildi · Öğrenciler için açık eğitim materyali', en: 'Game Engine Studio · Built with Three.js · Open educational material for students' },
};

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const s = STR[el.dataset.i18n];
    if (s) el.innerHTML = L(s);
  });
}
function refreshGoStatus() {
  goStatusTag.textContent = L(goStep >= 2 ? GO_STATUS.full : goStep >= 1 ? GO_STATUS.mesh : GO_STATUS.empty);
}
function setLang(lang) {
  LANG = lang;
  try { localStorage.setItem('atolye_lang', lang); } catch (e) {}
  document.documentElement.lang = lang;
  document.title = lang === 'tr'
    ? 'Oyun Motoru Atölyesi · 2D Görselden 3D Oyun Nesnesine'
    : 'Game Engine Studio · From a 2D Image to a 3D Game Object';
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  applyI18n();
  // dile bağlı dinamik içerikleri yeniden çiz
  buildSwatches();
  fillBaseSelect();
  updateMatThumb();
  renderGoComponents();
  refreshGoStatus();
  renderGlossary();
  renderInspector();
  if (lessonIdx >= 0) gotoLesson(lessonIdx);
  else lessonStepEl.textContent = `${lang === 'tr' ? 'Tur' : 'Tour'} 1 / ${lessons.length}`;
}
document.getElementById('langSwitch').addEventListener('click', (e) => {
  const b = e.target.closest('.lang-btn');
  if (b) setLang(b.dataset.lang);
});

// Başlangıç dili: kayıtlı tercih > tarayıcı dili (Türkçe ise TR, değilse EN)
const savedLang = (() => { try { return localStorage.getItem('atolye_lang'); } catch (e) { return null; } })();
const navLang = (navigator.language || 'tr').toLowerCase();
const initialLang = (savedLang === 'tr' || savedLang === 'en') ? savedLang : (navLang.startsWith('tr') ? 'tr' : 'en');

// ------------------------------------------------------------------
//  Başlat
// ------------------------------------------------------------------
drawTexturePreview();
matColor.value = '#' + journey.material.color.getHexString();
resizeEditor();
renderHierarchy();
selectObject(avatar);
setLang(initialLang);          // dili uygula + dile bağlı her şeyi çiz
loadingEl.classList.add('hidden');
window.__sceneReady = true;
tick();
