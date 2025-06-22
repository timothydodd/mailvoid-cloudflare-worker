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
      let textContent = '';
      let htmlContent = '';
      
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
          
          // Basic parsing for text and HTML content
          const textMatch = emailContent.match(/Content-Type: text\/plain[\s\S]*?\n\n([\s\S]*?)(?=\n--|\n\nContent-Type|\n$)/i);
          const htmlMatch = emailContent.match(/Content-Type: text\/html[\s\S]*?\n\n([\s\S]*?)(?=\n--|\n\nContent-Type|\n$)/i);
          
          textContent = textMatch ? textMatch[1].trim() : '';
          htmlContent = htmlMatch ? htmlMatch[1].trim() : '';
          
        } finally {
          reader.releaseLock();
        }
      }
      
      const envelope = {
        to: Array.isArray(message.to) ? message.to : [message.to],
        from: message.from
      };

      const emailData = {
        headers: JSON.stringify(Object.fromEntries(message.headers)),
        dkim: message.headers.get('dkim-signature') || null,
        to: message.to,
        html: htmlContent || null,
        from: message.from,
        text: textContent || null,
        sender_Ip: message.headers.get('x-originating-ip') || message.headers.get('x-sender-ip') || null,
        spf: message.headers.get('received-spf') || null,
        attachments: null, // Cloudflare Workers email doesn't provide easy attachment access
        subject: message.headers.get('subject') || null,
        envelope: JSON.stringify(envelope),
        charsets: message.headers.get('content-type')?.match(/charset=([^;]+)/)?.[1] || null,
        createdOn: new Date().toISOString(),
        spam_Score: message.headers.get('x-spam-score') || null
      };

      if (!env.MAILVOID_API_URL) {
        console.error('❌ MAILVOID_API_URL not configured');
        message.setReject('API URL not configured');
        return;
      }

      console.log('📤 Forwarding to Mailvoid API', {
        subject: emailData.subject,
        textLength: emailData.text?.length || 0,
        htmlLength: emailData.html?.length || 0,
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
          from: message.from,
          to: message.to,
          subject: emailData.subject
        });
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        
        message.setReject(`Failed to forward email: ${response.status}`);
        return;
      }

      const processingTime = Date.now() - startTime;
      console.log('✅ Email successfully forwarded to Mailvoid API', {
        from: message.from,
        to: message.to,
        subject: emailData.subject,
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