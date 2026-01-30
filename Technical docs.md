# Technical Architecture Documentation

This document provides an in-depth look at the technical decisions, architecture patterns, and implementation details of the TikTok Ads Creative Flow application.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [State Management](#state-management)
3. [OAuth Implementation](#oauth-implementation)
4. [Error Handling Strategy](#error-handling-strategy)
5. [Form Validation](#form-validation)
6. [API Integration](#api-integration)
7. [TypeScript Type Safety](#typescript-type-safety)
8. [Performance Considerations](#performance-considerations)
9. [Security Considerations](#security-considerations)
10. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **Routing**: React Router 6
- **State Management**: React Context API + Hooks
- **HTTP Client**: Native Fetch API

### Design Patterns

1. **Component Composition**: Breaking UI into small, reusable components
2. **Container/Presentational Pattern**: Separating logic from presentation
3. **Custom Hooks**: Encapsulating stateful logic
4. **Context Provider Pattern**: Global state management for auth
5. **Error Boundary Pattern**: Graceful error handling

### Directory Structure Philosophy

```
src/
├── components/     # Pure UI components (presentational)
├── pages/          # Route-level components (container)
├── contexts/       # Global state providers
├── services/       # Business logic and API calls
├── types/          # TypeScript definitions
└── utils/          # Pure utility functions
```

**Rationale**:
- **Separation of Concerns**: UI logic separated from business logic
- **Reusability**: Components are self-contained and reusable
- **Testability**: Services can be tested independently
- **Maintainability**: Clear organization makes codebase easy to navigate

---

## State Management

### Why Context API Instead of Redux?

For this application, React Context API is sufficient because:

1. **Simple State**: Only auth state needs to be global
2. **No Complex Updates**: State mutations are straightforward
3. **Performance**: No performance issues with current scope
4. **Bundle Size**: Avoiding extra dependencies

### AuthContext Implementation

```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  tokens: OAuthTokens | null;
  user: TikTokUser | null;
  loading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  handleCallback: (code: string, state: string) => Promise<void>;
}
```

**Key Features**:
- Centralized auth state
- Automatic token validation on mount
- Persistent storage with expiration checking
- Clean API for auth operations

### Local State Management

Form state is managed locally in `AdCreationForm` component using `useState`:

```typescript
const [formData, setFormData] = useState<AdFormData>({
  campaignName: '',
  objective: 'TRAFFIC',
  // ...
});
```

**Rationale**:
- Form state doesn't need to be global
- Easier to reset on successful submission
- Better performance (no unnecessary re-renders)

---

## OAuth Implementation

### Authorization Code Flow

We implement the standard OAuth 2.0 Authorization Code flow:

```
1. User clicks "Connect"
   ↓
2. App generates random state (CSRF protection)
   ↓
3. Redirect to TikTok with: app_id, scopes, redirect_uri, state
   ↓
4. User grants permissions on TikTok
   ↓
5. TikTok redirects to: redirect_uri?code=XXX&state=XXX
   ↓
6. App validates state matches
   ↓
7. Exchange code for access_token
   ↓
8. Store tokens with expiration timestamp
   ↓
9. Fetch user info and update UI
```

### CSRF Protection

```typescript
function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => 
    byte.toString(16).padStart(2, '0')
  ).join('');
}
```

**Why This Matters**:
- Prevents CSRF attacks where malicious sites could trick users
- Uses cryptographically secure random values
- Validated on callback to ensure request originated from our app

### Token Storage

```typescript
export function storeTokens(tokens: OAuthTokens): void {
  try {
    localStorage.setItem('tiktok_tokens', JSON.stringify(tokens));
  } catch (error) {
    console.error('Error storing tokens:', error);
  }
}
```

**Current Implementation**:
- Tokens stored in localStorage
- Includes expiration timestamp
- Validated on app mount

**Production Improvement**:
- Use httpOnly cookies (set by backend)
- Never store tokens in localStorage in production
- Implement refresh token rotation

### Token Expiration Handling

```typescript
export function isTokenValid(tokens: OAuthTokens | null): boolean {
  if (!tokens) return false;
  
  const expirationTime = tokens.timestamp + tokens.expires_in * 1000;
  const now = Date.now();
  
  // 5-minute buffer before expiration
  const bufferTime = 5 * 60 * 1000;
  return now < expirationTime - bufferTime;
}
```

**Benefits**:
- Proactive expiration checking
- 5-minute buffer prevents mid-request expiration
- Automatic re-authentication trigger

---

## Error Handling Strategy

### Three-Layer Error Handling

1. **API Layer**: Catches network and API errors
2. **Service Layer**: Transforms errors to user-friendly format
3. **Component Layer**: Displays errors appropriately

### Error Type Hierarchy

```typescript
type ErrorType =
  | 'OAUTH_INVALID_CREDENTIALS'
  | 'OAUTH_MISSING_PERMISSIONS'
  | 'OAUTH_EXPIRED_TOKEN'
  | 'OAUTH_GEO_RESTRICTION'
  | 'MUSIC_INVALID_ID'
  | 'MUSIC_NOT_AVAILABLE'
  | 'NETWORK_ERROR'
  | 'RATE_LIMIT'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';
```

### Error Mapping

The `mapApiErrorToUserError()` function transforms raw API errors:

```typescript
// Raw API error
{
  "code": 40104,
  "message": "access_token_expired"
}

// Mapped user-friendly error
{
  type: 'OAUTH_EXPIRED_TOKEN',
  title: 'Session Expired',
  message: 'Your TikTok session has expired. Please reconnect...',
  action: 'Reconnect Account',
  canRetry: true
}
```

**Benefits**:
- No raw API errors exposed to users
- Consistent error UI across the app
- Actionable guidance for users
- Retry logic for transient errors

### Field-Level vs System-Level Errors

**Field-Level Errors**:
- Displayed inline below the field
- Immediate feedback as user types
- Cleared when user makes corrections

**System-Level Errors**:
- Displayed in global error banner
- Used for API failures, auth issues
- Includes retry button when appropriate

---

## Form Validation

### Two-Stage Validation

1. **Client-Side Validation**:
   - Immediate feedback
   - Prevents unnecessary API calls
   - Better UX

2. **Server-Side Validation** (simulated):
   - Security against malicious submissions
   - Validates business rules (e.g., music ID exists)
   - Final authority on data validity

### Validation Rules

```typescript
export const VALIDATION_RULES = {
  campaignName: {
    minLength: 3,
    maxLength: 100,
  },
  adText: {
    maxLength: 100,
  },
  musicId: {
    pattern: /^[0-9]{10,20}$/,
  },
};
```

### Conditional Validation

The music selection has complex conditional rules:

```typescript
// Rule: Music required for CONVERSIONS, optional for TRAFFIC
if (formData.objective === 'CONVERSIONS' && 
    formData.musicOption === 'none') {
  errors.musicOption = 'Music is required for Conversions campaigns';
}
```

**Implementation Details**:
- Validation runs on form submission
- Also runs when objective changes
- UI prevents invalid selections (disabled radio button)

### Debounced Validation

For music ID validation, we debounce API calls:

```typescript
useEffect(() => {
  if (musicOption === 'existing' && musicId && tokens) {
    const timer = setTimeout(() => {
      handleValidateMusicId();
    }, 500); // Wait 500ms after user stops typing
    
    return () => clearTimeout(timer);
  }
}, [musicId, musicOption]);
```

**Benefits**:
- Reduces API calls (important for rate limits)
- Better UX (doesn't validate while user is still typing)
- Resource efficient

---

## API Integration

### API Client Architecture

```typescript
async function apiRequest<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Access-Token': accessToken,
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const response = await fetch(url, { ...options, headers });
  const data = await response.json();
  
  // TikTok API returns errors with code !== 0
  if (data.code !== 0) {
    throw createApiError(data);
  }
  
  return data.data;
}
```

### Mock vs Real API Mode

The app supports two modes via `VITE_API_MODE`:

**Mock Mode**:
```typescript
if (API_MODE === 'mock') {
  return mockValidateMusicId(musicId);
}
```

- Used for development and demo
- No actual API calls
- Simulates delays and errors
- Predictable responses for testing

**Real Mode**:
- Actual TikTok API calls
- Subject to rate limits
- Requires valid credentials
- Real error responses

### Error Response Handling

TikTok API error format:
```json
{
  "code": 40104,
  "message": "Access token expired",
  "data": {
    "error_code": 40104,
    "description": "The access token has expired"
  }
}
```

Our handling:
```typescript
if (data.code !== 0) {
  const error: ApiError = {
    code: data.code?.toString(),
    message: data.message,
    data: data.data,
  };
  throw error;
}
```

---

## TypeScript Type Safety

### Strict Type Checking

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Discriminated Unions

```typescript
type MusicOption = 'existing' | 'upload' | 'none';
type CampaignObjective = 'TRAFFIC' | 'CONVERSIONS';
```

**Benefits**:
- Autocomplete in IDE
- Compile-time checks prevent typos
- Exhaustive switch statements

### Type Guards

```typescript
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}
```

**Usage**:
- Safe error handling
- TypeScript knows the shape after guard
- Runtime safety

---

## Performance Considerations

### Code Splitting

```typescript
// Potential improvement (not implemented)
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
```

Current bundle size is small enough that code splitting isn't necessary, but this would be the approach for larger apps.

### Debouncing

- Music ID validation debounced (500ms)
- Prevents excessive API calls
- Better UX (no flickering validation states)

### Memoization Opportunities

For future optimization:

```typescript
const validationErrors = useMemo(
  () => validateAdForm(formData),
  [formData]
);
```

### Image Optimization

- No heavy images in current implementation
- SVG icons for scalability and performance
- TikTok logo as inline SVG

---

## Security Considerations

### Current Implementation

✅ **CSRF Protection**: Random state parameter in OAuth flow
✅ **Input Validation**: All user inputs validated
✅ **XSS Prevention**: React auto-escapes rendered content
✅ **Type Safety**: TypeScript prevents many runtime errors

### Known Security Issues (For Assignment Only)

⚠️ **App Secret in Client**: The app secret is currently in the client code
- **Impact**: Anyone can see the secret in network requests or code
- **Fix**: Move token exchange to backend API
- **Why It's Here**: Assignment requires client-only implementation

⚠️ **Token Storage in localStorage**: Tokens are stored in localStorage
- **Impact**: Vulnerable to XSS attacks
- **Fix**: Use httpOnly cookies set by backend
- **Why It's Here**: No backend in assignment scope

### Production Security Checklist

- [ ] Move OAuth token exchange to backend
- [ ] Use httpOnly cookies for token storage
- [ ] Implement CSRF tokens for all mutations
- [ ] Add Content Security Policy headers
- [ ] Use HTTPS only (no HTTP)
- [ ] Implement rate limiting
- [ ] Add request signing/HMAC verification
- [ ] Sanitize all user inputs on backend
- [ ] Implement audit logging
- [ ] Add monitoring and alerts

---

## Testing Strategy

### What Should Be Tested

1. **Unit Tests**:
   - Validation functions
   - Error mapping utility
   - OAuth state generation
   - Token expiration checking

2. **Integration Tests**:
   - Form submission flow
   - OAuth callback handling
   - API error scenarios
   - Conditional validation logic

3. **E2E Tests**:
   - Complete user flow from auth to ad creation
   - Error recovery scenarios
   - Different objective/music combinations

### Example Test Cases

```typescript
describe('validateAdForm', () => {
  it('should return error for empty campaign name', () => {
    const formData = { campaignName: '', /* ... */ };
    const errors = validateAdForm(formData);
    expect(errors.campaignName).toBe('Campaign name is required');
  });
  
  it('should allow no music for TRAFFIC objective', () => {
    const formData = { 
      objective: 'TRAFFIC',
      musicOption: 'none',
      /* ... */
    };
    const errors = validateAdForm(formData);
    expect(errors.musicOption).toBeUndefined();
  });
  
  it('should reject no music for CONVERSIONS objective', () => {
    const formData = { 
      objective: 'CONVERSIONS',
      musicOption: 'none',
      /* ... */
    };
    const errors = validateAdForm(formData);
    expect(errors.musicOption).toBeDefined();
  });
});
```

### Testing Libraries (Not Installed)

For a production app, add:
- **Vitest**: Unit testing framework
- **React Testing Library**: Component testing
- **MSW**: API mocking
- **Playwright**: E2E testing

---

## Conclusion

This architecture balances:
- **Simplicity**: Easy to understand and maintain
- **Correctness**: Type-safe with comprehensive error handling
- **User Experience**: Fast, responsive, with clear feedback
- **Real-World Readiness**: Demonstrates production patterns

The code is structured to be easily extended with additional features like campaign budgeting, audience targeting, or advanced analytics.