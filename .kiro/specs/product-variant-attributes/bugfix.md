# Bugfix Requirements Document

## Introduction

`ProductVariant` currently has a hardcoded `Material TEXT NULL` column that was added via a one-off migration. This is the wrong approach: it hard-wires a single attribute type into the schema and cannot accommodate the variety of attributes that different products need (Size, Color, Material, Finish, etc.). The fix replaces this column with a catalog-driven attribute system composed of three new concepts:

1. **AttributeDefinition** — a reusable catalog of named attributes (e.g. "Size", "Color", "Material").
2. **ProductAttribute** — a many-to-many join declaring which attributes a given product uses.
3. **VariantAttributeValue** — per-variant values for each declared attribute (e.g. Variant 1: Size=L, Color=White, Material=Glass).

The `Material` column on `ProductVariant` and all code that reads or writes it must be removed and replaced by this flexible system.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a product variant is created or updated THEN the system stores only a single optional `Material` text value, making it impossible to record other attributes (Size, Color, Finish, etc.) on the same variant.

1.2 WHEN a product needs variants that differ by multiple dimensions (e.g. Size AND Color AND Material) THEN the system has no way to represent those dimensions, forcing operators to encode all differences into the free-text `LabelEs`/`LabelEn` fields.

1.3 WHEN the admin UI renders the variant edit modal THEN the system shows a hardcoded "Material" dropdown populated from `CategoryAttribute` records whose `AttributeType = "material"`, which is a misuse of the category-attribute table and does not scale to other attribute types.

1.4 WHEN `GET /api/v1/products/{id}` or `GET /api/v1/admin/products/{id}` returns a variant THEN the system includes a `material` field in `ProductVariantDto` that cannot represent multi-attribute variants.

1.5 WHEN `POST /api/v1/admin/products/{id}/variants` or `PUT /api/v1/admin/products/{id}/variants/{variantId}` is called THEN the system accepts a `material` field in the request body and persists it to the `Material` column, cementing the wrong schema.

### Expected Behavior (Correct)

2.1 WHEN a product variant is created or updated THEN the system SHALL store zero or more attribute values (each linking a `VariantId` + `AttributeDefinitionId` + `Value`) so that any combination of attributes can be recorded on a single variant.

2.2 WHEN a product needs variants that differ by multiple dimensions THEN the system SHALL allow operators to declare any set of `AttributeDefinition` records on the product and set independent values per variant for each declared attribute.

2.3 WHEN the admin UI renders the product edit modal THEN the system SHALL display an "Attributes" section where operators can add or remove `AttributeDefinition` entries from a catalog (or create new ones inline), scoped to that product.

2.4 WHEN the admin UI renders the variant edit modal THEN the system SHALL display one input field per attribute declared on the parent product, pre-populated with the variant's current value for that attribute, so the operator can set or clear each value independently.

2.5 WHEN `GET /api/v1/products/{id}` or `GET /api/v1/admin/products/{id}` returns a variant THEN the system SHALL include an `attributes` array (each element: `{ attributeDefinitionId, name, value }`) instead of the `material` field.

2.6 WHEN `POST /api/v1/admin/products/{id}/variants` or `PUT /api/v1/admin/products/{id}/variants/{variantId}` is called THEN the system SHALL accept an `attributes` array (each element: `{ attributeDefinitionId, value }`) and persist them as `VariantAttributeValue` rows, replacing the `material` field in the request body.

2.7 WHEN an operator creates a new `AttributeDefinition` inline from the product edit modal THEN the system SHALL persist it to the `AttributeDefinitions` catalog table so it is reusable across other products.

2.8 WHEN `GET /api/v1/admin/attribute-definitions` is called THEN the system SHALL return the full list of attribute definitions so the admin UI can populate the attribute picker.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a variant is created or updated with valid fields (LabelEs, LabelEn, SKU, Price, StockQuantity, IsAvailable, AcceptsDesignFile) THEN the system SHALL CONTINUE TO persist and return those fields correctly, unaffected by the attribute system changes.

3.2 WHEN `DELETE /api/v1/admin/products/{id}/variants/{variantId}` is called and the variant is referenced by an existing order or active cart THEN the system SHALL CONTINUE TO return HTTP 409 Conflict and refuse deletion.

3.3 WHEN `DELETE /api/v1/admin/products/{id}/variants/{variantId}` is called and the variant is not referenced by any order or cart THEN the system SHALL CONTINUE TO delete the variant and return HTTP 204.

3.4 WHEN `GET /api/v1/products` is called by the storefront THEN the system SHALL CONTINUE TO return paginated product summaries with all existing fields (id, slug, titles, descriptions, tags, imageUrls, badge, basePrice, isActive, categoryId).

3.5 WHEN discounts are applied to a variant THEN the system SHALL CONTINUE TO compute and return `effectivePrice` correctly alongside the new `attributes` array.

3.6 WHEN the admin product table is rendered THEN the system SHALL CONTINUE TO display variant count, active/inactive badge, and all existing product-level fields without regression.

---

## Bug Condition

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type ProductVariant
  OUTPUT: boolean

  // The bug condition is met whenever the system is asked to represent
  // variant-level attributes — the hardcoded Material column cannot do this.
  RETURN X requires more than one attribute dimension
      OR X requires an attribute that is not "Material"
END FUNCTION
```

```pascal
// Property: Fix Checking
FOR ALL X WHERE isBugCondition(X) DO
  result ← createOrUpdateVariant'(X)
  ASSERT result.attributes contains all declared attribute values for X
  AND    result does NOT contain a "material" field
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT createOrUpdateVariant(X).coreFields = createOrUpdateVariant'(X).coreFields
  // coreFields = { sku, labelEs, labelEn, price, stockQuantity, isAvailable, acceptsDesignFile }
END FOR
```
