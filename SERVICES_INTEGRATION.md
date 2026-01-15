# CoreDNA 2.0 - Services Integration Guide

## Overview

CoreDNA 2.0 now includes a complete backend infrastructure with hybrid storage, auth, error handling, and validation.

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                    React App                     │
│              (pages/ + components/)              │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
    ┌───▼───┐  ┌────▼───┐  ┌────▼───┐
    │ Auth  │  │ Hybrid │  │ Error  │
    │ Svc   │  │Storage │  │Handler │
    └───┬───┘  └────┬───┘  └────┬───┘
        │           │            │
        │      ┌────▼───┐        │
        │      │Validation│      │
        │      └────┬───┘        │
        │           │            │
        └───────────┼────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
    ┌────▼──────┐        ┌────▼───────┐
    │localStorage│        │ Supabase   │
    │(Offline)  │        │ (Backend)  │
    └───────────┘        └────────────┘
```

## Services

### 1. **Hybrid Storage Service** (`hybridStorageService.ts`)

Manages seamless sync between localStorage (offline) and Supabase (online).

#### Features
- **Offline-first:** Works without internet, queues operations
- **Auto-sync:** Syncs to Supabase when connection restored
- **Conflict resolution:** Last-write-wins strategy
- **Graceful fallback:** Uses localStorage if Supabase unavailable

#### API

```typescript
// Set user ID (after auth)
hybridStorage.setUserId(userId);

// Save/Update portfolio
const portfolio = await hybridStorage.savePortfolio(data);

// Load portfolios
const portfolios = await hybridStorage.loadPortfolios();

// Delete portfolio
await hybridStorage.deletePortfolio(portfolioId);

// Campaign operations
await hybridStorage.saveCampaign(portfolioId, campaign);
const campaigns = await hybridStorage.loadCampaigns(portfolioId);

// Lead operations
await hybridStorage.saveLead(portfolioId, lead);
const leads = await hybridStorage.loadLeads(portfolioId);

// Get sync status
const { isOnline, queuedOperations, syncing } = hybridStorage.getSyncStatus();

// Clear all data
hybridStorage.clearAll();
```

#### Usage Example
```typescript
import { hybridStorage } from './services/hybridStorageService';

// Create portfolio
const newPortfolio = await hybridStorage.savePortfolio({
    companyName: "Acme Corp",
    industry: "Tech",
    brandDNA: { /* ... */ }
});

// Monitor sync status
const unsubscribe = setInterval(() => {
    const { isOnline, queuedOperations } = hybridStorage.getSyncStatus();
    console.log(`Online: ${isOnline}, Queued: ${queuedOperations}`);
}, 1000);

// Load when needed
const portfolios = await hybridStorage.loadPortfolios();
portfolios.forEach(p => console.log(p.companyName));
```

---

### 2. **Authentication Service** (`authService.ts`)

Handles user auth with Supabase + anonymous fallback for guests.

#### Features
- **Supabase integration:** Email/password auth
- **Anonymous users:** Guest mode for trying features
- **Auth state:** Centralized user management
- **Tier system:** Free, Pro, Hunter, Agency tiers

#### API

```typescript
// Get current user
const user = authService.getCurrentUser();
// Returns: { id: string, email?: string, isAnonymous: boolean }

// Sign up
const { user, error } = await authService.signUp(email, password);

// Sign in
const { user, error } = await authService.signIn(email, password);

// Sign out
const { error } = await authService.signOut();

// Check if authenticated
if (authService.isAuthenticated()) {
    // User is logged in (not anonymous)
}

// Subscribe to auth changes
const unsubscribe = authService.onAuthChange((user) => {
    console.log('User changed:', user);
});

// Get user tier
const tier = await authService.getUserTier();
// Returns: 'free' | 'pro' | 'hunter' | 'agency'
```

#### Usage Example
```typescript
import { authService } from './services/authService';

// React component
function LoginPage() {
    const handleSignUp = async () => {
        const { user, error } = await authService.signUp(
            'user@example.com', 
            'password123'
        );
        
        if (error) {
            console.error('Signup failed:', error);
        } else {
            console.log('Welcome!', user.email);
        }
    };

    // Subscribe to auth changes
    React.useEffect(() => {
        return authService.onAuthChange((user) => {
            // Update UI when user logs in/out
            setUser(user);
        });
    }, []);

    return <button onClick={handleSignUp}>Sign Up</button>;
}
```

---

### 3. **Error Handling Service** (`errorHandlingService.ts`)

Centralized error logging, tracking, and user-friendly messages.

#### Features
- **Error logging:** Persistent error history
- **User messages:** Auto-translate errors to friendly text
- **Global handlers:** Catches uncaught exceptions
- **Critical tracking:** Persists critical errors for support

#### API

```typescript
// Log errors
errorHandler.logError(code, message, severity, context);

// Specific error types
errorHandler.logNetworkError(message, context);
errorHandler.logValidationError(message, context);
errorHandler.logSyncError(message, context);
errorHandler.logQuotaError(message, context);
errorHandler.logAuthError(message, context);
errorHandler.logAPIError(message, statusCode, context);

// Get user-friendly message
const message = errorHandler.getUserFriendlyMessage(error);

// Subscribe to errors
const unsubscribe = errorHandler.onError((error) => {
    showNotification(errorHandler.getUserFriendlyMessage(error));
});

// Get error history
const errors = errorHandler.getErrorHistory(10);

// Get critical errors (for support/debugging)
const critical = errorHandler.getCriticalErrors();

// Clear logs
errorHandler.clearErrorLog();
```

#### Severity Levels
- **info:** Informational messages
- **warning:** Non-critical issues
- **error:** Something went wrong
- **critical:** App-breaking issues (persisted)

#### Usage Example
```typescript
import { errorHandler } from './services/errorHandlingService';

async function savePortfolio(data) {
    try {
        const result = await api.createPortfolio(data);
        return result;
    } catch (e) {
        errorHandler.logAPIError('Failed to save portfolio', 500, { originalError: e });
        
        // Show user-friendly message
        showToast(errorHandler.getUserFriendlyMessage(e));
        
        // Return fallback
        return null;
    }
}

// Global error handling
errorHandler.onError((error) => {
    if (error.severity === 'critical') {
        // Show error modal
        showErrorModal(errorHandler.getUserFriendlyMessage(error));
    }
});
```

---

### 4. **Validation Service** (`validationService.ts`)

Data validation with detailed error reporting.

#### Features
- **Portfolio/campaign/lead validation:** Complete data checks
- **Email/URL/phone validation:** Specific validators
- **XSS prevention:** String sanitization
- **Detailed errors:** Field-level error messages

#### API

```typescript
// Validate portfolio
const errors = validator.validatePortfolio(data);

// Validate campaign
const errors = validator.validateCampaign(data);

// Validate lead
const errors = validator.validateLead(data);

// Validate and report (logs error + optionally throws)
const errors = validator.validateAndReport(data, 'portfolio', throwOnError);

// Specific validators
validator.isValidEmail(email);
validator.isValidUrl(url);
validator.isValidPhone(phone);
validator.isValidJSON(str);

// Sanitize user input (XSS prevention)
const safe = validator.sanitizeString(userInput);
```

#### Error Return
```typescript
interface ValidationError {
    field: string;
    message: string;
}

// Example
const errors = validator.validatePortfolio(data);
// Returns:
// [
//     { field: 'companyName', message: 'Company name is required' },
//     { field: 'brandDNA.tagline', message: 'Tagline is required' }
// ]
```

#### Usage Example
```typescript
import { validator } from './services/validationService';

function CreatePortfolioForm() {
    const [errors, setErrors] = React.useState<ValidationError[]>([]);

    const handleSubmit = async (data) => {
        // Validate before save
        const validationErrors = validator.validatePortfolio(data);
        
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        // Safe to save
        await hybridStorage.savePortfolio(data);
    };

    return (
        <form onSubmit={(e) => handleSubmit(getFormData())}>
            <input name="companyName" />
            {errors.find(e => e.field === 'companyName')?.message}
            {/* ... */}
            <button type="submit">Create</button>
        </form>
    );
}
```

---

## Integration Examples

### Example 1: Create & Save Portfolio

```typescript
import { hybridStorage } from './services/hybridStorageService';
import { validator } from './services/validationService';
import { errorHandler } from './services/errorHandlingService';

async function createPortfolio(formData) {
    try {
        // Validate
        const errors = validator.validatePortfolio(formData);
        if (errors.length > 0) {
            throw new Error(errors.map(e => e.message).join('; '));
        }

        // Save (both localStorage + Supabase)
        const portfolio = await hybridStorage.savePortfolio({
            companyName: formData.company,
            industry: formData.industry,
            brandDNA: { /* ... */ }
        });

        return portfolio;
    } catch (e) {
        errorHandler.logError('CREATE_PORTFOLIO_ERROR', (e as Error).message, 'error');
        throw e;
    }
}
```

### Example 2: Auth-Protected Create

```typescript
import { authService } from './services/authService';
import { hybridStorage } from './services/hybridStorageService';

async function protectedCreatePortfolio(data) {
    const user = authService.getCurrentUser();
    
    if (!user) {
        throw new Error('User not authenticated');
    }

    // Hybrid storage automatically uses user ID
    const portfolio = await hybridStorage.savePortfolio(data);
    
    // Portfolio is now in:
    // - localStorage (immediate)
    // - Supabase (when online)
    return portfolio;
}
```

### Example 3: Error Handling in React

```typescript
import React from 'react';
import { errorHandler } from './services/errorHandlingService';

function ErrorBoundary({ children }) {
    React.useEffect(() => {
        const unsubscribe = errorHandler.onError((error) => {
            if (error.severity === 'critical') {
                // Show modal
                alert('Critical error: ' + errorHandler.getUserFriendlyMessage(error));
            } else if (error.severity === 'error') {
                // Show toast
                console.warn(errorHandler.getUserFriendlyMessage(error));
            }
        });

        return unsubscribe;
    }, []);

    return children;
}
```

### Example 4: Offline Queue Monitoring

```typescript
function SyncStatus() {
    const [status, setStatus] = React.useState(hybridStorage.getSyncStatus());

    React.useEffect(() => {
        const interval = setInterval(() => {
            setStatus(hybridStorage.getSyncStatus());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <p>Online: {status.isOnline ? '✓' : '✗'}</p>
            <p>Queued: {status.queuedOperations}</p>
            <p>Syncing: {status.syncing ? 'Yes' : 'No'}</p>
        </div>
    );
}
```

---

## Data Flow

### Creating a Portfolio (Step-by-Step)

1. **User enters data in UI**
   ```
   Form Component
   └─ companyName, industry, brandDNA, etc.
   ```

2. **Validation**
   ```
   ValidationService.validatePortfolio()
   └─ Returns: ValidationError[] or []
   ```

3. **If valid, save**
   ```
   HybridStorageService.savePortfolio()
   ├─ Saves to localStorage (immediate)
   ├─ Queues for Supabase if offline
   └─ Syncs to Supabase if online
   ```

4. **Error handling**
   ```
   ErrorHandlingService.logError()
   └─ Logs error, notifies subscribers
   ```

### Loading Portfolios

```
User loads dashboard
├─ HybridStorageService.loadPortfolios()
│  ├─ If online: Load from Supabase, merge with localStorage
│  └─ If offline: Load from localStorage
└─ Display portfolios
```

### Offline Sync Flow

```
While offline:
├─ Operations queued in _offline_queue
└─ User sees local data

When back online:
├─ HybridStorageService detects 'online' event
├─ Processes each queued operation
├─ Syncs to Supabase
└─ Clears queue
```

---

## Database Schema

### Tables Created

```sql
-- User settings & auth
user_settings
├─ id (UUID, PK)
├─ user_id (TEXT, unique)
├─ tier (TEXT: free|pro|hunter|agency)
├─ settings (JSONB)
└─ team_id (UUID, FK)

-- Portfolio data
portfolios
├─ id (UUID, PK)
├─ user_id (TEXT, FK)
├─ company_name (TEXT)
├─ company_website (TEXT)
├─ industry (TEXT)
├─ brand_dna (JSONB)
└─ created_at, updated_at

-- Portfolio related data
campaigns
├─ id (UUID, PK)
├─ portfolio_id (UUID, FK)
├─ name, description
├─ status (draft|active|paused|completed)
└─ campaign_data (JSONB)

portfolio_leads
├─ id (UUID, PK)
├─ portfolio_id (UUID, FK)
├─ name, email, phone
├─ status (new|contacted|qualified|converted|lost)
└─ lead_data (JSONB)

portfolio_assets
├─ id (UUID, PK)
├─ portfolio_id (UUID, FK)
├─ asset_name, asset_type
├─ asset_url
└─ asset_data (JSONB)

portfolio_notes
├─ id (UUID, PK)
├─ portfolio_id (UUID, FK)
├─ note_text
├─ note_type (general|insight|todo|alert)
└─ created_at

-- Activity & sync
activity_log
├─ id (UUID, PK)
├─ user_id (TEXT)
├─ action
├─ entity_type, entity_id
├─ changes (JSONB)
└─ created_at

offline_queue
├─ id (UUID, PK)
├─ user_id (TEXT)
├─ operation (create|update|delete)
├─ table_name (TEXT)
├─ data (JSONB)
├─ status (pending|synced|failed)
└─ created_at
```

---

## Environment Variables

```env
# Required
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional
VITE_DEBUG=false
VITE_API_TIMEOUT=30000
```

---

## Testing

### Test Offline Mode
```bash
1. Open DevTools > Network tab
2. Set to "Offline"
3. Create/update portfolio
4. Check: hybridStorage.getSyncStatus()
5. Verify in localStorage
6. Go back online
7. Should auto-sync to Supabase
```

### Test Validation
```javascript
import { validator } from './services/validationService';

// Invalid email
validator.isValidEmail('not-an-email'); // false

// Valid URL
validator.isValidUrl('https://example.com'); // true

// Sanitize input
validator.sanitizeString('<script>alert("xss")</script>');
// Output: &lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;
```

### Test Error Handling
```javascript
import { errorHandler } from './services/errorHandlingService';

// Log and subscribe
errorHandler.onError((error) => {
    console.log('Error:', error);
});

errorHandler.logNetworkError('Connection timeout');

// Get history
errorHandler.getErrorHistory(10);

// Get critical errors
errorHandler.getCriticalErrors();
```

---

## Debugging

### Check Supabase Connection
```javascript
import { supabase } from './services/supabaseClient';

// Test auth
const { data } = await supabase.auth.getSession();
console.log('Session:', data);
```

### Monitor Sync Status
```javascript
import { hybridStorage } from './services/hybridStorageService';

setInterval(() => {
    console.log(hybridStorage.getSyncStatus());
}, 1000);
```

### View Error Log
```javascript
import { errorHandler } from './services/errorHandlingService';

errorHandler.getErrorHistory(20);
```

### Check Auth State
```javascript
import { authService } from './services/authService';

const user = authService.getCurrentUser();
console.log('Current user:', user);
```

---

## Migration Guide

### From localStorage-only to Hybrid

1. **Import new services:**
   ```typescript
   import { hybridStorage } from './services/hybridStorageService';
   import { authService } from './services/authService';
   import { errorHandler } from './services/errorHandlingService';
   ```

2. **Replace direct localStorage calls:**
   ```typescript
   // Old
   const portfolios = JSON.parse(localStorage.getItem('core_dna_portfolios'));

   // New
   const portfolios = await hybridStorage.loadPortfolios();
   ```

3. **Add error handling:**
   ```typescript
   // Old
   try { /* ... */ } catch (e) { console.error(e); }

   // New
   try { /* ... */ } catch (e) { 
       errorHandler.logError('MY_ERROR', e.message, 'error');
   }
   ```

4. **Add validation:**
   ```typescript
   // Old
   savePortfolio(data); // Hope it's valid

   // New
   const errors = validator.validatePortfolio(data);
   if (errors.length > 0) return; // Show errors
   savePortfolio(data);
   ```

---

## Support

For questions or issues:
1. Check browser console for error logs
2. Run `errorHandler.getCriticalErrors()` in console
3. Check Supabase SQL Editor for data
4. Review this guide's debugging section
