/**
 * Unit tests for AdminCategories.deleteCategory()
 * Tests the category deletion functionality including confirmation and error handling
 */

// Mock the window object and required functions
global.window = {
  confirm: () => true // Default to confirming deletion
};

// Mock adminApi
global.adminApi = {
  adminDeleteCategory: async (id) => {
    // Default mock - can be overridden in tests
    return null;
  },
  adminGetCategories: async () => {
    // Mock for loadCategories
    return [];
  }
};

// Mock toast function
global.toast = (message, success = true) => {
  global.lastToastMessage = message;
  global.lastToastSuccess = success;
};

// Mock document object for renderCategoryTreeInPanel
global.document = {
  getElementById: () => null
};

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

console.log('Running AdminCategories.deleteCategory() tests...\n');

// Helper to reset state between tests
function resetState() {
  global.lastToastMessage = null;
  global.lastToastSuccess = null;
  global.window.confirm = () => true;
}

// Test 1: User cancels deletion
console.log('Test 1: User cancels deletion');
resetState();
global.window.confirm = () => false;
let apiCalled = false;
global.adminApi.adminDeleteCategory = async () => {
  apiCalled = true;
  return null;
};

(async () => {
  await AdminCategories.deleteCategory('test-id');
  
  if (!apiCalled && !global.lastToastMessage) {
    console.log('✓ PASS: Deletion cancelled, no API call made\n');
  } else {
    console.error('✗ FAIL: API should not be called when user cancels\n');
    process.exit(1);
  }

  // Test 2: Successful deletion
  console.log('Test 2: Successful deletion');
  resetState();
  
  // Track if loadCategories was called by checking console output
  let consoleLogCalled = false;
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    if (args[0] && args[0].includes('Product categories loaded')) {
      consoleLogCalled = true;
    }
    originalConsoleLog(...args);
  };
  
  global.adminApi.adminDeleteCategory = async (id) => {
    if (id !== 'test-id-success') throw new Error('Wrong ID');
    return null;
  };
  
  await AdminCategories.deleteCategory('test-id-success');
  
  // Restore console.log
  console.log = originalConsoleLog;
  
  if (global.lastToastMessage === 'Categoría eliminada correctamente' &&
      global.lastToastSuccess === true &&
      consoleLogCalled) {
    console.log('✓ PASS: Successful deletion shows success message and refreshes tree\n');
  } else {
    console.error('✗ FAIL: Successful deletion not handled correctly\n');
    console.error('Toast:', global.lastToastMessage, global.lastToastSuccess);
    console.error('Load called:', consoleLogCalled);
    process.exit(1);
  }

  // Test 3: Category has children (409 error)
  console.log('Test 3: Category has children (409 error)');
  resetState();
  
  global.adminApi.adminDeleteCategory = async () => {
    const error = new Error('Conflict');
    error.status = 409;
    error.detail = 'Category has children';
    throw error;
  };
  
  await AdminCategories.deleteCategory('test-id-with-children');
  
  if (global.lastToastMessage === 'No se puede eliminar: la categoría tiene subcategorías' &&
      global.lastToastSuccess === false) {
    console.log('✓ PASS: 409 error shows correct user-friendly message\n');
  } else {
    console.error('✗ FAIL: 409 error not handled correctly\n');
    console.error('Toast:', global.lastToastMessage, global.lastToastSuccess);
    process.exit(1);
  }

  // Test 4: Category not found (404 error)
  console.log('Test 4: Category not found (404 error)');
  resetState();
  
  global.adminApi.adminDeleteCategory = async () => {
    const error = new Error('Not Found');
    error.status = 404;
    error.detail = 'Category not found';
    throw error;
  };
  
  await AdminCategories.deleteCategory('non-existent-id');
  
  if (global.lastToastMessage === 'Categoría no encontrada' &&
      global.lastToastSuccess === false) {
    console.log('✓ PASS: 404 error shows correct message\n');
  } else {
    console.error('✗ FAIL: 404 error not handled correctly\n');
    console.error('Toast:', global.lastToastMessage, global.lastToastSuccess);
    process.exit(1);
  }

  // Test 5: Generic error
  console.log('Test 5: Generic error');
  resetState();
  
  global.adminApi.adminDeleteCategory = async () => {
    const error = new Error('Server Error');
    error.status = 500;
    error.detail = 'Internal server error';
    throw error;
  };
  
  await AdminCategories.deleteCategory('test-id-error');
  
  if (global.lastToastMessage === 'Internal server error' &&
      global.lastToastSuccess === false) {
    console.log('✓ PASS: Generic error shows error detail\n');
  } else {
    console.error('✗ FAIL: Generic error not handled correctly\n');
    console.error('Toast:', global.lastToastMessage, global.lastToastSuccess);
    process.exit(1);
  }

  // Test 6: Error without detail
  console.log('Test 6: Error without detail');
  resetState();
  
  global.adminApi.adminDeleteCategory = async () => {
    const error = new Error('Unknown Error');
    error.status = 500;
    throw error;
  };
  
  await AdminCategories.deleteCategory('test-id-no-detail');
  
  if (global.lastToastMessage === 'Error al eliminar la categoría' &&
      global.lastToastSuccess === false) {
    console.log('✓ PASS: Error without detail shows fallback message\n');
  } else {
    console.error('✗ FAIL: Error without detail not handled correctly\n');
    console.error('Toast:', global.lastToastMessage, global.lastToastSuccess);
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('All tests passed! ✓');
  console.log('═══════════════════════════════════════════════════════');
})();
