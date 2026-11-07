# Beehiiv Newsletter Setup Guide

Complete guide to integrating Beehiiv newsletter subscriptions into your MCP directory.

## 🎯 What's Included

- Newsletter signup component on homepage
- Newsletter signup on blog pages
- Beautiful UI with animated icon
- Beehiiv API integration
- Error handling for duplicate emails
- Welcome email automation
- UTM tracking for analytics

## 📋 Prerequisites

- Beehiiv account (free or paid plan)
- Access to Beehiiv API credentials
- Your publication already created on Beehiiv

## 🔑 Getting Your API Credentials

### Step 1: Get Your Publication ID

1. Log in to your Beehiiv dashboard at https://app.beehiiv.com
2. Go to **Settings** → **General**
3. Find your **Publication ID** (looks like: `pub_abc123def456`)
4. Copy this ID

### Step 2: Generate API Key

1. In Beehiiv dashboard, go to **Settings** → **Integrations**
2. Scroll to **API** section
3. Click **Generate New API Key**
4. Name it something like "Website Integration"
5. Copy the API key (starts with `bh_`)
6. **Important**: Save this key somewhere safe - you can't view it again!

## ⚙️ Environment Setup

### Option 1: Local Development (.env.local)

Create or update `.env.local` in your project root:

```bash
# Beehiiv Newsletter Integration
BEEHIIV_API_KEY=bh_your_api_key_here
BEEHIIV_PUBLICATION_ID=pub_your_publication_id_here
```

### Option 2: Production (Vercel/Netlify/Railway)

Add environment variables to your deployment platform:

**Vercel:**
1. Go to your project → Settings → Environment Variables
2. Add:
   - Key: `BEEHIIV_API_KEY`, Value: `bh_your_api_key`
   - Key: `BEEHIIV_PUBLICATION_ID`, Value: `pub_your_publication_id`

**Netlify:**
1. Site settings → Environment variables
2. Add the same two variables

**Railway:**
1. Project → Variables
2. Add the same two variables

## 🧪 Testing the Integration

### Local Testing

1. Start your dev server:
```bash
npm run dev
```

2. Navigate to http://localhost:4321

3. Scroll to the newsletter signup section

4. Enter a test email and click **Subscribe**

5. Check for success message: "✓ Successfully subscribed! Check your email."

6. Verify in Beehiiv dashboard:
   - Go to **Audience** → **Subscribers**
   - Your test email should appear

### Test Different Scenarios

**Valid email:**
```
test@example.com → Should succeed
```

**Duplicate email:**
```
Same email again → "This email is already subscribed"
```

**Invalid email:**
```
notanemail → "Valid email is required"
```

## 📊 Tracking & Analytics

The integration includes UTM parameters for tracking:

- **utm_source**: `mymcpshelf.com`
- **utm_medium**: `website`
- **utm_campaign**: `newsletter_signup`

View these in Beehiiv dashboard:
1. Go to **Analytics** → **Subscribers**
2. Filter by source/medium/campaign

## 🎨 Customization

### Update Newsletter Copy

Edit `src/components/EmailSignup.astro`:

```astro
<h3>Your Custom Heading</h3>
<p>Your custom description text...</p>
```

### Change Icon

Replace the mailbox emoji:

```astro
<div class="newsletter-icon">🚀</div>  <!-- Your preferred emoji -->
```

### Adjust Colors

Update gradient in `EmailSignup.astro`:

```css
.email-signup {
    background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}
```

### Modify Button Text

In the `<script>` section:

```javascript
button.textContent = 'Your Custom CTA';
```

## 🚀 Features

### Welcome Email

Beehiiv automatically sends a welcome email when `send_welcome_email: true` is set.

To customize:
1. Go to **Settings** → **Email Settings**
2. Edit **Welcome Email** template
3. Add your branding and content

### Double Opt-In (Optional)

Enable double opt-in in Beehiiv:
1. **Settings** → **Subscription Settings**
2. Toggle **Require Confirmation**
3. Customize confirmation email

### Subscription Sources

Track where subscribers come from:
1. **Analytics** → **Growth**
2. View breakdown by source

## 📍 Where Newsletter Appears

The newsletter signup is displayed on:

- ✅ **Homepage** - After server stats section
- ✅ **Blog Listing Page** - After blog posts
- ✅ **Individual Blog Posts** - After article content

### Add to More Pages

To add newsletter signup to another page:

1. Import the component:
```astro
---
import EmailSignup from '../components/EmailSignup.astro';
---
```

2. Add to page body:
```astro
<EmailSignup />
```

## 🐛 Troubleshooting

### "Email service not configured" Error

**Problem**: Missing environment variables

**Solution**:
- Verify `.env.local` exists with correct credentials
- Restart dev server after adding env vars
- Check env vars are set in production deployment

### "Failed to subscribe" Error

**Problem**: Invalid API credentials

**Solution**:
- Double-check API key in Beehiiv dashboard
- Ensure API key starts with `bh_`
- Verify publication ID starts with `pub_`
- Regenerate API key if needed

### Form Doesn't Submit

**Problem**: JavaScript not loading

**Solution**:
- Check browser console for errors
- Verify script tag is present
- Clear browser cache

### Duplicate Email Not Handled

**Problem**: Error message not showing

**Solution**:
- Check Beehiiv API response in browser console
- Verify error handling in `subscribe.ts`
- Update status code check if needed

### Emails Not Appearing in Beehiiv

**Problem**: API calls succeeding but subscribers not visible

**Solution**:
- Check **Audience** → **Unconfirmed** if double opt-in enabled
- Look in **Unsubscribed** tab
- Verify correct publication ID

## 📈 Advanced Configuration

### Reactivate Existing Subscribers

Change in `subscribe.ts`:

```typescript
reactivate_existing: true,  // Resubscribe previous subscribers
```

### Add Custom Fields

Extend the API call in `subscribe.ts`:

```typescript
body: JSON.stringify({
  email,
  custom_fields: {
    source_page: 'homepage',
    user_type: 'developer'
  },
  // ... other fields
}),
```

First, create custom fields in Beehiiv:
1. **Settings** → **Custom Fields**
2. Add your fields
3. Use exact field names in API call

### Webhook Integration

Set up webhooks for real-time updates:

1. **Settings** → **Integrations** → **Webhooks**
2. Add webhook URL
3. Select events (subscriber.created, etc.)
4. Create handler endpoint in your app

## 📚 API Reference

### Beehiiv Subscription Endpoint

```
POST https://api.beehiiv.com/v2/publications/{publication_id}/subscriptions
```

**Headers:**
```json
{
  "Authorization": "Bearer {api_key}",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "email": "user@example.com",
  "reactivate_existing": false,
  "send_welcome_email": true,
  "utm_source": "string",
  "utm_medium": "string",
  "utm_campaign": "string",
  "referring_site": "string",
  "custom_fields": {}
}
```

**Success Response (201):**
```json
{
  "data": {
    "id": "sub_123abc",
    "email": "user@example.com",
    "status": "active",
    "created": 1699999999
  }
}
```

**Error Response (400):**
```json
{
  "errors": [
    {
      "message": "Email already exists"
    }
  ]
}
```

## 🔗 Resources

- [Beehiiv API Docs](https://developers.beehiiv.com/)
- [Beehiiv Dashboard](https://app.beehiiv.com)
- [Beehiiv Support](https://support.beehiiv.com)

## ✅ Post-Setup Checklist

- [ ] Added API key and publication ID to environment variables
- [ ] Tested subscription with valid email
- [ ] Verified subscriber appears in Beehiiv dashboard
- [ ] Tested duplicate email handling
- [ ] Customized welcome email in Beehiiv
- [ ] Set up UTM tracking in analytics
- [ ] Added newsletter to desired pages
- [ ] Tested on mobile devices
- [ ] Deployed to production with env vars
- [ ] Verified production subscriptions work

---

**Setup Complete!** 🎉

Your newsletter is now live and collecting subscribers through Beehiiv!
