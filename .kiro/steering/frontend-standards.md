# Filamorfosis — Frontend Coding Standards

## 1. Internationalization (i18n)

- Every language must have its own dedicated file: `assets/js/i18n/lang.{code}.js`
- Supported languages: `es`, `en`, `de`, `pt`, `ja`, `zh`
- Each file must set `window.FilamorfosisI18n['{code}'] = { ... }` — no other pattern is acceptable
- Translation strings must **never** be hardcoded inside `main.js`, `products.js`, or any other JS file
- Translation strings must **never** be hardcoded inside HTML files
- All user-visible text that varies by language must use `data-translate` or `data-t` attributes on the HTML element
- Characters must always be stored and served as UTF-8 — no escaped unicode sequences, no replacement characters (U+FFFD), no garbled multibyte sequences
- When adding a new translation key, it must be added to **all 6 language files**

## 2. Styling

- **No inline styles** — `style="..."` attributes are forbidden on any HTML element, whether hardcoded in HTML or injected via JavaScript
- **No `$(el).css(...)` calls** for persistent styles — jQuery `.css()` may only be used for transient animation states (e.g. opacity during a crossfade), never for layout, color, font, or spacing
- All styling must live exclusively in the CSS files under `assets/css/`
- JavaScript may only toggle CSS classes (`classList.add`, `classList.remove`, `classList.toggle`, `$.addClass`, `$.removeClass`) to change appearance
- CSS custom properties (variables) defined in `:root` are the correct way to share values between components

## 3. Typography — Minimum Font Size

- **No font size smaller than `1rem`** anywhere in the codebase — not in CSS, not in inline styles, not in JS-injected HTML
- This applies to all units: `px`, `em`, `rem`, `vw`, `pt`, etc. — the computed size must never fall below `1rem` (16px at default browser settings)
- Use `clamp()` for responsive text rather than small fixed sizes
- Never use `font-size` values like `0.8rem`, `0.75rem`, `11px`, `12px`, or smaller

## 4. Character Encoding

- All files must be saved as **UTF-8 without BOM**
- All HTML files must declare `<meta charset="UTF-8">` as the first tag inside `<head>`
- Emoji and special characters must be written as literal UTF-8 characters — never as HTML entities (`&#x1F4E6;`) or JS unicode escapes (`\u1F4E6`) unless there is a specific technical reason
- Never commit files containing U+FFFD replacement characters — this indicates a broken encoding pipeline that must be fixed at the source

## 5. Dead Code

- No unused JavaScript functions, variables, or event listeners may exist in any JS file
- No commented-out code blocks — use git history for recovery instead
- No `console.log`, `console.warn`, or `console.error` calls in production code (use a proper logger or remove entirely)
- No scripts loaded in HTML that are not actively used by that page
- No CSS rules that target elements that do not exist on the page
- Before adding any new function or utility, verify it is not already implemented elsewhere in the codebase
- When removing a feature, remove its JS, CSS, and HTML together — no orphaned code
