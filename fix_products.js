const fs = require('fs');
let content = fs.readFileSync('assets/js/products.js', 'utf8');

// Fix: price-original span inline style
content = content.replace(
    /<span style="text-decoration:line-through;color:#64748b;font-size:1rem;margin-right:2px">/g,
    '<span class="modal-variant-price-original">'
);

// Fix: price-effective span inline style
content = content.replace(
    /<span style="color:#fb923c;font-weight:700">/g,
    '<span class="modal-variant-price-effective">'
);

// Fix: qty input inline style
content = content.replace(
    /<input type="number" class="variant-qty" value="1" min="1" max="99"\s+style="width:44px;text-align:center;background:#1e293b;border:1px solid #334155;color:#f1f5f9;border-radius:6px;padding:3px 4px;font-size:1rem">/g,
    '<input type="number" class="variant-qty modal-qty-input" value="1" min="1" max="99">'
);

// Fix: _showShareTooltip style.cssText — replace with CSS class
content = content.replace(
    /tip\.style\.cssText = \[[\s\S]*?\]\.join\(';'\);/,
    "tip.classList.add('share-tooltip');"
);

// Fix: textarea transient style (this is acceptable per standards — position:fixed;opacity:0 for clipboard)
// Leave ta.style.cssText as-is since it's a transient animation state

fs.writeFileSync('assets/js/products.js', content, 'utf8');
console.log('Done - products.js fixed');

// Verify no remaining style= violations (excluding the transient textarea one)
const remaining = content.match(/style="[^"]*(?:color:|background:|font-size:|border:|width:|height:)[^"]*"/g);
if (remaining) {
    console.log('Remaining style= violations:', remaining.slice(0, 10));
} else {
    console.log('No remaining persistent style= violations found');
}
