'use strict';

/**
 * Unit tests for assets/css/design-system.css
 * Validates: Requirements 1.9, 1.10
 *
 * Reads the CSS file and asserts all required token groups are defined
 * and non-empty. Uses only Node.js built-ins — no external dependencies.
 */

const fs = require('fs');
const path = require('path');

// ── Load the CSS file ────────────────────────────────────────────────────────
const cssPath = path.resolve(__dirname, '../assets/css/design-system.css');

if (!fs.existsSync(cssPath)) {
  console.error(`❌ FATAL: design-system.css not found at ${cssPath}`);
  process.exit(1);
}

const css = fs.readFileSync(cssPath, 'utf8');

// ── Minimal test harness ─────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${description}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

/**
 * Returns all CSS custom property names matching a prefix pattern.
 * e.g. findTokens('--color-') returns ['--color-bg-primary', ...]
 */
function findTokens(prefix) {
  const re = new RegExp(`(${prefix.replace(/-/g, '\\-')}[\\w-]+)\\s*:`, 'g');
  const matches = [];
  let m;
  while ((m = re.exec(css)) !== null) {
    matches.push(m[1]);
  }
  return [...new Set(matches)];
}

/**
 * Returns the value of a specific CSS custom property from the :root block.
 */
function getTokenValue(name) {
  const re = new RegExp(`${name.replace(/-/g, '\\-')}\\s*:\\s*([^;]+);`);
  const m = css.match(re);
  return m ? m[1].trim() : null;
}

/**
 * Checks that a CSS class exists in the file.
 */
function classExists(selector) {
  return css.includes(selector);
}

/**
 * Checks that a @keyframes block exists.
 */
function keyframesExists(name) {
  return new RegExp(`@keyframes\\s+${name}\\s*\\{`).test(css);
}

// ── Test Suite ───────────────────────────────────────────────────────────────

console.log('\n📋 design-system.css — Token Group Tests\n');

// ── 1. Color tokens ──────────────────────────────────────────────────────────
console.log('Color tokens:');

test('--color-bg-primary is defined and equals #0a0e1a', () => {
  const val = getTokenValue('--color-bg-primary');
  assert(val !== null, '--color-bg-primary not found');
  assert(val === '#0a0e1a', `Expected #0a0e1a, got "${val}"`);
});

test('--color-bg-surface is defined', () => {
  const val = getTokenValue('--color-bg-surface');
  assert(val !== null && val.length > 0, '--color-bg-surface not found or empty');
});

test('--color-accent-purple is defined and equals #8b5cf6', () => {
  const val = getTokenValue('--color-accent-purple');
  assert(val !== null, '--color-accent-purple not found');
  assert(val === '#8b5cf6', `Expected #8b5cf6, got "${val}"`);
});

test('--color-success, --color-warning, --color-error are all defined', () => {
  ['--color-success', '--color-warning', '--color-error'].forEach(token => {
    const val = getTokenValue(token);
    assert(val !== null && val.length > 0, `${token} not found or empty`);
  });
});

test('At least 10 --color-* tokens are defined', () => {
  const tokens = findTokens('--color-');
  assert(tokens.length >= 10, `Expected ≥10 color tokens, found ${tokens.length}: ${tokens.join(', ')}`);
});

// ── 2. Gradient tokens ───────────────────────────────────────────────────────
console.log('\nGradient tokens:');

test('--color-gradient-brand is defined with correct value', () => {
  const val = getTokenValue('--color-gradient-brand');
  assert(val !== null, '--color-gradient-brand not found');
  assert(val.includes('linear-gradient'), `Expected linear-gradient, got "${val}"`);
  assert(val.includes('#6366f1'), `Expected #6366f1 in gradient, got "${val}"`);
});

test('--color-gradient-uv and --color-gradient-warm are defined', () => {
  ['--color-gradient-uv', '--color-gradient-warm'].forEach(token => {
    const val = getTokenValue(token);
    assert(val !== null && val.includes('linear-gradient'), `${token} not found or not a gradient`);
  });
});

// ── 3. Typography tokens ─────────────────────────────────────────────────────
console.log('\nTypography tokens:');

test('At least 8 --font-size-* tokens are defined', () => {
  const tokens = findTokens('--font-size-');
  assert(tokens.length >= 8, `Expected ≥8 font-size tokens, found ${tokens.length}`);
});

test('--font-size-xs through --font-size-hero are all defined', () => {
  const required = ['--font-size-xs', '--font-size-sm', '--font-size-base', '--font-size-md',
                    '--font-size-lg', '--font-size-xl', '--font-size-2xl', '--font-size-3xl', '--font-size-hero'];
  required.forEach(token => {
    const val = getTokenValue(token);
    assert(val !== null && val.length > 0, `${token} not found or empty`);
  });
});

test('--font-weight-* scale has 5 entries (regular → extrabold)', () => {
  const tokens = findTokens('--font-weight-');
  assert(tokens.length >= 5, `Expected ≥5 font-weight tokens, found ${tokens.length}`);
});

test('--line-height-* tokens are defined', () => {
  const tokens = findTokens('--line-height-');
  assert(tokens.length >= 3, `Expected ≥3 line-height tokens, found ${tokens.length}`);
});

// ── 4. Spacing tokens ────────────────────────────────────────────────────────
console.log('\nSpacing tokens:');

test('--space-xs is defined and equals 4px', () => {
  const val = getTokenValue('--space-xs');
  assert(val !== null, '--space-xs not found');
  assert(val === '4px', `Expected 4px, got "${val}"`);
});

test('At least 9 --space-* tokens are defined', () => {
  const tokens = findTokens('--space-');
  assert(tokens.length >= 9, `Expected ≥9 spacing tokens, found ${tokens.length}`);
});

test('--space-4xl is defined and equals 96px', () => {
  const val = getTokenValue('--space-4xl');
  assert(val !== null, '--space-4xl not found');
  assert(val === '96px', `Expected 96px, got "${val}"`);
});

// ── 5. Border radius tokens ──────────────────────────────────────────────────
console.log('\nBorder radius tokens:');

test('At least 6 --radius-* tokens are defined', () => {
  const tokens = findTokens('--radius-');
  assert(tokens.length >= 6, `Expected ≥6 radius tokens, found ${tokens.length}`);
});

test('--radius-md equals 8px', () => {
  const val = getTokenValue('--radius-md');
  assert(val !== null, '--radius-md not found');
  assert(val === '8px', `Expected 8px, got "${val}"`);
});

test('--radius-full is defined', () => {
  const val = getTokenValue('--radius-full');
  assert(val !== null && val.length > 0, '--radius-full not found or empty');
});

// ── 6. Shadow tokens ─────────────────────────────────────────────────────────
console.log('\nShadow tokens:');

test('--shadow-sm, --shadow-md, --shadow-lg are defined', () => {
  ['--shadow-sm', '--shadow-md', '--shadow-lg'].forEach(token => {
    const val = getTokenValue(token);
    assert(val !== null && val.length > 0, `${token} not found or empty`);
  });
});

test('Glow shadow variants --shadow-glow-purple and --shadow-glow-pink are defined', () => {
  ['--shadow-glow-purple', '--shadow-glow-pink'].forEach(token => {
    const val = getTokenValue(token);
    assert(val !== null && val.length > 0, `${token} not found or empty`);
  });
});

// ── 7. Z-index tokens ────────────────────────────────────────────────────────
console.log('\nZ-index tokens:');

test('At least 7 --z-* tokens are defined', () => {
  const tokens = findTokens('--z-');
  assert(tokens.length >= 7, `Expected ≥7 z-index tokens, found ${tokens.length}`);
});

test('--z-promo-banner equals 1100', () => {
  const val = getTokenValue('--z-promo-banner');
  assert(val !== null, '--z-promo-banner not found');
  assert(val === '1100', `Expected 1100, got "${val}"`);
});

test('--z-dropdown equals 500', () => {
  const val = getTokenValue('--z-dropdown');
  assert(val !== null, '--z-dropdown not found');
  assert(val === '500', `Expected 500, got "${val}"`);
});

test('Z-index values are in descending order: promo-banner > navbar > drawer > modal > toast > fab > dropdown', () => {
  const order = ['--z-promo-banner', '--z-navbar', '--z-drawer', '--z-modal', '--z-toast', '--z-fab', '--z-dropdown'];
  const values = order.map(t => parseInt(getTokenValue(t), 10));
  for (let i = 0; i < values.length - 1; i++) {
    assert(values[i] > values[i + 1],
      `Expected ${order[i]} (${values[i]}) > ${order[i+1]} (${values[i+1]})`);
  }
});

// ── 8. Transition tokens ─────────────────────────────────────────────────────
console.log('\nTransition tokens:');

test('At least 4 --transition-* tokens are defined', () => {
  const tokens = findTokens('--transition-');
  assert(tokens.length >= 4, `Expected ≥4 transition tokens, found ${tokens.length}`);
});

// ── 9. Breakpoint tokens ─────────────────────────────────────────────────────
console.log('\nBreakpoint tokens:');

test('--bp-mobile, --bp-tablet, --bp-desktop are defined', () => {
  const expected = { '--bp-mobile': '480px', '--bp-tablet': '768px', '--bp-desktop': '1024px' };
  Object.entries(expected).forEach(([token, expectedVal]) => {
    const val = getTokenValue(token);
    assert(val !== null, `${token} not found`);
    assert(val === expectedVal, `Expected ${token} = ${expectedVal}, got "${val}"`);
  });
});

// ── 10. Shared component classes ─────────────────────────────────────────────
console.log('\nShared component classes:');

test('.btn-primary class is defined', () => {
  assert(classExists('.btn-primary'), '.btn-primary class not found');
});

test('.btn-secondary class is defined', () => {
  assert(classExists('.btn-secondary'), '.btn-secondary class not found');
});

test('.btn-ghost class is defined', () => {
  assert(classExists('.btn-ghost'), '.btn-ghost class not found');
});

test('Button classes use padding: 12px 24px', () => {
  assert(css.includes('padding: 12px 24px'), 'padding: 12px 24px not found in button classes');
});

test('Button classes use var(--radius-md) for border-radius', () => {
  assert(css.includes('border-radius: var(--radius-md)'), 'border-radius: var(--radius-md) not found');
});

test('Button classes use var(--font-weight-semibold)', () => {
  assert(css.includes('font-weight: var(--font-weight-semibold)'), 'font-weight: var(--font-weight-semibold) not found');
});

test(':focus-visible outlines use --color-accent-purple', () => {
  assert(css.includes('var(--color-accent-purple)') && css.includes(':focus-visible'),
    ':focus-visible with --color-accent-purple not found');
});

test('.card class is defined with correct properties', () => {
  assert(classExists('.card'), '.card class not found');
  assert(css.includes('background: var(--color-bg-surface)'), 'card background token not found');
  assert(css.includes('border: 1px solid var(--color-border)'), 'card border token not found');
  assert(css.includes('border-radius: var(--radius-lg)'), 'card border-radius token not found');
  assert(css.includes('padding: var(--space-lg)'), 'card padding token not found');
});

test('.skeleton class is defined with background-size: 200% 100%', () => {
  assert(classExists('.skeleton'), '.skeleton class not found');
  assert(css.includes('background-size: 200% 100%'), 'background-size: 200% 100% not found in .skeleton');
});

test('@keyframes skeleton-shimmer is defined', () => {
  assert(keyframesExists('skeleton-shimmer'), '@keyframes skeleton-shimmer not found');
});

test('.badge base class and all 6 variants are defined', () => {
  const variants = ['.badge', '.badge-success', '.badge-warning', '.badge-error',
                    '.badge-purple', '.badge-hot', '.badge-new'];
  variants.forEach(cls => {
    assert(classExists(cls), `${cls} class not found`);
  });
});

// ── 11. Animation keyframes ──────────────────────────────────────────────────
console.log('\nAnimation keyframes:');

const requiredKeyframes = [
  'badge-pulse',
  'toast-in',
  'toast-out',
  'toast-in-mobile',
  'toast-out-mobile',
  'drawer-in',
  'nav-drawer-in',
  'wa-pulse',
  'timeline-fill',
  'slide-down',
  'skeleton-shimmer',
];

requiredKeyframes.forEach(name => {
  test(`@keyframes ${name} is defined`, () => {
    assert(keyframesExists(name), `@keyframes ${name} not found`);
  });
});

test('All keyframes use only transform and/or opacity (no layout-triggering properties)', () => {
  // Extract all @keyframes blocks and check they don't contain layout-triggering properties
  const layoutProps = ['width', 'height', 'margin', 'padding', 'top', 'left', 'right', 'bottom',
                       'font-size', 'border-width', 'display', 'position'];

  // Extract keyframe blocks
  const keyframeBlocks = [];
  const kfRe = /@keyframes\s+[\w-]+\s*\{([\s\S]*?)\n\}/g;
  let m;
  while ((m = kfRe.exec(css)) !== null) {
    keyframeBlocks.push(m[1]);
  }

  assert(keyframeBlocks.length > 0, 'No @keyframes blocks found');

  keyframeBlocks.forEach((block, i) => {
    // Get property names used inside this keyframe block (lines like "  property: value;")
    const propRe = /^\s{2,}([\w-]+)\s*:/gm;
    let pm;
    while ((pm = propRe.exec(block)) !== null) {
      const prop = pm[1];
      assert(!layoutProps.includes(prop),
        `Keyframe block #${i + 1} uses layout-triggering property "${prop}"`);
    }
  });
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error(`\n❌ ${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log(`\n✅ All ${passed} design-system tests passed.`);
  process.exit(0);
}
