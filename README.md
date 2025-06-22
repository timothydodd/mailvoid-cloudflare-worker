# Mailvoid Cloudflare Worker

A Cloudflare Worker that forwards incoming emails to your Mailvoid API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your environment variables in Cloudflare Dashboard or via Wrangler:
```bash
wrangler secret put MAILVOID_API_URL
wrangler secret put MAILVOID_API_KEY
```

3. Update `wrangler.toml` with your domain and email routing settings.

4. Deploy the worker:
```bash
npm run deploy
```

## Development

Run locally:
```bash
npm run dev
```

## Testing

### 1. Local Testing
Run the test script:
```bash
node test-email.js
```

### 2. Wrangler Dev with Email Simulation
Start dev server:
```bash
wrangler dev
```

### 3. Production Testing
After deployment, test with real emails by:
- Setting up email routing in Cloudflare Dashboard
- Sending test emails to your configured domain
- Monitoring logs: `wrangler tail`

### 4. API Testing
Use curl to test your Mailvoid API endpoint directly:
```bash
curl -X POST your-mailvoid-api-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{"from":"test@example.com","to":"test@yourdomain.com","subject":"Test"}'
```

## Configuration

The worker expects these environment variables:
- `MAILVOID_API_URL`: Your Mailvoid API endpoint
- `MAILVOID_API_KEY`: Your Mailvoid API authentication key

## Email Routing

Configure email routing in your Cloudflare Dashboard under Email Routing to forward emails to this worker.

## Cloudflare Workers Email API

The Cloudflare Workers email message object provides these properties and methods:

### Message Properties
- `message.from` - Sender's email address (string)
- `message.to` - Recipient's email address (string)  
- `message.headers` - Headers object with all email headers
- `message.raw` - ReadableStream of the full raw email content
- `message.rawSize` - Size of the email message content (number)

### Message Methods
- `message.setReject(reason)` - Reject the email with a specific reason
- `message.forward(rcptTo, headers)` - Forward the email to another address
- `message.reply(EmailMessage)` - Reply to the sender with a new email

### Content Extraction
Since there are no direct `.text()` or `.html()` methods, the worker reads from `message.raw` stream and parses the content using regex patterns to extract:
- Plain text content from `Content-Type: text/plain` sections
- HTML content from `Content-Type: text/html` sections

### Data Mapping to EmailModel
The worker maps Cloudflare email data to your EmailModel structure:
```json
{
  "headers": "JSON string of all headers",
  "dkim": "DKIM-Signature header value",
  "to": "recipient@domain.com",
  "html": "HTML content or null",
  "from": "sender@domain.com", 
  "text": "Plain text content or null",
  "sender_Ip": "X-Originating-IP or X-Sender-IP header",
  "spf": "Received-SPF header value",
  "attachments": null,
  "subject": "Email subject",
  "envelope": "JSON string with to/from arrays",
  "charsets": "Charset from Content-Type header",
  "createdOn": "ISO timestamp",
  "spam_Score": "X-Spam-Score header value"
}
```