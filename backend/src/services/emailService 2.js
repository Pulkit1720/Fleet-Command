import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendTechnicianInvite({ to, full_name, inviteUrl }) {
  await transporter.sendMail({
    from: `"Fleet Command" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'You have been invited to Fleet Command',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Welcome to Fleet Command, ${full_name}!</h2>
        <p style="color: #475569;">You've been invited as a technician. Click the button below to set up your password and get started.</p>
        <a href="${inviteUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Set Up My Account
        </a>
        <p style="color: #94a3b8; font-size: 13px;">This link expires in 24 hours. If you didn't expect this invite, you can ignore this email.</p>
      </div>
    `,
  });
}
