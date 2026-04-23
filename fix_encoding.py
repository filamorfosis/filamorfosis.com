import os

files = ['admin.html', 'index.html', 'products.html', 'account.html']
for f in files:
    if not os.path.exists(f):
        print(f'Skip (not found): {f}')
        continue
    with open(f, 'rb') as fh:
        raw = fh.read()
    text = raw.decode('latin-1')
    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(text)
    print(f'Fixed: {f}')
