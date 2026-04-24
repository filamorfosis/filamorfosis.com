const fs = require('fs');
const path = 'assets/js/main.js';
let text = fs.readFileSync(path, 'utf8');

let total = 0;

// Pass 1: fix multiline strings — key: 'value\n...continuation...',
// The value spans multiple lines
text = text.replace(/^([ \t]+)([\w_]+):\s*'([^']*\n[^']*)',/gm, (m, indent, key) => {
  console.log(`FIXED multiline [${key}]`);
  total++;
  return `${indent}${key}: '',`;
});

// Pass 2: fix strings with embedded unescaped quotes — key: 'a'b',
// Value has more than one quote on the same line
text = text.replace(/^([ \t]+)([\w_]+):\s*'[^'\n]*'[^,\n\r][^'\n]*',/gm, (m, indent, key) => {
  console.log(`FIXED embedded-quote [${key}]`);
  total++;
  return `${indent}${key}: '',`;
});

// Pass 3: fix lines ending with ' but no comma (orphan from previous multiline fix)
// These look like: key: 'value'   (no trailing comma)
text = text.replace(/^([ \t]+)([\w_]+):\s*'[^'\n]*'\s*$/gm, (m, indent, key) => {
  console.log(`FIXED no-comma [${key}]`);
  total++;
  return `${indent}${key}: '',`;
});

fs.writeFileSync(path, text, 'utf8');
console.log(`\nTotal fixed: ${total}`);
