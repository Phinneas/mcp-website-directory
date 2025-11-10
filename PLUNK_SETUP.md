# Plunk Email Integration Setup

This project uses [Plunk](https://useplunk.com/) for email newsletter subscriptions.

## Setup Instructions

### 1. Create a Plunk Account

1. Go to [https://useplunk.com/](https://useplunk.com/)
2. Sign up for a free account (3,000 emails/month free)
3. Verify your email address

### 2. Get Your API Key

1. Log in to your Plunk dashboard
2. Navigate to **Settings** → **API Keys**
3. Copy your **Secret API Key**

### 3. Add API Key to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `PLUNK_API_KEY`
   - **Value**: Your Plunk secret API key (starts with `sk_`)
   - **Environments**: Select Production, Preview, and Development
4. Click **Save**

### 4. Redeploy

After adding the environment variable, trigger a new deployment:
- Push a new commit to your repository, or
- Go to **Deployments** tab and click **Redeploy**

## Testing

Once deployed, visit your site and test the email signup form:
1. Enter an email address
2. Click "Subscribe"
3. You should see a success message
4. Check your Plunk dashboard to verify the contact was added

## Managing Subscribers

### View Contacts
- Go to your Plunk dashboard
- Navigate to **Contacts** to see all subscribers

### Create Campaigns
1. Go to **Campaigns** in Plunk
2. Create a new email campaign
3. Select your contacts
4. Design and send your email

### Automation (Optional)
You can set up automated welcome emails:
1. Go to **Automations** in Plunk
2. Create a trigger for new contacts
3. Design your welcome email sequence

## Troubleshooting

### "Email service not configured" error
- Make sure `PLUNK_API_KEY` is set in Vercel environment variables
- Verify the API key is correct and starts with `sk_`
- Redeploy your site after adding the variable

### "This email is already subscribed" error
- This is expected behavior - Plunk prevents duplicate subscriptions
- The user will see a friendly message

### API rate limits
- Free tier: 3,000 emails/month
- If you exceed this, upgrade your Plunk plan

## API Endpoint

The subscription logic is in: `/src/pages/api/subscribe.ts`

The endpoint accepts POST requests with:
```json
{
  "email": "user@example.com"
}
```

Returns:
```json
{
  "success": true
}
```

## Component Usage

The email signup component is located at: `/src/components/EmailSignup.astro`

To use it on other pages:
```astro
---
import EmailSignup from '../components/EmailSignup.astro';
---

<EmailSignup />
```
