# Feedback Feature

This feature allows users to submit feedback, bug reports, and feature suggestions through the website.

## Setup

### 1. Install Dependencies

The feedback feature uses Resend to send emails. Dependencies should already be installed, but if needed:

```bash
npm install resend
```

### 2. Configure Resend API Key

The project already has a Resend API key configured in `.env.local`. No additional setup is needed!

If you need to update it, edit `.env.local` in the `client` directory:

```env
RESEND_API_KEY=re_your_api_key_here
```

**Note:** The Resend API key should already be configured in your existing `.env.local` file.

#### How to get a Resend API Key (if needed):

1. Go to https://resend.com
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env.local` file

### 3. Destination Email

Feedback emails are currently sent to: **contact.chesspie@gmail.com**

To change this, edit the file:
`src/app/api/feedback/route.ts` and update line 25:

```typescript
to: ["your-email@example.com"],
```

## How It Works

1. **Frontend**: Users select a feedback type (Bug Report, Feature Suggestion, or General Feedback)
2. **Form**: They fill out an optional email field and required message field
3. **API**: The form submits to `/api/feedback` endpoint
4. **Email**: Resend sends the feedback to the configured address
5. **Confirmation**: User sees a success message

## File Structure

```
src/
├── app/
│   ├── [locale]/
│   │   └── feedback/
│   │       └── page.tsx          # Feedback form UI
│   └── api/
│       └── feedback/
│           └── route.ts          # API endpoint for email sending
├── messages/
│   ├── en.json                   # English translations
│   └── de.json                   # German translations
└── components/
    ├── Header.tsx                # Desktop navigation
    └── MobileMenu.tsx            # Mobile navigation
```

## Troubleshooting

### Email not sending?

1. Check that `RESEND_API_KEY` is set in `.env.local`
2. Verify your Resend API key is valid
3. Check the server console for error messages
4. Make sure your Resend account is in good standing

### Resend errors?

- Verify your API key is correct
- Check that your Resend account has sending permissions
- Review Resend logs at https://resend.com/logs

## Security Notes

- Never commit `.env.local` to version control
- Use environment variables from your hosting platform in production
- Resend API keys should be kept secure
- Consider rate limiting the feedback endpoint to prevent abuse

## Advantages of Resend

- **Simple Setup**: No Gmail App Passwords or SMTP configuration needed
- **Reliable**: Built for transactional emails
- **Fast**: Quick delivery times
- **Monitoring**: Easy to track emails in Resend dashboard
- **Professional**: Uses proper email infrastructure
