with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'Total lines: {len(lines)}')

# Find key markers
for i, line in enumerate(lines):
    stripped = line.strip()
    if any(x in stripped for x in [
        'id="services"', 'id="catalog"', 'CATALOG SECTION',
        'Brand Story', 'id="home"', 'category-strip',
        'featured-hot', 'featured-new'
    ]):
        print(f'Line {i+1}: {stripped[:120]}')
