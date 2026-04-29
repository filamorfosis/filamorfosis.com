# Bugfix Requirements Document

## Introduction

The Admin site database schema contains several issues that prevent proper data management and violate database design principles. These issues include:

- **Inconsistent table naming**: The `CostParameters` table should be named `ProcessesCosts` to better reflect its purpose as process-specific cost definitions
- **Unused English localization fields**: Fields like `NameEn`, `TitleEn`, and `LabelEn` exist but are not used, as the application uses a client-side i18n system
- **Unused product variant fields**: Several fields (`FilamentGrams`, `MaterialId`, `PrintType`, `SizeLabel`, `WeightGrams`) were added but are not used in the current implementation
- **Potential Product Category confusion**: Need to verify that no "Product Category" concept exists, as the system uses Processes (manufacturing methods) instead
- **Missing UI support for material management**: The admin UI needs to properly support the existing many-to-many relationship between ProductVariants and Materials with quantity tracking

This bugfix ensures the database schema is clean, consistent, and properly reflected in the admin UI, while preserving all existing admin functionality for managing Processes, Materials, Products, and their relationships.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN viewing the database schema THEN the CostParameters table name does not clearly indicate its relationship to Processes

1.2 WHEN examining entity classes THEN unused English localization fields (NameEn, TitleEn, LabelEn) exist in Process, Product, and ProductVariant entities

1.3 WHEN examining the ProductVariant entity THEN unused fields (FilamentGrams, MaterialId, PrintType, SizeLabel, WeightGrams) exist that are not used in the application

1.4 WHEN searching the codebase THEN there may be references to "Product Category" as a concept distinct from Processes

1.5 WHEN using the admin UI to manage product variants THEN the interface does not properly support adding multiple materials with quantities to a variant

1.6 WHEN adding materials to a variant THEN the UI does not validate that the requested quantity does not exceed available stock

1.7 WHEN viewing the admin modals THEN the UI may reference removed or renamed database fields

### Expected Behavior (Correct)

2.1 WHEN viewing the database schema THEN the table SHALL be named `ProcessesCosts` to clearly indicate it stores cost parameters for each Process

2.2 WHEN examining entity classes THEN the NameEn field SHALL NOT exist in the Process entity

2.3 WHEN examining entity classes THEN the TitleEn field SHALL NOT exist in the Product entity

2.4 WHEN examining entity classes THEN the LabelEn field SHALL NOT exist in the ProductVariant entity

2.5 WHEN examining the ProductVariant entity THEN the FilamentGrams field SHALL NOT exist

2.6 WHEN examining the ProductVariant entity THEN the MaterialId field SHALL NOT exist (many-to-many relationship via VariantMaterialUsage is correct)

2.7 WHEN examining the ProductVariant entity THEN the PrintType field SHALL NOT exist

2.8 WHEN examining the ProductVariant entity THEN the SizeLabel field SHALL NOT exist

2.9 WHEN examining the ProductVariant entity THEN the WeightGrams field SHALL NOT exist

2.10 WHEN searching the entire codebase THEN no references to "Product Category" as a distinct concept SHALL exist (only Processes exist as manufacturing categories)

2.11 WHEN using the admin UI to edit a product variant THEN the interface SHALL provide a way to add multiple materials with their respective quantities

2.12 WHEN adding a material to a variant THEN the UI SHALL validate that the requested quantity does not exceed the material's available stock quantity

2.13 WHEN saving a variant with materials THEN the system SHALL calculate the production cost as the sum of (material.BaseCost × quantity) for all materials

2.14 WHEN viewing admin modals THEN all field references SHALL match the updated database schema (ProcessesCosts table, no English fields, no unused fields)

2.15 WHEN using the admin UI THEN all JavaScript files SHALL maintain proper UTF-8 encoding without replacement characters or encoding corruption

### Unchanged Behavior (Regression Prevention)

3.1 WHEN managing Processes in the admin UI THEN the system SHALL CONTINUE TO allow creating, editing, and deleting processes

3.2 WHEN managing Materials in the admin UI THEN the system SHALL CONTINUE TO allow creating, editing, and deleting materials with their costs and stock quantities

3.3 WHEN managing Products in the admin UI THEN the system SHALL CONTINUE TO allow creating, editing, and deleting products with their Spanish localization (TitleEs, DescriptionEs)

3.4 WHEN managing Product Variants in the admin UI THEN the system SHALL CONTINUE TO allow creating, editing, and deleting variants with their Spanish labels (LabelEs)

3.5 WHEN managing Process costs in the admin UI THEN the system SHALL CONTINUE TO allow defining cost parameters for each process (electricity, labor, supplies, etc.)

3.6 WHEN a ProductVariant uses multiple materials THEN the system SHALL CONTINUE TO track each material usage via the VariantMaterialUsage table

3.7 WHEN calculating variant pricing THEN the system SHALL CONTINUE TO use BaseCost (production cost) + Profit to determine the final price

3.8 WHEN viewing the admin interface THEN all existing functionality for Orders, Users, and Global Parameters SHALL CONTINUE TO work without changes

3.9 WHEN the CostParameter entity is renamed THEN all existing API endpoints SHALL CONTINUE TO function with the renamed entity

3.10 WHEN English fields are removed THEN the Spanish localization fields (NameEs, TitleEs, LabelEs, DescriptionEs) SHALL CONTINUE TO function normally
