# 🔐 Referrer Tracker - License System Documentation

## Overview

Referrer Tracker uses a **hybrid licensing model** that provides:
- ✅ **1st-party cookies** (hosted on client's domain)
- ✅ **License validation** (controlled by your server)
- ✅ **Flexible pricing** (different plans and features)

## How It Works

```
┌─────────────────┐
│  Client Website │
│                 │
│  1. Loads       │
│     script      │
└────────┬────────┘
         │
         │ 2. Validates API key
         ▼
┌─────────────────┐
│  Your License   │
│     Server      │
│                 │
│  - Checks key   │
│  - Returns plan │
│  - Logs usage   │
└────────┬────────┘
         │
         │ 3. Enables/Disables tracking
         ▼
┌─────────────────┐
│  Tracking       │
│  Enabled ✓      │
│                 │
│  Sets cookies   │
│  Fills forms    │
└─────────────────┘
```

## API Key Configuration

### Basic Setup

```html
<script src="referrer-tracker.js"></script>
<script>
  ReferrerTracker.configure({
    apiKey: 'rt_live_abc123xyz789'
  });
</script>
```

### Advanced Configuration

```javascript
ReferrerTracker.configure({
  // License settings
  apiKey: 'rt_live_abc123xyz789',
  licenseServer: 'https://api.referrertracker.com/v1/validate',
  validateOnInit: true,
  cacheValidation: true,
  validationCacheDuration: 24 * 60 * 60 * 1000, // 24 hours
  
  // Tracking settings
  cookiePrefix: 'rt_',
  cookieExpireDays: 30,
  debug: false
});
```

## License Server API

### Endpoint

```
POST https://api.referrertracker.com/v1/validate
```

### Request

```json
{
  "apiKey": "rt_live_abc123xyz789",
  "domain": "example.com",
  "url": "https://example.com/contact",
  "userAgent": "Mozilla/5.0..."
}
```

### Response (Success)

```json
{
  "valid": true,
  "plan": "pro",
  "features": [
    "basic_tracking",
    "click_ids",
    "advanced_analytics"
  ],
  "customer": {
    "name": "Acme Corp",
    "email": "admin@acme.com"
  },
  "limits": {
    "domains": 5,
    "events": 100000
  },
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

### Response (Error)

```json
{
  "valid": false,
  "error": "invalid_key",
  "message": "API key not found or expired"
}
```

## Validation Caching

The script caches validation results in `localStorage` to minimize server requests:

- **Cache Duration**: 24 hours (configurable)
- **Cache Key**: `rt_license_cache`
- **Fallback**: If server is unreachable, uses cached validation

### Cache Structure

```json
{
  "valid": true,
  "plan": "pro",
  "features": ["basic_tracking", "click_ids"],
  "expiresAt": 1735689599000
}
```

## Error Handling

### No API Key

```javascript
// Console output:
[ReferrerTracker] ERROR: API key is required. Get your key at https://referrertracker.com
[ReferrerTracker] Tracking disabled: Invalid or missing license
```

### Invalid API Key

```javascript
// Console output:
[ReferrerTracker] ERROR: Invalid license - API key not found
[ReferrerTracker] Tracking disabled: Invalid or missing license
```

### Network Error

```javascript
// Console output:
[ReferrerTracker] ERROR: License validation failed: NetworkError
[ReferrerTracker] Using cached license due to validation error
// Tracking continues if valid cache exists
```

## Security Features

### 1. Domain Locking

API keys are locked to specific domains:

```json
{
  "apiKey": "rt_live_abc123",
  "allowedDomains": [
    "example.com",
    "www.example.com",
    "staging.example.com"
  ]
}
```

### 2. Rate Limiting

Prevent abuse with rate limits:

```json
{
  "rateLimit": {
    "requests": 100,
    "period": "1h"
  }
}
```

### 3. Usage Tracking

Track usage for billing and analytics:

```json
{
  "usage": {
    "events": 45230,
    "domains": 3,
    "lastSeen": "2025-11-04T15:30:00Z"
  }
}
```

## Pricing Plans

### Free Plan
- **Price**: $0/month
- **Features**:
  - Basic tracking (source, medium, campaign)
  - 1 domain
  - 1,000 events/month
  - Community support

### Pro Plan
- **Price**: $29/month
- **Features**:
  - All Free features
  - Click ID tracking (gclid, fbclid, etc.)
  - 5 domains
  - 50,000 events/month
  - Email support
  - Analytics dashboard

### Enterprise Plan
- **Price**: $99/month
- **Features**:
  - All Pro features
  - Unlimited domains
  - Unlimited events
  - White-label option
  - Priority support
  - Custom integrations
  - SLA guarantee

## Implementation Checklist

### For You (Service Provider)

- [ ] Set up license server API
- [ ] Create customer dashboard
- [ ] Implement API key generation
- [ ] Set up domain validation
- [ ] Configure rate limiting
- [ ] Add usage tracking
- [ ] Create billing system
- [ ] Set up email notifications

### For Customers

- [ ] Sign up at referrertracker.com
- [ ] Get API key from dashboard
- [ ] Download referrer-tracker.js
- [ ] Add script to website
- [ ] Configure API key
- [ ] Test tracking
- [ ] Add to production

## Backend Example (Node.js/Express)

```javascript
const express = require('express');
const app = express();

app.post('/v1/validate', async (req, res) => {
  const { apiKey, domain } = req.body;
  
  // 1. Find customer by API key
  const customer = await db.customers.findOne({ apiKey });
  
  if (!customer) {
    return res.json({
      valid: false,
      error: 'invalid_key',
      message: 'API key not found'
    });
  }
  
  // 2. Check if domain is allowed
  if (!customer.allowedDomains.includes(domain)) {
    return res.json({
      valid: false,
      error: 'invalid_domain',
      message: 'Domain not authorized'
    });
  }
  
  // 3. Check if subscription is active
  if (customer.subscriptionStatus !== 'active') {
    return res.json({
      valid: false,
      error: 'subscription_expired',
      message: 'Subscription expired'
    });
  }
  
  // 4. Log usage
  await db.usage.create({
    customerId: customer.id,
    domain,
    timestamp: new Date()
  });
  
  // 5. Return success
  res.json({
    valid: true,
    plan: customer.plan,
    features: customer.features,
    customer: {
      name: customer.name,
      email: customer.email
    }
  });
});

app.listen(3000);
```

## Customer Dashboard Features

### Dashboard Overview
- Active API keys
- Usage statistics
- Domain management
- Billing information

### API Key Management
- Generate new keys
- Revoke keys
- View key details
- Copy to clipboard

### Domain Management
- Add/remove domains
- View domain usage
- Test domain validation

### Usage Analytics
- Events per day/month
- Top domains
- Traffic sources
- Conversion tracking

## Support & Documentation

- **Website**: https://referrertracker.com
- **Documentation**: https://docs.referrertracker.com
- **Support**: support@referrertracker.com
- **Status**: https://status.referrertracker.com

## FAQ

### Q: Can I use the script without an API key?
**A**: No, a valid API key is required for the script to function.

### Q: What happens if my license expires?
**A**: The script will stop tracking new data, but existing cookies remain.

### Q: Can I test before buying?
**A**: Yes, we offer a 14-day free trial with full features.

### Q: Are cookies 1st-party or 3rd-party?
**A**: All cookies are 1st-party (set on your domain).

### Q: How often does the script validate the license?
**A**: Once every 24 hours (cached in localStorage).

### Q: What if the license server is down?
**A**: The script uses cached validation for up to 24 hours.

### Q: Can I white-label the script?
**A**: Yes, available on Enterprise plan.

### Q: Is the source code available?
**A**: The minified script is provided. Source code available on request for Enterprise customers.
