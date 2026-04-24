# Bugfix Requirements Document

## Introduction

When editing a product variant in the admin panel, the "Agregar material" button allows the same material to be added multiple times to the same variant. There is no validation preventing duplicate entries — the dropdown always shows all available materials regardless of which ones have already been added. This leads to data integrity issues where a variant can have the same material listed twice with separate quantities, producing incorrect cost calculations and ambiguous save payloads.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a material has already been added to the variant's material usage list THEN the system still shows that material as a selectable option in the "Agregar material" dropdown for subsequent additions

1.2 WHEN the user clicks "Agregar material" and all available materials are already present in the list THEN the system still appends a new row defaulting to the first material, creating a duplicate entry

1.3 WHEN a material is selected in an existing row's dropdown THEN the system does not remove it from the other rows' dropdowns, allowing the same material to be selected in multiple rows simultaneously

### Expected Behavior (Correct)

2.1 WHEN a material has already been added to the variant's material usage list THEN the system SHALL exclude that material from the dropdown options of any new or existing rows

2.2 WHEN the user clicks "Agregar material" and all available materials are already present in the list THEN the system SHALL disable or hide the "Agregar material" button so no further rows can be added

2.3 WHEN a material is removed from the variant's material usage list THEN the system SHALL make that material available again in the dropdowns of remaining rows

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a variant has no materials added yet THEN the system SHALL CONTINUE TO show all available materials in the dropdown when the first row is added

3.2 WHEN a material row's quantity is changed THEN the system SHALL CONTINUE TO update the line cost and price preview correctly

3.3 WHEN a material row is removed via the delete button THEN the system SHALL CONTINUE TO remove that row from the list and recalculate the price preview

3.4 WHEN the variant edit modal is opened for an existing variant that already has saved material usages THEN the system SHALL CONTINUE TO populate the material rows correctly from the saved data

3.5 WHEN the variant form is saved THEN the system SHALL CONTINUE TO submit the materialUsages map with the correct materialId-to-quantity pairs to the API

---

## Bug Condition

**Bug Condition Function:**
```pascal
FUNCTION isBugCondition(variantMaterialRows, allMaterials)
  INPUT: variantMaterialRows — the current list of added material rows
         allMaterials — the full list of available materials
  OUTPUT: boolean

  usedIds ← SET of materialId from each row in variantMaterialRows
  RETURN EXISTS m IN allMaterials WHERE m.id IN usedIds
         AND EXISTS row IN variantMaterialRows WHERE row.materialId = m.id
         AND COUNT(row IN variantMaterialRows WHERE row.materialId = m.id) > 1
         OR EXISTS dropdown WHERE dropdown.options CONTAINS m AND m.id IN usedIds
END FUNCTION
```

**Property: Fix Checking**
```pascal
FOR ALL state WHERE isBugCondition(state.rows, state.allMaterials) DO
  result ← renderMaterialUsagesTable'(state)
  ASSERT FOR ALL row IN result.dropdowns:
    row.options = allMaterials MINUS { m | m is used in another row }
  ASSERT COUNT(result.rows WHERE materialId = any given id) <= 1
END FOR
```

**Property: Preservation Checking**
```pascal
FOR ALL state WHERE NOT isBugCondition(state.rows, state.allMaterials) DO
  ASSERT renderMaterialUsagesTable(state) = renderMaterialUsagesTable'(state)
END FOR
```
