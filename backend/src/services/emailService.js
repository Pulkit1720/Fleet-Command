import nodemailer from 'nodemailer';

const smtpPort = Number(process.env.SMTP_PORT) || 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465 (implicit TLS), false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

function buildFrom(inviterName) {
  const address = process.env.INVITE_FROM_ADDRESS || process.env.SMTP_USER;
  const display = inviterName ? `${inviterName} via Fleet Coordinate` : 'Fleet Coordinate';
  return `"${display}" <${address}>`;
}

export async function sendTechnicianInvite({ to, full_name, inviterName, inviteUrl }) {
  const inviter = inviterName?.trim() || 'Your team admin';

  await transporter.sendMail({
    from: buildFrom(inviterName),
    to,
    subject: `${inviter} invited you to join their team on Fleet Coordinate`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e293b;">${inviter} invited you to join their team</h2>
        <p style="color: #475569;">Hi ${full_name || 'there'}, you've been invited as a technician on Fleet Coordinate. Click the button below to set up your password and get started.</p>
        <a href="${inviteUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Set Up My Account
        </a>
        <p style="color: #94a3b8; font-size: 13px;">This link expires in 24 hours. If you didn't expect this invite, you can ignore this email.</p>
      </div>
    `,
  });
}
