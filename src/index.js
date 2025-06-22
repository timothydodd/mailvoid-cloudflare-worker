export default {
  async email(message, env, ctx) {
    try {
      const rawMessage = await message.raw();
      const textContent = await message.text();
      const htmlContent = await message.html();
      
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

      const response = await fetch(env.MAILVOID_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.MAILVOID_API_KEY}`,
          'User-Agent': 'Cloudflare-Worker-Email-Forwarder/1.0'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        console.error(`Failed to forward email: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        
        message.setReject(`Failed to forward email: ${response.status}`);
        return;
      }

      console.log('Email successfully forwarded to Mailvoid API');
      
    } catch (error) {
      console.error('Error processing email:', error);
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