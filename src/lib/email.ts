import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || process.env.RESEND;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Blactify <onboarding@resend.dev>';

export interface SendTeamInvitationParams {
  toEmail: string;
  roleName: string;
  invitedByName?: string | null;
  invitedByEmail?: string | null;
  appUrl?: string;
}

export async function sendTeamInvitationEmail({
  toEmail,
  roleName,
  invitedByName,
  invitedByEmail,
  appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dashboard.blactify.com',
}: SendTeamInvitationParams) {
  if (!resend) {
    console.warn('[Resend] RESEND API key is not configured in environment variables.');
    return { success: false, error: 'Resend API key not configured' };
  }

  const inviterText = invitedByName || invitedByEmail || 'The Blactify Team';

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `You've been invited to Blactify Dashboard`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Blactify Dashboard Invitation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0c0c; color: #ededed; margin: 0; padding: 40px 20px;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #161616; border: 1px solid #2a2a2a; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <!-- Header -->
            <tr>
              <td style="padding: 36px 36px 20px 36px; text-align: center; border-bottom: 1px solid #222;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                  BLACTIFY
                </h1>
                <p style="margin: 6px 0 0 0; font-size: 12px; color: #888; letter-spacing: 1px; text-transform: uppercase;">
                  Store Operations &amp; Financials
                </p>
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td style="padding: 36px;">
                <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
                  You've been invited to join the team
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #a1a1a1;">
                  <strong style="color: #ffffff;">${inviterText}</strong> has granted you access to the Blactify Dashboard with the role:
                </p>

                <!-- Role Badge Box -->
                <div style="background-color: #1f1f1f; border: 1px solid #333; border-radius: 12px; padding: 16px 20px; margin: 0 0 28px 0; text-align: center;">
                  <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #a78bfa; background-color: rgba(167, 139, 250, 0.12); border: 1px solid rgba(167, 139, 250, 0.25); padding: 4px 12px; border-radius: 20px; margin-bottom: 6px;">
                    Assigned Role
                  </span>
                  <div style="font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 4px;">
                    ${roleName}
                  </div>
                </div>

                <!-- CTA Button -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
                  <tr>
                    <td align="center">
                      <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #ffffff; color: #000000; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 2px 8px rgba(255,255,255,0.15);">
                        Sign In to Dashboard &rarr;
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 20px 0 0 0; font-size: 12px; line-height: 1.5; color: #737373; text-align: center;">
                  Please sign in using your Google account associated with <strong style="color: #a1a1a1;">${toEmail}</strong>.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 36px; background-color: #111111; border-top: 1px solid #222; text-align: center;">
                <p style="margin: 0; font-size: 11px; color: #555;">
                  &copy; ${new Date().getFullYear()} Blactify. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return { success: true, data };
  } catch (err: unknown) {
    console.error('[Resend] Error sending invitation email:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send email',
    };
  }
}
