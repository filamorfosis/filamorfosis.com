# Quick Test: Direct Navigation to /account and /checkout

## Prerequisites
- Backend API running on `http://localhost:5205`
- Frontend served (either via backend or separate server)
- Browser with developer console open (F12)

## Test 1: Direct Navigation to /account

1. **Open a new browser tab**
2. **Navigate directly to:** `http://localhost:5205/account`
3. **Expected result:**
   - Account page loads with profile, addresses, and orders tabs
   - Animated canvas background is visible
   - Console shows router logs:
     ```
     Router: Matching route for pathname: /account
     Router: Found exact match: /account
     Router: Rendering route: /account with template: tpl-account
     Router: Calling init function for route: /account
     ```
   - If not logged in, login modal appears
   - If logged in, profile data loads

## Test 2: Direct Navigation to /checkout

1. **Add items to cart first** (navigate to `/tienda` and add products)
2. **Open a new browser tab**
3. **Navigate directly to:** `http://localhost:5205/checkout`
4. **Expected result:**
   - Checkout page loads with order summary and address form
   - Progress indicator shows "Carrito → Envío → Pago"
   - Cart items are displayed
   - Console shows router logs:
     ```
     Router: Matching route for pathname: /checkout
     Router: Found exact match: /checkout
     Router: Rendering route: /checkout with template: tpl-checkout
     Router: Calling init function for route: /checkout
     ```

## Test 3: Navbar Navigation (Regression Test)

1. **Start at home page:** `http://localhost:5205/`
2. **Click "Mi Perfil" in navbar**
3. **Expected result:**
   - Navigates to `/account` without page reload
   - URL changes to `/account`
   - Account page loads correctly
4. **Click cart icon and "Proceed to checkout"**
5. **Expected result:**
   - Navigates to `/checkout` without page reload
   - URL changes to `/checkout`
   - Checkout page loads correctly

## Test 4: Browser Back/Forward

1. **Navigate:** Home → Tienda → Account → Checkout
2. **Click browser back button 3 times**
3. **Expected result:**
   - Each back click loads the previous page correctly
   - No page reloads (SPA behavior)
   - Console shows router logs for each navigation
4. **Click browser forward button 3 times**
5. **Expected result:**
   - Each forward click loads the next page correctly
   - No page reloads (SPA behavior)

## Test 5: Refresh on /account or /checkout

1. **Navigate to:** `http://localhost:5205/account`
2. **Press F5 or Ctrl+R to refresh**
3. **Expected result:**
   - Page reloads and account page displays correctly
   - No 404 error
   - Router logs show correct route matching
4. **Repeat for:** `http://localhost:5205/checkout`

## Troubleshooting

### If /account or /checkout shows a blank page:

1. **Check console for errors:**
   - Look for "Template not found" errors
   - Look for "init function not found" errors
   - Look for API errors (401, 404, 500)

2. **Check network tab:**
   - Verify all JS files loaded successfully
   - Check for 404s on script files

3. **Check router logs:**
   - Should see "Router: Matching route for pathname: /account"
   - Should see "Router: Found exact match: /account"
   - Should see "Router: Rendering route: /account with template: tpl-account"

### If init function is not found:

- Console should show retry attempts:
  ```
  Account init function not found. Retrying...
  Account init function found after 1 attempts
  ```
- If it shows "still not found after 5 attempts", the script didn't load

### If you see "Template not found":

- Check that `<template id="tpl-account">` exists in `index.html`
- Check that `<template id="tpl-checkout">` exists in `index.html`

## Success Criteria

✅ Direct navigation to `/account` works  
✅ Direct navigation to `/checkout` works  
✅ Navbar navigation still works (no regression)  
✅ Browser back/forward works  
✅ Page refresh on `/account` or `/checkout` works  
✅ Console shows clear router logs  
✅ No JavaScript errors in console  

## Notes

- The 50ms delay on initial render is intentional to allow scripts to load
- The retry mechanism (up to 5 attempts) handles edge cases where scripts load slowly
- Console logs can be removed in production by removing the `console.log()` statements from `router.js`
