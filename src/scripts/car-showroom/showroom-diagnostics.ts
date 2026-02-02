import { withBasePath } from '../../utils/helpers';

export type AssetProbeResult = {
  url: string;
  ok: boolean;
  status: number;
  statusText: string;
  contentType: string;
};

export const detectAutomation = (): boolean => {
  try {
    const nav = navigator as unknown as { webdriver?: boolean };
    if (nav.webdriver) return true;
    const ua = String(navigator.userAgent || '');
    return /headless/i.test(ua);
  } catch {
    return false;
  }
};

export const detectShowroomDebug = (): boolean => {
  try {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get('debug') === '1' ||
      params.get('debug') === 'true' ||
      params.get('csrDebug') === '1' ||
      params.get('csrDebug') === 'true'
    );
  } catch {
    return false;
  }
};

const toAbsoluteUrl = (pathOrUrl: string): string => {
  const raw = (pathOrUrl || '').trim();
  if (!raw) return '';
  try {
    return new URL(raw, document.baseURI).toString();
  } catch {
    return raw;
  }
};

export const resolveShowroomAsset = (rawPath: string): string => {
  const v = (rawPath || '').trim();
  if (!v) return '';
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(v)) return v;

  const normalized = v.startsWith('/') ? v : `/${v}`;

  // Avoid double-prefixing base paths if the string already contains it.
  const basePrefix = withBasePath('/');
  if (basePrefix !== '/' && normalized.startsWith(basePrefix)) {
    return normalized;
  }

  return withBasePath(normalized);
};

export const probeSameOriginHead = async (
  pathOrUrl: string
): Promise<AssetProbeResult> => {
  const abs = toAbsoluteUrl(pathOrUrl);
  try {
    const u = new URL(abs);
    if (u.origin !== window.location.origin) {
      return {
        url: abs,
        ok: false,
        status: -1,
        statusText: 'cross-origin',
        contentType: '',
      };
    }

    const res = await fetch(abs, { method: 'HEAD', cache: 'no-store' });
    return {
      url: abs,
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      contentType: res.headers.get('content-type') || '',
    };
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === 'string'
          ? e
          : 'unknown error';
    return {
      url: abs,
      ok: false,
      status: -1,
      statusText: message,
      contentType: '',
    };
  }
};

export const buildShowroomDiagnosticsText = (opts: {
  root: HTMLElement;
  defaultModel: string;
  extra?: string;
}) => {
  const { root, defaultModel, extra } = opts;
  const ds = root.dataset;
  const modelRaw = (ds.carShowroomModel || '').trim() || defaultModel;
  const modelResolved = resolveShowroomAsset(modelRaw);
  const decoderBase = resolveShowroomAsset('/draco/gltf/');

  const payload = {
    url: typeof location !== 'undefined' ? location.href : '',
    baseUrl: import.meta.env.BASE_URL,
    model: {
      raw: modelRaw,
      resolved: modelResolved,
    },
    draco: {
      base: decoderBase,
      js: `${decoderBase}draco_decoder.js`,
      wrapper: `${decoderBase}draco_wasm_wrapper.js`,
      wasm: `${decoderBase}draco_decoder.wasm`,
    },
    state: {
      loading: ds.carShowroomLoading,
      phase: ds.carShowroomLoadPhase,
      ready: ds.carShowroomReady,
      webgl: document.documentElement.dataset.carShowroomWebgl,
    },
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    webdriver:
      typeof navigator !== 'undefined' ? Boolean(navigator.webdriver) : false,
    extra: extra || '',
  };

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
};

export const probeShowroomAssets = async (opts: {
  root: HTMLElement;
  defaultModel: string;
}) => {
  const { root, defaultModel } = opts;
  const modelRaw = (root.dataset.carShowroomModel || '').trim() || defaultModel;
  const modelResolved = resolveShowroomAsset(modelRaw);
  const decoderBase = resolveShowroomAsset('/draco/gltf/');

  const [model, js, wrapper, wasm] = await Promise.all([
    probeSameOriginHead(modelResolved),
    probeSameOriginHead(`${decoderBase}draco_decoder.js`),
    probeSameOriginHead(`${decoderBase}draco_wasm_wrapper.js`),
    probeSameOriginHead(`${decoderBase}draco_decoder.wasm`),
  ]);

  return {
    modelRaw,
    modelResolved,
    decoderBase,
    model,
    js,
    wrapper,
    wasm,
  };
};

const formatProbeLines = (probes: {
  model: AssetProbeResult;
  js: AssetProbeResult;
  wrapper: AssetProbeResult;
  wasm: AssetProbeResult;
}) => {
  const { model, js, wrapper, wasm } = probes;
  return [
    '',
    'Asset probe:',
    `- MODEL  ${model.status} ${model.statusText} (${model.contentType || 'no content-type'}) ${model.url}`,
    `- DRACO  ${js.status} ${js.statusText} (${js.contentType || 'no content-type'}) ${js.url}`,
    `- WRAP   ${wrapper.status} ${wrapper.statusText} (${wrapper.contentType || 'no content-type'}) ${wrapper.url}`,
    `- WASM   ${wasm.status} ${wasm.statusText} (${wasm.contentType || 'no content-type'}) ${wasm.url}`,
  ].join('\n');
};

export const ensureShowroomErrorActionRow = (opts: {
  root: HTMLElement;
  errorEl: HTMLElement;
  diagnosticsUrl: string;
  defaultModel: string;
  fallbackModel: string;
  isAutomation: boolean;
  copyToClipboard: (text: string) => Promise<boolean>;
  bumpRevision: () => void;
  syncStatus: () => void;
}) => {
  const {
    root,
    errorEl,
    diagnosticsUrl,
    defaultModel,
    fallbackModel,
    isAutomation,
    copyToClipboard,
    bumpRevision,
    syncStatus,
  } = opts;

  if (errorEl.querySelector('[data-csr-error-action="row"]')) return;

  const row = document.createElement('div');
  row.setAttribute('data-csr-error-action', 'row');
  row.style.cssText =
    'display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;align-items:center;';

  const mkBtn = (label: string) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.setAttribute('data-csr-error-action', 'btn');
    btn.style.cssText =
      'cursor:pointer;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.92);padding:8px 10px;border-radius:10px;font-weight:650;font-size:12px;';
    return btn;
  };

  const copyBtn = mkBtn('Copy diagnostics');
  copyBtn.addEventListener('click', async () => {
    const extra = (root.dataset.carShowroomLoadError || '').trim();
    const text = buildShowroomDiagnosticsText({
      root,
      defaultModel,
      extra,
    });
    const ok = await copyToClipboard(text);
    if (ok) {
      copyBtn.textContent = 'Copied';
      window.setTimeout(() => {
        copyBtn.textContent = 'Copy diagnostics';
      }, 1200);
    }
  });

  const probeBtn = mkBtn('Probe assets');
  probeBtn.addEventListener('click', async () => {
    if (isAutomation) return;

    probeBtn.textContent = 'Probing…';
    probeBtn.disabled = true;

    const probes = await probeShowroomAssets({ root, defaultModel });
    const lines = formatProbeLines(probes);

    root.dataset.carShowroomLoadError =
      `${(root.dataset.carShowroomLoadError || '').trim()}\n${lines}`.trim();
    syncStatus();

    probeBtn.textContent = 'Probe assets';
    probeBtn.disabled = false;
  });

  const fallbackBtn = mkBtn('Try fallback model');
  fallbackBtn.addEventListener('click', () => {
    root.dataset.carShowroomModel = fallbackModel;
    root.dataset.carShowroomLoadError = '';
    bumpRevision();
    syncStatus();
  });

  const clearBtn = mkBtn('Clear');
  clearBtn.addEventListener('click', () => {
    root.dataset.carShowroomLoadError = '';
    syncStatus();
  });

  const openBtn = mkBtn('Open diagnostics');
  openBtn.addEventListener('click', () => {
    try {
      window.open(diagnosticsUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // ignore
    }
  });

  row.append(copyBtn, probeBtn, fallbackBtn, clearBtn, openBtn);
  errorEl.appendChild(row);
};

export const runShowroomPreflight = async (opts: {
  root: HTMLElement;
  defaultModel: string;
  fallbackModel: string;
  isAutomation: boolean;
  bumpRevision: () => void;
  syncStatus: () => void;
}) => {
  const {
    root,
    defaultModel,
    fallbackModel,
    isAutomation,
    bumpRevision,
    syncStatus,
  } = opts;

  if (isAutomation) return;
  if (root.dataset.carShowroomPreflight === '1') return;
  root.dataset.carShowroomPreflight = '1';

  const modelRaw = (root.dataset.carShowroomModel || '').trim() || defaultModel;

  // Only auto-fallback when the default model is selected.
  if (modelRaw !== defaultModel) return;

  const probes = await probeShowroomAssets({ root, defaultModel });

  const wasmType = (probes.wasm.contentType || '').toLowerCase();
  const wasmMimeOk = wasmType.includes('application/wasm');

  const shouldFallback =
    !probes.model.ok ||
    !probes.js.ok ||
    !probes.wrapper.ok ||
    !probes.wasm.ok ||
    !wasmMimeOk;

  if (!shouldFallback) return;

  const reasons: string[] = [];
  if (!probes.model.ok) reasons.push('model unreachable');
  if (!probes.js.ok) reasons.push('draco_decoder.js unreachable');
  if (!probes.wrapper.ok) reasons.push('draco_wasm_wrapper.js unreachable');
  if (!probes.wasm.ok) reasons.push('draco_decoder.wasm unreachable');
  if (probes.wasm.ok && !wasmMimeOk)
    reasons.push(
      `draco_decoder.wasm content-type is ${probes.wasm.contentType || 'missing'}`
    );

  root.dataset.carShowroomModel = fallbackModel;

  root.dataset.carShowroomLoadError =
    `Preflight detected a Draco/model hosting issue (${reasons.join(', ')}). Switched to fallback model to keep the showroom usable.` +
    `\n\nDiagnostics: ${formatProbeLines(probes)}`;

  bumpRevision();
  syncStatus();
};
