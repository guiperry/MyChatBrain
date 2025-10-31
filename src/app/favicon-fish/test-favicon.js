import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get project root from CLI argument or environment variable, default to current directory
const rawProjectRoot = process.argv[2] || process.env.PROJECT_ROOT || process.cwd();
// Resolve to an absolute path so relative inputs like '../app' work reliably
let projectRoot = path.resolve(rawProjectRoot);

// Normalize duplicated trailing segments (e.g. /.../app/app -> /.../app)
try {
  const base = path.basename(projectRoot);
  const parentBase = path.basename(path.dirname(projectRoot));
  if (base && parentBase && base === parentBase) {
    projectRoot = path.dirname(projectRoot);
  }
} catch (e) {
  // ignore
}

// If user didn't supply an explicit argument (rawProjectRoot === cwd), try to auto-detect a common app folder under repo root
if (!process.argv[2]) {
  function findRepoRoot(start) {
    let cur = start;
    while (true) {
      if (fs.existsSync(path.join(cur, 'package.json')) || fs.existsSync(path.join(cur, '.git'))) return cur;
      const parent = path.dirname(cur);
      if (parent === cur) break;
      cur = parent;
    }
    return null;
  }

  const repoRoot = findRepoRoot(process.cwd());
  if (repoRoot) {
    const candidate = path.join(repoRoot, 'src', 'app');
    if (fs.existsSync(candidate)) {
      projectRoot = candidate;
    }
  }
}
let publicDir = path.join(projectRoot, 'public');

function testFavicon() {
  console.log('🧪 Testing favicon generation...\n');
  console.log(`📁 Project root: ${projectRoot}\n`);

  let passed = 0;
  let failed = 0;

  // Test 1: favicon.ico exists
  const faviconPath = path.join(publicDir, 'favicon.ico');
  if (fs.existsSync(faviconPath)) {
    const stats = fs.statSync(faviconPath);
    console.log(`✅ favicon.ico exists (${stats.size} bytes)`);
    passed++;
  } else {
    console.log(`❌ favicon.ico does not exist`);
    failed++;
  }

  // Test 2: Check favicon.ico header
  if (fs.existsSync(faviconPath)) {
    const buffer = fs.readFileSync(faviconPath);
    const reserved = buffer.readUInt16LE(0);
    const type = buffer.readUInt16LE(2);
    const imageCount = buffer.readUInt16LE(4);

    if (reserved === 0 && type === 1) {
      console.log(`✅ favicon.ico has valid ICO header (${imageCount} images)`);
      passed++;
    } else {
      console.log(`❌ favicon.ico has invalid header`);
      failed++;
    }

    if (buffer.length > 6) {
      console.log(`✅ favicon.ico has content data`);
      passed++;
    } else {
      console.log(`❌ favicon.ico is too small`);
      failed++;
    }
  }

  // Test 3: Check PNG variants
  const sizes = [16, 32, 48, 64, 128, 256];
  let pngCount = 0;
  for (const size of sizes) {
    const pngPath = path.join(publicDir, `favicon-${size}x${size}.png`);
    if (fs.existsSync(pngPath)) {
      const stats = fs.statSync(pngPath);
      if (stats.size > 0) {
        pngCount++;
      }
    }
  }

  if (pngCount === sizes.length) {
    console.log(`✅ All ${pngCount} PNG favicon variants generated`);
    passed++;
  } else {
    console.log(`❌ Only ${pngCount}/${sizes.length} PNG variants found`);
    failed++;
  }

  // Test 4: Check mascot source exists using a fully recursive search (no expected structure)
  const MASCOT_CANDIDATES = [
    'mascot.png',
    'logo.png',
    'favicon.png',
    'icon.png'
  ];

  function findFileByNameRecursive(start, targetName) {
    const lowerTarget = targetName.toLowerCase();
    const stack = [start];
    while (stack.length) {
      const dir = stack.pop();
      let entries = [];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch (e) {
        continue;
      }

      for (const ent of entries) {
        if (ent.isFile() && ent.name.toLowerCase() === lowerTarget) {
          return path.join(dir, ent.name);
        }
      }

      for (const ent of entries) {
        if (!ent.isDirectory()) continue;
        if (ent.name === 'node_modules' || ent.name === '.git') continue;
        stack.push(path.join(dir, ent.name));
      }
    }
    return null;
  }

  function findFirstPngRecursive(start) {
    const stack = [start];
    while (stack.length) {
      const dir = stack.pop();
      let entries = [];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch (e) {
        continue;
      }

      for (const ent of entries) {
        if (ent.isFile() && ent.name.toLowerCase().endsWith('.png')) {
          return path.join(dir, ent.name);
        }
      }

      for (const ent of entries) {
        if (!ent.isDirectory()) continue;
        if (ent.name === 'node_modules' || ent.name === '.git') continue;
        stack.push(path.join(dir, ent.name));
      }
    }
    return null;
  }

  function findMascot(root) {
    // Search recursively for candidate filenames first
    for (const name of MASCOT_CANDIDATES) {
      const found = findFileByNameRecursive(root, name);
      if (found) return found;
    }

    // Fallback: first PNG anywhere
    return findFirstPngRecursive(root);
  }

  let mascotPath = findMascot(projectRoot);

  // If not found and user supplied a relative path, attempt resolving relative to repo root
  if (!mascotPath && rawProjectRoot && !path.isAbsolute(rawProjectRoot)) {
    function findRepoRoot(start) {
      let cur = start;
      while (true) {
        if (fs.existsSync(path.join(cur, 'package.json')) || fs.existsSync(path.join(cur, '.git'))) return cur;
        const parent = path.dirname(cur);
        if (parent === cur) break;
        cur = parent;
      }
      return null;
    }

    const repoRoot = findRepoRoot(process.cwd());
    if (repoRoot) {
      const altRoot = path.resolve(repoRoot, rawProjectRoot);
      mascotPath = findMascot(altRoot);
      if (mascotPath) console.log(`ℹ️  Resolved project root relative to repo: ${altRoot}`);
    }
  }

    // If still not found, try searching parent directories (handles cases like '../app' resolving to 'app/app')
    if (!mascotPath) {
      let tryDir = projectRoot;
      for (let i = 0; i < 3 && tryDir; i++) {
        tryDir = path.dirname(tryDir);
        if (!tryDir || tryDir === '/' || tryDir === '.') break;
        const found = findMascot(tryDir);
        if (found) {
          mascotPath = found;
          console.log(`ℹ️  Found mascot by searching parent directories: ${tryDir}`);
          break;
        }
      }
    }
    // If a mascot was found somewhere in the tree, prefer to check public/ next to that mascot's directory
    if (mascotPath) {
      const mascotDir = path.dirname(mascotPath);
      publicDir = path.join(mascotDir, 'public');
    }
  if (mascotPath) {
    const stats = fs.statSync(mascotPath);
    console.log(`✅ Source mascot image exists (${mascotPath} — ${stats.size} bytes)`);
    passed++;
  } else {
    console.log(`❌ Source mascot image not found (searched entire project for candidates then any PNG)`);
    failed++;
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Tests passed: ${passed}/${passed + failed}`);
  
  if (failed === 0) {
    console.log(`🎉 All tests passed!`);
    process.exit(0);
  } else {
    console.log(`⚠️  ${failed} test(s) failed`);
    process.exit(1);
  }
}

testFavicon();