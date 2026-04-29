# Product Analysis & Use-Case Tagging

## Analysis of 36 Products

### Current Product Breakdown:

**UV Printing Products (28):**
- Coasters, Tumblers, Mugs, Stickers, Magnets, Bottles, Phone Cases
- Wood Signs, Keychains, Tiles, Stained Glass, Metal Posters
- Wood Frames, Canvas, Bottle Openers, Acrylic Art, Tote Bags
- Business Cards, Pet Tags, Awards, Nail Art, Golf Balls
- Luggage Tags, Wedding Stationery, Jewelry, Skateboards
- Challenge Coins, Posters

**Laser Engraving Products (6):**
- Wood, Metal, Glass, Leather, Acrylic, Stone

---

## Proposed Use-Case Categories

### 1. 🎁 **Regalos Personalizados** (Personalized Gifts)
**Target**: People looking for unique, personalized gifts for any occasion

**Products (18):**
- Tumblers (hot)
- Mugs (new)
- Coasters (hot)
- Stickers (hot)
- Magnets
- Bottles (new)
- Phone Cases
- Keychains (promo)
- Pet Tags
- Golf Balls
- Jewelry (new)
- Challenge Coins
- Bottle Openers (promo)
- Engrave Wood (hot)
- Engrave Glass
- Engrave Leather
- Engrave Acrylic (new)
- Engrave Stone

**Keywords**: regalo, gift, personalizado, custom, souvenir, birthday, anniversary

---

### 2. ☕ **Tazas y Vasos** (Mugs & Drinkware)
**Target**: People specifically looking for drinkware

**Products (5):**
- Tumblers (hot)
- Mugs (new)
- Bottles (new)
- Coasters (hot)
- Engrave Glass

**Keywords**: taza, mug, vaso, tumbler, botella, bottle, drinkware, café, coffee, té, tea

---

### 3. 🏢 **Empresarial y Branding** (Business & Corporate)
**Target**: Businesses looking for promotional items, branding, signage

**Products (14):**
- Stickers (hot)
- Magnets
- Business Cards
- Awards
- Tote Bags
- Wood Signs
- Metal Posters (hot)
- Luggage Tags
- Challenge Coins
- Posters
- Engrave Metal (new)
- Engrave Glass
- Engrave Acrylic (new)
- Engrave Wood (hot)

**Keywords**: corporativo, business, branding, logo, empresa, promotional, señalética, signage

---

### 4. 🖼️ **Decoración del Hogar** (Home Decor)
**Target**: People looking to decorate their homes

**Products (13):**
- Coasters (hot)
- Wood Signs
- Stained Glass (new)
- Metal Posters (hot)
- Wood Frames
- Canvas
- Acrylic Art (new)
- Tiles
- Posters
- Engrave Wood (hot)
- Engrave Acrylic (new)
- Engrave Stone
- Engrave Glass

**Keywords**: decoración, decor, pared, wall, arte, art, hogar, home, cuadro, frame

---

### 5. 🎉 **Eventos y Celebraciones** (Events & Celebrations)
**Target**: People planning weddings, parties, corporate events

**Products (11):**
- Wedding Stationery
- Coasters (hot)
- Magnets
- Bottle Openers (promo)
- Tote Bags
- Awards
- Challenge Coins
- Stickers (hot)
- Luggage Tags
- Engrave Glass
- Engrave Wood (hot)

**Keywords**: boda, wedding, evento, event, fiesta, party, celebración, celebration, souvenir

---

### 6. 🎨 **Arte y Diseño Personalizado** (Art & Custom Design)
**Target**: Artists, designers, people wanting unique artistic pieces

**Products (12):**
- Stained Glass (new)
- Metal Posters (hot)
- Canvas
- Acrylic Art (new)
- Wood Frames
- Nail Art (new)
- Jewelry (new)
- Skateboards
- Posters
- Engrave Wood (hot)
- Engrave Acrylic (new)
- Engrave Stone

**Keywords**: arte, art, diseño, design, artístico, artistic, único, unique, custom

---

## Implementation Strategy

### Primary Categories (Main Tabs):
1. 🎁 Regalos (18 products)
2. ☕ Tazas y Vasos (5 products)
3. 🏢 Empresarial (14 products)
4. 🖼️ Decoración (13 products)
5. 🎉 Eventos (11 products)
6. 🎨 Arte y Diseño (12 products)
7. 📦 Todos (36 products)

### Secondary Filters (Keep existing):
- 🔥 Popular (badge: hot)
- ✨ Nuevo (badge: new)
- 💰 Económico (<$100)
- 💎 Premium (>$200)
- 🏷️ Promo (badge: promo)

### Product Multi-Category Assignment:
Many products belong to multiple categories (e.g., Tumblers are both "Gifts" and "Drinkware"). This is intentional and improves discoverability.

---

## Database Changes Needed

### Add `use_cases` field to Product table:
```sql
ALTER TABLE Products ADD COLUMN use_cases TEXT[];
```

### Update products with use case tags:
Each product will have an array like: `["gifts", "drinkware"]`

### Category mapping:
- `gifts` → 🎁 Regalos
- `drinkware` → ☕ Tazas y Vasos
- `business` → 🏢 Empresarial
- `decor` → 🖼️ Decoración
- `events` → 🎉 Eventos
- `art` → 🎨 Arte y Diseño

---

## Benefits

1. **Customer-centric**: Categories match how customers think, not how products are made
2. **Better discovery**: Products appear in multiple relevant categories
3. **Higher conversion**: Customers find what they need faster
4. **Flexible**: Easy to add new use cases without changing product data
5. **SEO-friendly**: Use-case categories match search intent better

