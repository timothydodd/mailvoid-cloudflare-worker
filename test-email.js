// Test script to simulate email processing locally
// Run with: node test-email.js

const worker = require('./src/index.js').default;

// Mock email message object
const mockMessage = {
  from: 'test@example.com',
  to: 'recipient@yourdomain.com',
  headers: new Map([
    ['subject', 'Test Email'],
    ['content-type', 'text/plain; charset=utf-8'],
    ['dkim-signature', 'v=1; a=rsa-sha256; test=signature'],
    ['received-spf', 'pass'],
    ['x-spam-score', '0.1']
  ]),
  async text() { return 'This is a test email body'; },
  async html() { return '<p>This is a test email body</p>'; },
  async raw() { return 'Raw email content'; },
  setReject(reason) { console.log('Email rejected:', reason); }
};

// Mock environment
const mockEnv = {
  MAILVOID_API_URL: 'https://httpbin.org/post', // Test endpoint
  MAILVOID_API_KEY: 'test-key'
};

// Run test
console.log('Testing email processing...');
worker.email(mockMessage, mockEnv, {})
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err));