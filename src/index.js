export default {
  async email(message, env, ctx) {
    const startTime = Date.now();
    console.log('🔄 Email processing started', {
      from: message.from,
      to: message.to,
      timestamp: new Date().toISOString()
    });

    try {
      console.log('📧 Extracting email content...');
      
      // Read raw email content
      let emailContent = '';
      
      if (message.raw) {
        const reader = message.raw.getReader();
        const decoder = new TextDecoder();
        let chunks = [];
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(decoder.decode(value, { stream: true }));
          }
          emailContent = chunks.join('');
          
        } finally {
          reader.releaseLock();
        }
      }

      const emailData = {
        from: message.from,
        to: message.to,
        headers: Object.fromEntries(message.headers),
        raw: emailContent,
        rawSize: message.rawSize || emailContent.length
      };

      if (!env.MAILVOID_API_URL) {
        console.error('❌ MAILVOID_API_URL not configured');
        message.setReject('API URL not configured');
        return;
      }

      console.log('📤 Forwarding to Mailvoid API', {
        from: emailData.from,
        to: emailData.to,
        rawSize: emailData.rawSize,
        apiUrl: env.MAILVOID_API_URL
      });

      const response = await fetch(env.MAILVOID_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': env.MAILVOID_API_KEY,
          'User-Agent': 'Cloudflare-Worker-Email-Forwarder/1.0'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        console.error('❌ Failed to forward email', {
          status: response.status,
          statusText: response.statusText,
          from: emailData.from,
          to: emailData.to
        });
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        
        message.setReject(`Failed to forward email: ${response.status}`);
        return;
      }

      const processingTime = Date.now() - startTime;
      console.log('✅ Email successfully forwarded to Mailvoid API', {
        from: emailData.from,
        to: emailData.to,
        rawSize: emailData.rawSize,
        processingTimeMs: processingTime,
        responseStatus: response.status
      });
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('💥 Error processing email', {
        error: error.message,
        stack: error.stack,
        from: message.from,
        to: message.to,
        processingTimeMs: processingTime
      });
      message.setReject('Internal server error while processing email');
    }
  },

  async fetch(request, env, ctx) {
    return new Response('Mailvoid Email Forwarder - Email routing only', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};