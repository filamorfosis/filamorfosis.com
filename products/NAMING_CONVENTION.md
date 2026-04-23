# Filamorfosis — Product Image Naming Convention

## Folder Structure

```
products/images/
  uv/        — UV Printing products
  3d/        — 3D Printing products
  laser/     — Laser Cutting products
  engrave/   — Laser Engraving products
  photo/     — Photo Printing products
```

## File Naming Convention

```
{category}-{productId}-{sequence}.{ext}
```

### Rules
- **category**: matches the folder name (`uv`, `3d`, `laser`, `engrave`, `photo`)
- **productId**: matches the product `id` field in the JS data file (kebab-case)
- **sequence**: 1-based integer (`1`, `2`, `3`...)
- **ext**: `jpeg`, `jpg`, `png`, `webp`, or `mp4` for videos

### Examples

| File | Category | Product | Sequence |
|------|----------|---------|----------|
| `uv/uv-coaster-1.jpeg` | UV | uv-coaster | 1st image |
| `uv/uv-coaster-2.jpeg` | UV | uv-coaster | 2nd image |
| `uv/uv-tumbler-1.jpeg` | UV | uv-tumbler | 1st image |
| `3d/3d-figurine-1.jpeg` | 3D | 3d-figurine | 1st image |
| `3d/3d-prototype-1.mp4` | 3D | 3d-prototype | 1st video |
| `laser/laser-wood-cut-1.jpeg` | Laser | laser-wood-cut | 1st image |
| `engrave/engrave-wood-1.jpeg` | Engrave | engrave-wood | 1st image |
| `engrave/engrave-metal-1.mp4` | Engrave | engrave-metal | 1st video |
| `photo/photo-print-1.jpeg` | Photo | photo-print | 1st image |

## Referencing in Product Data

In `products/data/Products_UV.js` (and other data files):

```js
{
  id: 'uv-coaster',
  images: [
    'products/images/uv/uv-coaster-1.jpeg',
    'products/images/uv/uv-coaster-2.jpeg',
  ],
}
```

## Admin Tool Convention

When uploading via the Admin tool:
1. Select the product category → determines the folder
2. Select the product → determines the productId prefix
3. Files are auto-numbered sequentially
4. Uploaded as: `products/images/{category}/{category}-{productId}-{n}.{ext}`

## Migration

Run `products/migrate-images.bat` once to copy existing images to the new structure.
