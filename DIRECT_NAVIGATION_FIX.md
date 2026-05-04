# Direct Navigation Fix for /account and /checkout

## Problem
Direct navigation to `/account` and `/checkout` URLs was not working, while clicking navbar links worked fine.

## Root Cause
The issue was a timing problem where the router's `DOMContentLoaded` event was firing before the `checkout.js` and `account.js` scripts had fully exposed their initialization functions (`window._initCheckoutPage` and `window._initAccountPage`).

## Solution

### 1. Added Initial Render Delay (router.js)
```javascript
document.addEventListener('DOMContentLoaded', function () {
    // Small delay to ensure all scripts are fully loaded
    setTimeout(function() {
        _render(_matchRoute(window.location.pathname));
    }, 50);
});
```

This 50ms delay ensures that all scripts have finished loading and exposing their functions before the router attempts to render.

### 2. Improved Retry Logic (router.js)
Changed from a single retry with `setTimeout` to a proper interval-based retry mechanism:

```javascript
function _initCheckout() {
    if (typeof window._initCheckoutPage === 'function') {
        window._initCheckoutPage();
    } else {
        console.warn('Checkout init function not found. Retrying...');
        let attempts = 0;
        const maxAttempts = 5;
        const retryInterval = setInterval(function() {
            attempts++;
            if (typeof window._initCheckoutPage === 'function') {
                clearInterval(retryInterval);
                window._initCheckoutPage();
                console.log('Checkout init function found after ' + attempts + ' attempts');
            } else if (attempts >= maxAttempts) {
                clearInterval(retryInterval);
                console.error('Checkout init function still not found after ' + maxAttempts + ' attempts');
            }
        }, 100);
    }
}
```

The same pattern was applied to `_initAccount()`.

### 3. Added Comprehensive Logging (router.js)
Added detailed console logging to help debug routing issues:

- Logs which pathname is being matched
- Logs whether an exact match or pattern match was found
- Logs which template is being rendered
- Logs whether the init function is being called
- Logs errors if templates or elements are not found

## Testing

To test the fix:

1. **Direct navigation to /account:**
   - Open browser
   - Navigate directly to `http://localhost:5205/account`
   - Should see the account page load correctly
   - Check browser console for router logs

2. **Direct navigation to /checkout:**
   - Open browser
   - Navigate directly to `http://localhost:5205/checkout`
   - Should see the checkout page load correctly
   - Check browser console for router logs

3. **Navbar navigation (should still work):**
   - Start at home page
   - Click "Mi Perfil" in navbar
   - Should navigate to /account without page reload
   - Click cart and "Proceed to checkout"
   - Should navigate to /checkout without page reload

## Console Output

When navigating directly to `/account`, you should see:
```
Router: Matching route for pathname: /account
Router: Found exact match: /account
Router: Rendering route: /account with template: tpl-account
Router: Calling init function for route: /account
```

If the init function is not immediately available, you'll see:
```
Account init function not found. Retrying...
Account init function found after 1 attempts
```

## Files Modified

1. `assets/js/router.js` - Added delay, improved retry logic, added logging
2. No changes to `index.html`, `checkout.js`, or `account.js` were needed

## Why This Works

The fix addresses the race condition between:
- The router's `DOMContentLoaded` event firing
- The `checkout.js` and `account.js` scripts exposing their init functions

By adding a small delay and implementing a robust retry mechanism, we ensure that:
1. Scripts have time to load and expose their functions
2. If a function isn't available immediately, we retry up to 5 times
3. We have visibility into what's happening via console logs

## Fallback Behavior

If after 5 retry attempts (500ms total) the init function is still not found:
- An error is logged to the console
- The page template is still rendered (so the user sees something)
- The page may not be fully functional (no event handlers attached)

This is better than a blank page or infinite loading state.
