import sharp from 'sharp';
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

// Candidate mascot filenames (in order of preference)
const MASCOT_CANDIDATES = [
  'mascot.png',
  'logo.png',
  'favicon.png',
  'icon.png'
];

function findFirstPngRecursive(start) {
  // Depth-first search for first .png file. Skip node_modules and .git for speed.
  const stack = [start];
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      continue; // permission or other error
    }

    for (const ent of entries) {
      const name = ent.name;
      if (ent.isFile() && name.toLowerCase().endsWith('.png')) {
        return path.join(dir, name);
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

function findMascotImage(root) {
  // Search recursively for candidate filenames first (anywhere in project)
  for (const name of MASCOT_CANDIDATES) {
    const found = findFileByNameRecursive(root, name);
    if (found) return found;
  }

  // Fallback: first PNG anywhere in project
  return findFirstPngRecursive(root);
}

let inputPath = findMascotImage(projectRoot);

// If nothing found and the user provided a relative path, try resolving it relative
// to the repository root (useful when callers pass paths relative to repo root).
if (!inputPath && rawProjectRoot && !path.isAbsolute(rawProjectRoot)) {
  // find repo root by walking up from current working directory
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
    inputPath = findMascotImage(altRoot);
    if (inputPath) {
      // prefer the alt resolved project root
      console.log(`ℹ️  Resolved project root relative to repo: ${altRoot}`);
    }
  }
}

// If still not found, try searching parent directories (handles cases like '../app' resolving to 'app/app')
if (!inputPath) {
  let tryDir = projectRoot;
  for (let i = 0; i < 3 && tryDir; i++) {
    tryDir = path.dirname(tryDir);
    if (!tryDir || tryDir === '/' || tryDir === '.') break;
    const found = findMascotImage(tryDir);
    if (found) {
      inputPath = found;
      console.log(`ℹ️  Found mascot by searching parent directories: ${tryDir}`);
      break;
    }
  }
}

// If a mascot was found somewhere in the tree, prefer to write output into a public/ next to that mascot's directory
if (inputPath) {
  const mascotDir = path.dirname(inputPath);
  publicDir = path.join(mascotDir, 'public');
}

async function generateFavicon() {
  try {
    // Validate paths
    if (!fs.existsSync(projectRoot)) {
      throw new Error(`Project root does not exist: ${projectRoot}`);
    }

    if (!fs.existsSync(inputPath)) {
      throw new Error(`Mascot image not found at: ${inputPath}`);
    }

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    console.log('🎨 Generating favicon from mascot image...');
    console.log(`📁 Project root: ${projectRoot}`);
    console.log(`🖼️  Input image: ${inputPath}`);
    
    // Generate favicon.ico with proper BMP encoding
    await generateIcoFile(inputPath, publicDir);
    
    // Also generate PNG favicons for modern browsers
    const sizes = [16, 32, 48, 64, 128, 256];
    for (const size of sizes) {
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(path.join(publicDir, `favicon-${size}x${size}.png`));
    }
    
    console.log('✅ Favicon generated successfully!');
    console.log(`📝 Output: ${path.join(publicDir, 'favicon.ico')}`);
    console.log(`📝 PNG variants generated for multiple sizes`);

  } catch (error) {
    console.error('❌ Error generating favicon:', error.message);
    console.error(error);
    process.exit(1);
  }
}

async function generateIcoFile(inputPath, publicDir) {
  // Generate favicon at multiple sizes
  const sizes = [16, 32, 48];
  const images = [];
  
  for (const size of sizes) {
    // Convert to PNG format and extract metadata
    const pngBuffer = await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();
      
    images.push({ size, buffer: pngBuffer });
  }

  const icoBuffer = createICOFromPNGs(images);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
}

function createICOFromPNGs(images) {
  // ICO Header (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);              // Reserved
  header.writeUInt16LE(1, 2);              // Type: 1 = ICO
  header.writeUInt16LE(images.length, 4); // Number of images

  // Calculate directory size and offsets
  const directorySize = images.length * 16;
  let dataOffset = 6 + directorySize;

  // Image Directory Entries (16 bytes each)
  const directories = [];
  const buffers = [header];

  for (const img of images) {
    const dir = Buffer.alloc(16);
    dir.writeUInt8(img.size === 256 ? 0 : img.size, 0);  // Width (0 means 256)
    dir.writeUInt8(img.size === 256 ? 0 : img.size, 1);  // Height (0 means 256)
    dir.writeUInt8(0, 2);                  // Color count (0 = no palette)
    dir.writeUInt8(0, 3);                  // Reserved
    dir.writeUInt16LE(1, 4);               // Color planes
    dir.writeUInt16LE(32, 6);              // Bits per pixel
    dir.writeUInt32LE(img.buffer.length, 8);  // Size
    dir.writeUInt32LE(dataOffset, 12);     // Offset

    directories.push(dir);
    dataOffset += img.buffer.length;
  }

  // Combine all parts
  buffers.push(Buffer.concat(directories));
  buffers.push(...images.map(img => img.buffer));

  return Buffer.concat(buffers);
}

generateFavicon();