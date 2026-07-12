/**
 * Email transport + templating.
 *
 * Kept separate from the worker so you can unit test template rendering
 * and swap providers (SES, SendGrid, Postmark) without touching queue logic.
 * In real prod, prefer a transactional email API (SES/SendGrid) over raw
 * SMTP — you get delivery webhooks, better deliverability, and no SMTP
 * connection-pool tuning to worry about. Nodemailer is shown here because
 * it's the most portable example; swapping the `transporter.sendMail` call
 * for an SES SDK call is a ~10 line change contained entirely in this file.
 */

const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter =
    process.env.NODE_ENV === 'test'
      ? nodemailer.createTransport({ jsonTransport: true })
      : nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
        });

  return _transporter;
}

function renderTemplate(status, { applicantName, applicationId, meta }) {
  const s = status.toLowerCase();

  if (s === 'accepted') {
    return {
      subject: `Your application has been accepted`,
      html: `
        <p>Hi ${applicantName},</p>
        <p>Great news! Your application <strong>${applicationId}</strong> has been accepted by the employer.</p>
        <p>They will review your profile and reach out if you are shortlisted for an interview.</p>
        ${meta.notes ? `<p>Notes: ${meta.notes}</p>` : ''}
        <p>Best of luck,<br/>Job Listing Team</p>
      `,
    };
  }

  if (s === 'interview') {
    return {
      subject: `You have been shortlisted for an interview`,
      html: `
        <p>Hi ${applicantName},</p>
        <p>Congratulations! You have been shortlisted for an interview for application <strong>${applicationId}</strong>.</p>
        <p>The employer will contact you shortly with interview details.</p>
        ${meta.notes ? `<p>Notes: ${meta.notes}</p>` : ''}
        <p>Best of luck,<br/>Job Listing Team</p>
      `,
    };
  }

  if (s === 'hired') {
    return {
      subject: `Congratulations — you have been hired!`,
      html: `
        <p>Hi ${applicantName},</p>
        <p>We are thrilled to let you know that you have been <strong>hired</strong> for the role you applied for (application <strong>${applicationId}</strong>).</p>
        <p>The employer will be in touch with next steps.</p>
        <p>Congratulations,<br/>Job Listing Team</p>
      `,
    };
  }

  if (s === 'rejected') {
    return {
      subject: `Update on your application`,
      html: `
        <p>Hi ${applicantName},</p>
        <p>Thank you for your interest. Unfortunately, your application <strong>${applicationId}</strong> has not moved forward at this time.</p>
        ${meta.reason ? `<p>Reason: ${meta.reason}</p>` : ''}
        <p>We encourage you to apply for other roles that match your profile.</p>
        <p>Regards,<br/>Job Listing Team</p>
      `,
    };
  }

  throw new Error(`No email template for status: ${status}`);
}

/**
 * Sends the status-change email. Throws on failure so BullMQ marks the
 * job as failed and applies the retry/backoff policy automatically.
 */
async function sendStatusEmail({ status, recipientEmail, applicantName, applicationId, meta }) {
  const { subject, html } = renderTemplate(status, { applicantName, applicationId, meta });

  const info = await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: recipientEmail,
    subject,
    html,
  });

  return info;
}

module.exports = { sendStatusEmail };
