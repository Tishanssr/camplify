

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function parseEmailAddress(addr, defaultName = 'Camplify') {
    if (!addr) {
        const fallbackEmail = process.env.SENDER_EMAIL || 'modecc99@gmail.com';
        return { name: defaultName, email: fallbackEmail };
    }
    if (typeof addr === 'object' && addr.email) {
        return { name: addr.name || defaultName, email: addr.email };
    }
    const match = String(addr).match(/^(?:"?([^"]*)"?\s)?<([^>]+)>$/);
    if (match) {
        return { name: match[1] ? match[1].trim() : defaultName, email: match[2].trim() };
    }
    return { name: defaultName, email: String(addr).trim() };
}

function parseToRecipients(to) {
    if (!to) return [];
    if (Array.isArray(to)) {
        return to.map(item => parseEmailAddress(item, 'Camper'));
    }
    return [parseEmailAddress(to, 'Camper')];
}

const transporter = {
    sendMail: async (mailOptions) => {
        const apiKey = process.env.BREVO_API_KEY;

        if (!apiKey) {
            console.error('[EMAIL_SERVICE] BREVO_API_KEY environment variable is missing!');
            throw new Error('BREVO_API_KEY environment variable is missing.');
        }

        const { from, to, subject, html, text, htmlContent, textContent } = mailOptions;

        const sender = parseEmailAddress(from || process.env.SENDER_EMAIL, 'Camplify');
        const recipients = parseToRecipients(to);

        const body = {
            sender,
            to: recipients,
            subject: subject || 'Notification from Camplify',
        };

        const finalHtml = html || htmlContent;
        const finalText = text || textContent;

        if (finalHtml) {
            body.htmlContent = finalHtml;
        }
        if (finalText) {
            body.textContent = finalText;
        }

        if (!body.htmlContent && !body.textContent) {
            body.textContent = 'No message content provided.';
        }

        const response = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            let errorDetails = response.statusText;
            try {
                const errJson = await response.json();
                errorDetails = errJson.message || JSON.stringify(errJson);
            } catch (e) {
                // If response is not JSON
            }
            console.error(`[EMAIL_SERVICE] Failed to send email via Brevo HTTP API (Status ${response.status}):`, errorDetails);
            throw new Error(`Brevo HTTP API Error (${response.status}): ${errorDetails}`);
        }

        const data = await response.json().catch(() => ({ messageId: 'success' }));
        console.log(`[EMAIL_SERVICE] Email successfully sent via Brevo HTTP API to ${recipients.map(r => r.email).join(', ')}`);
        return data;
    }
};

export default transporter;
