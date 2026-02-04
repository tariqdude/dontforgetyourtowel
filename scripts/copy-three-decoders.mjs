import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();

const copyFile = async (src, dest) => {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
};

const safeStat = async p => {
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
};

const main = async () => {
  // KTX2Loader uses Basis Universal transcoder files (JS + WASM).
  // We place them under /public/basis/ so runtime requests resolve under the app base path.
  const basisSrcDir = path.join(
    repoRoot,
    'node_modules',
    'three',
    'examples',
    'jsm',
    'libs',
    'basis'
  );
  const basisDestDir = path.join(repoRoot, 'public', 'basis');

  const files = ['basis_transcoder.js', 'basis_transcoder.wasm'];

  const dirStat = await safeStat(basisSrcDir);
  if (!dirStat?.isDirectory()) {
    // Don't hard-fail installs; 3D still works without KTX2.
    console.warn(
      '[copy-three-decoders] Missing three.js basis dir:',
      basisSrcDir
    );
    return;
  }

  for (const file of files) {
    const src = path.join(basisSrcDir, file);
    const dest = path.join(basisDestDir, file);
    const srcStat = await safeStat(src);
    if (!srcStat?.isFile()) {
      console.warn('[copy-three-decoders] Missing file:', src);
      continue;
    }
    await copyFile(src, dest);
  }

  console.log(
    '[copy-three-decoders] Copied Basis transcoders to',
    basisDestDir
  );
};

main().catch(err => {
  console.warn('[copy-three-decoders] Failed:', err);
});
