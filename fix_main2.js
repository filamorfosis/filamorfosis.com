const fs = require('fs');
const path = 'assets/js/main.js';
const lines = fs.readFileSync(path, 'utf8').split('\n');
const result = [];
let removed = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // Keep empty lines
  if (trimmed === '') { result.push(line); continue; }

  // Keep lines that look like valid JS structure
  const isValid =
    trimmed.startsWith('//') ||          // comment
    trimmed.startsWith('/*') ||          // block comment
    trimmed.startsWith('*') ||           // block comment continuation
    trimmed.startsWith('const ') ||
    trimmed.startsWith('let ') ||
    trimmed.startsWith('var ') ||
    trimmed.startsWith('function ') ||
    trimmed.startsWith('async ') ||
    trimmed.startsWith('return ') ||
    trimmed.startsWith('if ') ||
    trimmed.startsWith('if(') ||
    trimmed.startsWith('for ') ||
    trimmed.startsWith('for(') ||
    trimmed.startsWith('while') ||
    trimmed.startsWith('switch') ||
    trimmed.startsWith('case ') ||
    trimmed.startsWith('break') ||
    trimmed.startsWith('continue') ||
    trimmed.startsWith('try') ||
    trimmed.startsWith('catch') ||
    trimmed.startsWith('throw') ||
    trimmed.startsWith('window.') ||
    trimmed.startsWith('document.') ||
    trimmed.startsWith('(function') ||
    trimmed.startsWith('export') ||
    trimmed.startsWith('import') ||
    /^[\}\)\];,]/.test(trimmed) ||       // closing brackets/semicolons
    /^[\w_$]+\s*[:(,]/.test(trimmed) ||  // property: value, or identifier(
    /^[\w_$]+\s*=/.test(trimmed) ||      // assignment
    /^\[/.test(trimmed) ||               // array
    /^\{/.test(trimmed) ||               // object
    /^'/.test(trimmed) ||                // string value continuation (rare but valid)
    /^\d/.test(trimmed);                 // number

  if (isValid) {
    result.push(line);
  } else {
    console.log(`REMOVED L${i+1}: ${JSON.stringify(trimmed.substring(0, 60))}`);
    removed++;
  }
}

fs.writeFileSync(path, result.join('\n'), 'utf8');
console.log(`\nRemoved ${removed} garbage lines. Total lines: ${result.length}`);
