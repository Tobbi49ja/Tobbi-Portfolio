const express    = require('express');
const nodemailer = require('nodemailer');
const rateLimit  = require('express-rate-limit');
const validator  = require('validator');
const router     = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many messages sent. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

router.post('/contact', contactLimiter, async (req, res) => {
  let { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  name    = String(name).trim();
  email   = String(email).trim();
  subject = String(subject).trim();
  message = String(message).trim();

  if (name.length < 1 || name.length > 100) {
    return res.status(400).json({ error: 'Name must be between 1 and 100 characters' });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (subject.length < 1 || subject.length > 200) {
    return res.status(400).json({ error: 'Subject must be between 1 and 200 characters' });
  }
  if (message.length < 1 || message.length > 5000) {
    return res.status(400).json({ error: 'Message must be between 1 and 5000 characters' });
  }

  const safeName    = escapeHtml(name);
  const safeEmail   = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Portfolio Message</title>
</head>
<body style="margin:0;padding:0;background:#0a0f14;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f14;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0d1821;border:1px solid #00d4ff33;border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#050a0e 0%,#0d2137 100%);padding:32px 40px;border-bottom:2px solid #00d4ff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;letter-spacing:0.2em;color:#00d4ff;text-transform:uppercase;font-weight:600;">Portfolio Contact</p>
                    <h1 style="margin:8px 0 0;font-size:26px;color:#ffffff;font-weight:700;letter-spacing:0.05em;">New Message Received</h1>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <span style="display:inline-block;background:#00d4ff15;border:1px solid #00d4ff44;border-radius:6px;padding:6px 14px;font-size:12px;color:#00d4ff;letter-spacing:0.1em;font-weight:600;">TOBBI.DEV</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">

              <!-- Sender info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1520;border:1px solid #00d4ff22;border-radius:8px;margin-bottom:24px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #00d4ff15;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.18em;color:#00d4ff88;text-transform:uppercase;font-weight:600;">From</p>
                    <p style="margin:0;font-size:17px;color:#ffffff;font-weight:600;">${safeName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;border-bottom:1px solid #00d4ff15;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.18em;color:#00d4ff88;text-transform:uppercase;font-weight:600;">Email</p>
                    <a href="mailto:${safeEmail}" style="margin:0;font-size:15px;color:#00d4ff;text-decoration:none;">${safeEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.18em;color:#00d4ff88;text-transform:uppercase;font-weight:600;">Subject</p>
                    <p style="margin:0;font-size:15px;color:#e0e0e0;font-weight:500;">${safeSubject}</p>
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.18em;color:#00d4ff88;text-transform:uppercase;font-weight:600;">Message</p>
              <div style="background:#0a1520;border:1px solid #00d4ff22;border-left:3px solid #00d4ff;border-radius:0 8px 8px 0;padding:20px 24px;">
                <p style="margin:0;font-size:15px;color:#c8d8e8;line-height:1.7;white-space:pre-wrap;">${safeMessage}</p>
              </div>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td>
                    <a href="mailto:${safeEmail}?subject=Re: ${encodeURIComponent(subject)}" style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#00ff88);color:#050a0e;font-size:14px;font-weight:700;letter-spacing:0.08em;text-decoration:none;padding:12px 28px;border-radius:6px;">Reply to ${safeName}</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#050a0e;padding:20px 40px;border-top:1px solid #00d4ff22;">
              <p style="margin:0;font-size:12px;color:#ffffff44;text-align:center;">This message was sent via the contact form on your portfolio website.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const mailOptions = {
    from: `"Tobbi Portfolio" <${process.env.EMAIL_USER}>`,
    replyTo: `"${name}" <${email}>`,
    to: process.env.EMAIL_USER,
    subject: `[Portfolio] ${subject} — from ${name}`,
    text: `New message from your portfolio contact form.\n\nFrom: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

module.exports = router;
