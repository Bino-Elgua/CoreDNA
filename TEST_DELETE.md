# Delete Functionality Test Guide

## Steps to Test Portfolio Deletion

1. **Open Developer Console** (F12 → Console tab)

2. **Create a test portfolio**
   - Navigate to `/extract`
   - Enter a brand name and extract
   - Wait for completion
   - Dashboard should show new portfolio

3. **Verify it saved**
   ```javascript
   // Paste in console:
   JSON.parse(localStorage.getItem('core_dna_portfolios')).length
   // Should show count > 0
   ```

4. **Click delete button** (trash icon on portfolio card)
   - Confirm the dialog
   - **Check console for logs:**
     - Should see `[portfolioService] Deleting portfolio: portfolio_XXXX`
     - Should see `[Dashboard] Attempting to delete portfolio:`
     - Should see `[Dashboard] Delete result: true`

5. **Verify localStorage**
   ```javascript
   // Paste in console:
   JSON.parse(localStorage.getItem('core_dna_portfolios')).length
   // Should be 1 less than before
   ```

6. **Check UI**
   - Card should disappear from dashboard
   - If it doesn't, page may need refresh

## If Delete Still Doesn't Work

Check these in console:

```javascript
// 1. See all portfolios
const portfolios = JSON.parse(localStorage.getItem('core_dna_portfolios'));
portfolios.map(p => ({ id: p.id, name: p.companyName }))

// 2. Manually delete one
const testId = portfolios[0].id;
const filtered = portfolios.filter(p => p.id !== testId);
localStorage.setItem('core_dna_portfolios', JSON.stringify(filtered));

// 3. Verify
JSON.parse(localStorage.getItem('core_dna_portfolios')).length
```

## Expected Behavior

- Delete removes portfolio from localStorage immediately
- Dashboard state updates and card disappears
- No page reload needed
- Console shows success logs
