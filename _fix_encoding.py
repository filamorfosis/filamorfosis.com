#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix encoding corruption in admin.html"""

import codecs

# Read as latin-1 (which preserves the corrupted bytes)
with codecs.open('admin.html', 'r', encoding='latin-1') as f:
    content = f.read()

# Fix common corruptions
replacements = {
    'â€"': '—',
    'Â®': '®',
    'Ã³': 'ó',
    'Ã±': 'ñ',
    'Ã­': 'í',
    'Ã©': 'é',
    'Ã¡': 'á',
    'â€¢': '•',
    'Ãº': 'ú',
    'Ã': 'Á',
    'Ã‰': 'É',
    'Ã': 'Í',
    'Ã"': 'Ó',
    'Ãš': 'Ú',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Write as UTF-8
with codecs.open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('✓ Fixed encoding in admin.html')
