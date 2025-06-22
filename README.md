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