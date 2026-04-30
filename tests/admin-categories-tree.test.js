/**
 * Unit tests for AdminCategories.renderCategoryTree()
 * Tests the hierarchical category tree rendering functionality
 */

// Mock the window object and required functions
global.window = {};

// Load the module
const fs = require('fs');
const path = require('path');
const moduleCode = fs.readFileSync(
  path.join(__dirname, '../assets/js/admin-categories.js'),
  'utf8'
);

// Execute the module code in our context
eval(moduleCode);

// Get the AdminCategories module
const AdminCategories = global.window.AdminCategories;

// Test helper to strip HTML and check content
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Test helper to count occurrences
function countOccurrences(str, substr) {
  return (str.match(new RegExp(substr, 'g')) || []).length;
}

console.log('Running AdminCategories.renderCategoryTree() tests...\n');

// Test 1: Empty categories array
console.log('Test 1: Empty categories array');
const emptyResult = AdminCategories.renderCategoryTree([]);
if (emptyResult.includes('No hay categorías disponibles')) {
  console.log('✓ PASS: Returns empty state message\n');
} else {
  console.error('✗ FAIL: Should return empty state message\n');
  process.exit(1);
}

// Test 2: Single root category
console.log('Test 2: Single root category');
const singleCategory = [{
  id: 'cat-1',
  nameEs: 'Regalos Personalizados',
  icon: '🎁',
  displayOrder: 1,
  isActive: true,
  children: []
}];
const singleResult = AdminCategories.renderCategoryTree(singleCategory);
const singleText = stripHtml(singleResult);
if (singleText.includes('Regalos Personalizados') && 
    singleText.includes('Activa') &&
    singleResult.includes('🎁') &&
    singleResult.includes('data-category-id="cat-1"')) {
  console.log('✓ PASS: Renders single category with name, icon, status, and ID\n');
} else {
  console.error('✗ FAIL: Single category not rendered correctly\n');
  console.error('Result:', singleText);
  process.exit(1);
}

// Test 3: Hierarchical categories (parent with children)
console.log('Test 3: Hierarchical categories (parent with children)');
const hierarchicalCategories = [{
  id: 'cat-1',
  nameEs: 'Regalos Personalizados',
  icon: '🎁',
  displayOrder: 1,
  isActive: true,
  children: [
    {
      id: 'cat-2',
      nameEs: 'Para él',
      icon: '👨',
      displayOrder: 1,
      isActive: true,
      children: []
    },
    {
      id: 'cat-3',
      nameEs: 'Para ella',
      icon: '👩',
      displayOrder: 2,
      isActive: true,
      children: []
    }
  ]
}];
const hierarchicalResult = AdminCategories.renderCategoryTree(hierarchicalCategories);
const hierarchicalText = stripHtml(hierarchicalResult);
if (hierarchicalText.includes('Regalos Personalizados') &&
    hierarchicalText.includes('Para él') &&
    hierarchicalText.includes('Para ella') &&
    hierarchicalResult.includes('width:24px') && // indentation for child
    countOccurrences(hierarchicalResult, 'data-action="edit"') === 3 &&
    countOccurrences(hierarchicalResult, 'data-action="delete"') === 3) {
  console.log('✓ PASS: Renders hierarchical structure with indentation and action buttons\n');
} else {
  console.error('✗ FAIL: Hierarchical structure not rendered correctly\n');
  console.error('Result:', hierarchicalText);
  process.exit(1);
}

// Test 4: Inactive category styling
console.log('Test 4: Inactive category styling');
const inactiveCategory = [{
  id: 'cat-1',
  nameEs: 'Categoría Inactiva',
  icon: '📁',
  displayOrder: 1,
  isActive: false,
  children: []
}];
const inactiveResult = AdminCategories.renderCategoryTree(inactiveCategory);
const inactiveText = stripHtml(inactiveResult);
if (inactiveText.includes('Inactiva') &&
    inactiveResult.includes('opacity:0.5') &&
    inactiveResult.includes('grayscale(0.5)')) {
  console.log('✓ PASS: Inactive category has correct styling and badge\n');
} else {
  console.error('✗ FAIL: Inactive category styling incorrect\n');
  console.error('Result:', inactiveText);
  process.exit(1);
}

// Test 5: DisplayOrder sorting
console.log('Test 5: DisplayOrder sorting');
const unsortedCategories = [
  {
    id: 'cat-3',
    nameEs: 'Tercera',
    displayOrder: 3,
    isActive: true,
    children: []
  },
  {
    id: 'cat-1',
    nameEs: 'Primera',
    displayOrder: 1,
    isActive: true,
    children: []
  },
  {
    id: 'cat-2',
    nameEs: 'Segunda',
    displayOrder: 2,
    isActive: true,
    children: []
  }
];
const sortedResult = AdminCategories.renderCategoryTree(unsortedCategories);
const primeraIndex = sortedResult.indexOf('Primera');
const segundaIndex = sortedResult.indexOf('Segunda');
const terceraIndex = sortedResult.indexOf('Tercera');
if (primeraIndex < segundaIndex && segundaIndex < terceraIndex) {
  console.log('✓ PASS: Categories sorted by DisplayOrder\n');
} else {
  console.error('✗ FAIL: Categories not sorted correctly by DisplayOrder\n');
  console.error('Indices:', { primeraIndex, segundaIndex, terceraIndex });
  process.exit(1);
}

// Test 6: Alphabetical sorting when DisplayOrder is the same
console.log('Test 6: Alphabetical sorting when DisplayOrder is the same');
const alphabeticalCategories = [
  {
    id: 'cat-z',
    nameEs: 'Zebra',
    displayOrder: 1,
    isActive: true,
    children: []
  },
  {
    id: 'cat-a',
    nameEs: 'Alfa',
    displayOrder: 1,
    isActive: true,
    children: []
  },
  {
    id: 'cat-m',
    nameEs: 'Medio',
    displayOrder: 1,
    isActive: true,
    children: []
  }
];
const alphabeticalResult = AdminCategories.renderCategoryTree(alphabeticalCategories);
const alfaIndex = alphabeticalResult.indexOf('Alfa');
const medioIndex = alphabeticalResult.indexOf('Medio');
const zebraIndex = alphabeticalResult.indexOf('Zebra');
if (alfaIndex < medioIndex && medioIndex < zebraIndex) {
  console.log('✓ PASS: Categories with same DisplayOrder sorted alphabetically\n');
} else {
  console.error('✗ FAIL: Alphabetical sorting not working\n');
  console.error('Indices:', { alfaIndex, medioIndex, zebraIndex });
  process.exit(1);
}

// Test 7: Three-level hierarchy (grandchildren)
console.log('Test 7: Three-level hierarchy (grandchildren)');
const threeLevelCategories = [{
  id: 'cat-1',
  nameEs: 'Root',
  displayOrder: 1,
  isActive: true,
  children: [{
    id: 'cat-2',
    nameEs: 'Child',
    displayOrder: 1,
    isActive: true,
    children: [{
      id: 'cat-3',
      nameEs: 'Grandchild',
      displayOrder: 1,
      isActive: true,
      children: []
    }]
  }]
}];
const threeLevelResult = AdminCategories.renderCategoryTree(threeLevelCategories);
const threeLevelText = stripHtml(threeLevelResult);
if (threeLevelText.includes('Root') &&
    threeLevelText.includes('Child') &&
    threeLevelText.includes('Grandchild') &&
    threeLevelResult.includes('width:24px') && // child indentation
    threeLevelResult.includes('width:48px')) { // grandchild indentation
  console.log('✓ PASS: Three-level hierarchy rendered with correct indentation\n');
} else {
  console.error('✗ FAIL: Three-level hierarchy not rendered correctly\n');
  console.error('Result:', threeLevelText);
  process.exit(1);
}

// Test 8: Edit and Delete buttons have correct data attributes
console.log('Test 8: Edit and Delete buttons have correct data attributes');
const buttonTestCategory = [{
  id: 'test-id-123',
  nameEs: 'Test Category',
  displayOrder: 1,
  isActive: true,
  children: []
}];
const buttonResult = AdminCategories.renderCategoryTree(buttonTestCategory);
if (buttonResult.includes('data-action="edit"') &&
    buttonResult.includes('data-action="delete"') &&
    buttonResult.includes('data-category-id="test-id-123"')) {
  console.log('✓ PASS: Action buttons have correct data attributes\n');
} else {
  console.error('✗ FAIL: Action buttons missing correct data attributes\n');
  console.error('Result:', buttonResult);
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════════');
console.log('All tests passed! ✓');
console.log('═══════════════════════════════════════════════════════');
