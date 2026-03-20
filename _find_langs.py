with open('assets/js/main.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines, 1):
    stripped = l.strip()
    if stripped in ["es: {", "en: {", "ja: {", "zh: {"]:
        print(i, l.rstrip())
    if 'const translations' in l or 'var translations' in l or 'let translations' in l:
        print(i, l.rstrip())
