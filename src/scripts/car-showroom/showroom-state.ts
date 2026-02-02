import {
  clamp,
  clamp01,
  fromBase64Url,
  normalizeHexColor,
  parseNum,
  safeParseJson,
} from './showroom-utils';

export type SavedPreset = {
  id: string;
  name: string;
  state: Record<string, string>;
};

export type ManualPartKind =
  | 'body'
  | 'decal'
  | 'trim'
  | 'wheel'
  | 'tire'
  | 'caliper'
  | 'light'
  | 'glass';

export type PartMap = Record<string, ManualPartKind>;

export const PRESETS_STORAGE_KEY = 'csr-presets-v1';
export const PARTMAP_STORAGE_PREFIX = 'csr-partmap-v1::';

export const PRESET_DATASET_KEYS: Array<keyof DOMStringMap> = [
  'carShowroomQuality',
  'carShowroomModel',
  'carShowroomMode',
  'carShowroomColor',
  'carShowroomWrapColor',
  'carShowroomWrapPattern',
  'carShowroomWrapScale',
  'carShowroomWrapStyle',
  'carShowroomWrapTint',
  'carShowroomWrapRotationDeg',
  'carShowroomWrapOffsetX',
  'carShowroomWrapOffsetY',
  'carShowroomFinish',
  'carShowroomClearcoat',
  'carShowroomFlakeIntensity',
  'carShowroomFlakeScale',
  'carShowroomPearl',
  'carShowroomPearlThickness',
  'carShowroomRideHeight',
  'carShowroomModelYaw',
  'carShowroomWheelFinish',
  'carShowroomWheelColor',
  'carShowroomTrimFinish',
  'carShowroomTrimColor',
  'carShowroomCaliperColor',
  'carShowroomLightColor',
  'carShowroomLightGlow',
  'carShowroomGlassTint',
  'carShowroomLightPreset',
  'carShowroomLightWarmth',
  'carShowroomRimBoost',
  'carShowroomBackground',
  'carShowroomEnvIntensity',
  'carShowroomEnvRotation',
  'carShowroomLightIntensity',
  'carShowroomRigYaw',
  'carShowroomRigHeight',
  'carShowroomGrid',
  'carShowroomUnderglow',
  'carShowroomUnderglowColor',
  'carShowroomUnderglowSize',
  'carShowroomUnderglowPulse',
  'carShowroomShadowStrength',
  'carShowroomShadowSize',
  'carShowroomFloorPreset',
  'carShowroomFloorColor',
  'carShowroomFloorRoughness',
  'carShowroomFloorMetalness',
  'carShowroomFloorOpacity',
  'carShowroomExposure',
  'carShowroomBloomStrength',
  'carShowroomBloomThreshold',
  'carShowroomBloomRadius',
  'carShowroomCameraPreset',
  'carShowroomCameraMode',
  'carShowroomCamYaw',
  'carShowroomCamPitch',
  'carShowroomCamDistance',
  'carShowroomFov',
  'carShowroomLookAtX',
  'carShowroomLookAtY',
  'carShowroomLookAtZ',
  'carShowroomMotionStyle',
  'carShowroomMotionRange',
  'carShowroomSpinSpeed',
  'carShowroomZoom',
  'carShowroomAutoRotate',
  'carShowroomAutoQuality',
  'carShowroomPartMap',
];

export const isManualPartKind = (v: unknown): v is ManualPartKind =>
  v === 'body' ||
  v === 'decal' ||
  v === 'trim' ||
  v === 'wheel' ||
  v === 'tire' ||
  v === 'caliper' ||
  v === 'light' ||
  v === 'glass';

export const normalizePartMap = (raw: unknown): PartMap => {
  if (!raw || typeof raw !== 'object') return {};
  const obj = raw as Record<string, unknown>;
  const out: PartMap = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = String(k || '').trim();
    if (!key) continue;
    if (!isManualPartKind(v)) continue;
    out[key] = v;
  }
  return out;
};

export const getPartMapStorageKey = (modelUrl: string): string | null => {
  const model = (modelUrl || '').trim();
  if (!model) return null;
  // Don't persist mappings for blob/data models (too transient/large).
  if (model.startsWith('blob:') || model.startsWith('data:')) return null;
  return `${PARTMAP_STORAGE_PREFIX}${model}`;
};

export const loadPartMapForModel = (modelUrl: string): PartMap => {
  const key = getPartMapStorageKey(modelUrl);
  if (!key) return {};
  try {
    const raw = localStorage.getItem(key);
    const parsed = safeParseJson<unknown>(raw);
    return normalizePartMap(parsed);
  } catch {
    return {};
  }
};

export const savePartMapForModel = (modelUrl: string, map: PartMap) => {
  const key = getPartMapStorageKey(modelUrl);
  if (!key) return;
  try {
    const keys = Object.keys(map);
    if (keys.length === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(map));
  } catch {
    // ignore
  }
};

export const loadSavedPresets = (): SavedPreset[] => {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    const parsed = safeParseJson<SavedPreset[]>(raw);
    if (!parsed || !Array.isArray(parsed)) return [];
    return parsed
      .map(p => ({
        id: String(p?.id || ''),
        name: String(p?.name || 'Preset'),
        state: (p?.state || {}) as Record<string, string>,
      }))
      .filter(p => p.id.length > 0);
  } catch {
    return [];
  }
};

export const saveSavedPresets = (presets: SavedPreset[]) => {
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // ignore
  }
};

export const applyQueryState = (root: HTMLElement) => {
  const params = new URLSearchParams(window.location.search);
  const model = params.get('model');
  const mode = params.get('mode');
  const color = params.get('color');
  const finish = params.get('finish');
  const wheel = params.get('wheel');
  const trim = params.get('trim');
  const whc = params.get('whc');
  const trc = params.get('trc');
  const ccol = params.get('ccol');
  const lcol = params.get('lcol');
  const lglow = params.get('lglow');
  const tint = params.get('tint');
  const bg = params.get('bg');
  const cam = params.get('cam');
  const spin = params.get('spin');
  const zoom = params.get('zoom');
  const ar = params.get('ar');
  const aq = params.get('aq');
  const ms = params.get('ms');
  const ma = params.get('ma');
  const cm = params.get('cm');
  const yaw = params.get('yaw');
  const pitch = params.get('pitch');
  const dist = params.get('dist');
  const fov = params.get('fov');
  const lx = params.get('lx');
  const ly = params.get('ly');
  const lz = params.get('lz');
  const exp = params.get('exp');
  const bloom = params.get('bloom');
  const bt = params.get('bt');
  const br = params.get('br');
  const cc = params.get('cc');
  const fi = params.get('fi');
  const fs = params.get('fs');
  const pr = params.get('pr');
  const pt = params.get('pt');
  const rh = params.get('rh');
  const my = params.get('my');
  const lw = params.get('lw');
  const rb = params.get('rb');
  const lp = params.get('lp');

  const env = params.get('env');
  const li = params.get('li');
  const ry = params.get('ry');
  const rgh = params.get('rgh');
  const grid = params.get('grid');
  const ug = params.get('ug');
  const ugc = params.get('ugc');
  const ugs = params.get('ugs');
  const up = params.get('up');
  const ss = params.get('ss');
  const sz = params.get('sz');
  const floor = params.get('floor');
  const fcol = params.get('fcol');
  const fr = params.get('fr');
  const fm = params.get('fm');
  const fo = params.get('fo');

  const wcolor = params.get('wcolor');
  const wpat = params.get('wpat');
  const wscale = params.get('wscale');
  const wstyle = params.get('wstyle');
  const wtint = params.get('wtint');
  const wrot = params.get('wrot');
  const wox = params.get('wox');
  const woy = params.get('woy');

  const pm = params.get('pm');

  if (model) root.dataset.carShowroomModel = model;

  if (
    mode === 'paint' ||
    mode === 'wrap' ||
    mode === 'glass' ||
    mode === 'wireframe' ||
    mode === 'factory'
  ) {
    root.dataset.carShowroomMode = mode;
  }
  if (finish) root.dataset.carShowroomFinish = finish;
  const fiN = parseNum(fi);
  if (fiN !== null)
    root.dataset.carShowroomFlakeIntensity = String(clamp01(fiN));
  const fsN = parseNum(fs);
  if (fsN !== null)
    root.dataset.carShowroomFlakeScale = String(clamp(fsN, 0.5, 8));
  if (wheel) root.dataset.carShowroomWheelFinish = wheel;
  if (trim) root.dataset.carShowroomTrimFinish = trim;
  if (bg) root.dataset.carShowroomBackground = bg;
  if (cam) root.dataset.carShowroomCameraPreset = cam;

  if (whc) {
    const hex = normalizeHexColor(whc);
    if (hex) root.dataset.carShowroomWheelColor = hex;
  }
  if (trc) {
    const hex = normalizeHexColor(trc);
    if (hex) root.dataset.carShowroomTrimColor = hex;
  }
  if (ccol) {
    const hex = normalizeHexColor(ccol);
    if (hex) root.dataset.carShowroomCaliperColor = hex;
  }
  if (lcol) {
    const hex = normalizeHexColor(lcol);
    if (hex) root.dataset.carShowroomLightColor = hex;
  }

  const lglowN = parseNum(lglow);
  if (lglowN !== null)
    root.dataset.carShowroomLightGlow = String(clamp(lglowN, 0, 4));

  if (color) {
    const hex = normalizeHexColor(color);
    if (hex) root.dataset.carShowroomColor = hex;
  }

  const tintN = parseNum(tint);
  if (tintN !== null)
    root.dataset.carShowroomGlassTint = String(clamp01(tintN));

  const lwN = parseNum(lw);
  if (lwN !== null) root.dataset.carShowroomLightWarmth = String(clamp01(lwN));

  const rbN = parseNum(rb);
  if (rbN !== null)
    root.dataset.carShowroomRimBoost = String(clamp(rbN, 0.5, 2));

  if (lp) root.dataset.carShowroomLightPreset = lp;

  const ccN = parseNum(cc);
  if (ccN !== null) root.dataset.carShowroomClearcoat = String(clamp01(ccN));

  const prN = parseNum(pr);
  if (prN !== null) root.dataset.carShowroomPearl = String(clamp01(prN));

  const ptN = parseNum(pt);
  if (ptN !== null)
    root.dataset.carShowroomPearlThickness = String(clamp(ptN, 100, 800));

  const rhN = parseNum(rh);
  if (rhN !== null)
    root.dataset.carShowroomRideHeight = String(clamp(rhN, -0.3, 0.3));

  const myN = parseNum(my);
  if (myN !== null)
    root.dataset.carShowroomModelYaw = String(clamp(myN, 0, 360));

  const spinN = parseNum(spin);
  if (spinN !== null)
    root.dataset.carShowroomSpinSpeed = String(clamp(spinN, 0, 2));

  const zoomN = parseNum(zoom);
  if (zoomN !== null) root.dataset.carShowroomZoom = String(clamp01(zoomN));

  if (ar === '0' || ar === 'false')
    root.dataset.carShowroomAutoRotate = 'false';
  if (ar === '1' || ar === 'true') root.dataset.carShowroomAutoRotate = 'true';

  if (aq === '0' || aq === 'false')
    root.dataset.carShowroomAutoQuality = 'false';
  if (aq === '1' || aq === 'true') root.dataset.carShowroomAutoQuality = 'true';

  if (ms === 'spin' || ms === 'orbit' || ms === 'pendulum') {
    root.dataset.carShowroomMotionStyle = ms;
  }

  const maN = parseNum(ma);
  if (maN !== null)
    root.dataset.carShowroomMotionRange = String(clamp(maN, 0, 45));

  if (cm === 'manual' || cm === 'preset')
    root.dataset.carShowroomCameraMode = cm;

  const yawN = parseNum(yaw);
  if (yawN !== null)
    root.dataset.carShowroomCamYaw = String(clamp(yawN, -180, 180));
  const pitchN = parseNum(pitch);
  if (pitchN !== null)
    root.dataset.carShowroomCamPitch = String(clamp(pitchN, -5, 60));
  const distN = parseNum(dist);
  if (distN !== null)
    root.dataset.carShowroomCamDistance = String(clamp(distN, 2.5, 14));
  const fovN = parseNum(fov);
  if (fovN !== null) root.dataset.carShowroomFov = String(clamp(fovN, 35, 85));

  const lxN = parseNum(lx);
  const lyN = parseNum(ly);
  const lzN = parseNum(lz);
  if (lxN !== null) root.dataset.carShowroomLookAtX = String(lxN);
  if (lyN !== null) root.dataset.carShowroomLookAtY = String(lyN);
  if (lzN !== null) root.dataset.carShowroomLookAtZ = String(lzN);

  const expN = parseNum(exp);
  if (expN !== null)
    root.dataset.carShowroomExposure = String(clamp(expN, 0.1, 3));

  const bloomN = parseNum(bloom);
  if (bloomN !== null)
    root.dataset.carShowroomBloomStrength = String(clamp(bloomN, 0, 3));

  const btN = parseNum(bt);
  if (btN !== null)
    root.dataset.carShowroomBloomThreshold = String(clamp01(btN));

  const brN = parseNum(br);
  if (brN !== null) root.dataset.carShowroomBloomRadius = String(clamp01(brN));

  const envN = parseNum(env);
  if (envN !== null)
    root.dataset.carShowroomEnvIntensity = String(clamp(envN, 0, 3));

  const liN = parseNum(li);
  if (liN !== null)
    root.dataset.carShowroomLightIntensity = String(clamp(liN, 0.2, 2.5));

  const ryN = parseNum(ry);
  if (ryN !== null) root.dataset.carShowroomRigYaw = String(clamp(ryN, 0, 360));

  const rghN = parseNum(rgh);
  if (rghN !== null)
    root.dataset.carShowroomRigHeight = String(clamp(rghN, 0.6, 1.6));

  if (grid === '1' || grid === 'true') root.dataset.carShowroomGrid = 'true';
  if (grid === '0' || grid === 'false') root.dataset.carShowroomGrid = 'false';

  const ugN = parseNum(ug);
  if (ugN !== null)
    root.dataset.carShowroomUnderglow = String(clamp(ugN, 0, 5));

  if (ugc) {
    const hex = normalizeHexColor(ugc);
    if (hex) root.dataset.carShowroomUnderglowColor = hex;
  }

  const ugsN = parseNum(ugs);
  if (ugsN !== null)
    root.dataset.carShowroomUnderglowSize = String(clamp(ugsN, 2, 8));

  const upN = parseNum(up);
  if (upN !== null)
    root.dataset.carShowroomUnderglowPulse = String(clamp01(upN));

  const ssN = parseNum(ss);
  if (ssN !== null)
    root.dataset.carShowroomShadowStrength = String(clamp01(ssN));

  const szN = parseNum(sz);
  if (szN !== null)
    root.dataset.carShowroomShadowSize = String(clamp(szN, 3, 10));

  if (
    floor === 'auto' ||
    floor === 'asphalt' ||
    floor === 'matte' ||
    floor === 'polished' ||
    floor === 'glass'
  ) {
    root.dataset.carShowroomFloorPreset = floor;
  }

  if (fcol) {
    const hex = normalizeHexColor(fcol);
    if (hex) root.dataset.carShowroomFloorColor = hex;
  }

  const frN = parseNum(fr);
  if (frN !== null)
    root.dataset.carShowroomFloorRoughness = String(clamp01(frN));

  const fmN = parseNum(fm);
  if (fmN !== null)
    root.dataset.carShowroomFloorMetalness = String(clamp01(fmN));

  const foN = parseNum(fo);
  if (foN !== null)
    root.dataset.carShowroomFloorOpacity = String(clamp(foN, 0, 1));

  if (wcolor) {
    const hex = normalizeHexColor(wcolor);
    if (hex) root.dataset.carShowroomWrapColor = hex;
  }

  if (
    wpat === 'solid' ||
    wpat === 'stripes' ||
    wpat === 'carbon' ||
    wpat === 'camo' ||
    wpat === 'checker' ||
    wpat === 'hex' ||
    wpat === 'race'
  ) {
    root.dataset.carShowroomWrapPattern = wpat;
  }

  const wscaleN = parseNum(wscale);
  if (wscaleN !== null)
    root.dataset.carShowroomWrapScale = String(clamp(wscaleN, 0.2, 6));

  if (wstyle === 'oem' || wstyle === 'procedural') {
    root.dataset.carShowroomWrapStyle = wstyle;
  }

  const wtintN = parseNum(wtint);
  if (wtintN !== null)
    root.dataset.carShowroomWrapTint = String(clamp01(wtintN));

  const wrotN = parseNum(wrot);
  if (wrotN !== null)
    root.dataset.carShowroomWrapRotationDeg = String(clamp(wrotN, -180, 180));

  const woxN = parseNum(wox);
  if (woxN !== null)
    root.dataset.carShowroomWrapOffsetX = String(clamp(woxN, -2, 2));

  const woyN = parseNum(woy);
  if (woyN !== null)
    root.dataset.carShowroomWrapOffsetY = String(clamp(woyN, -2, 2));

  if (pm) {
    const decoded = fromBase64Url(pm);
    const parsed = decoded ? safeParseJson<unknown>(decoded) : null;
    const map = normalizePartMap(parsed);
    const json = Object.keys(map).length ? JSON.stringify(map) : '';
    if (json) root.dataset.carShowroomPartMap = json;
  }
};
