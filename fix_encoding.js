const fs = require('fs');
const path = require('path');

function decodeOnce(buf) {
  const str = buf.toString('utf8');
  return Buffer.from(str, 'latin1');
}

function isFixed(text) {
  // Check for common correctly-encoded Spanish chars
  return !text.includes('Ã') && !text.includes('Â') && !text.includes('â');
}

function fixBuffer(buf) {
  // Strip corrupted BOM (EF BB BF encoded as UTF-8 of latin1)
  const corruptedBOM = Buffer.from([0xC3, 0xAF, 0xC2, 0xBB, 0xC2, 0xBF]);
  const realBOM = Buffer.from([0xEF, 0xBB, 0xBF]);
  if (buf.slice(0, 6).equals(corruptedBOM)) buf = buf.slice(6);
  else if (buf.slice(0, 3).equals(realBOM)) buf = buf.slice(3);

  // Try up to 3 decode rounds
  let current = buf;
  for (let i = 0; i < 3; i++) {
    const decoded = decodeOnce(current);
    const text = decoded.toString('utf8');
    if (isFixed(text)) {
      return { buf: decoded, rounds: i + 1 };
    }
    current = decoded;
  }
  return { buf: current, rounds: 3 };
}

function fixFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  const buf = fs.readFileSync(filepath);
  const text = buf.toString('utf8');
  if (isFixed(text)) { console.log('OK (no fix needed):', filepath); return; }

  const { buf: fixed, rounds } = fixBuffer(buf);
  const result = fixed.toString('utf8');
  if (isFixed(result)) {
    fs.writeFileSync(filepath, result, { encoding: 'utf8' });
    console.log(`Fixed (${rounds} rounds): ${filepath}`);
  } else {
    console.log(`WARN still has issues: ${filepath}`);
    fs.writeFileSync(filepath, result, { encoding: 'utf8' });
  }
}

function walkDir(dir, exts) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'bin', 'obj', 'vendors'].includes(e.name)) continue;
      walkDir(full, exts);
    } else if (exts.some(ext => e.name.endsWith(ext))) {
      fixFile(full);
    }
  }
}

// Fix HTML files in root
['admin.html', 'index.html', 'products.html', 'account.html'].forEach(fixFile);

// Fix JS files
walkDir('assets/js', ['.js']);

// Fix CSS files
walkDir('assets/css', ['.css']);

console.log('Done.');
