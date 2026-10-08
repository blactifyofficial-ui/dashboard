import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

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

  // Attach logo directly using CID so email clients (like Gmail & Outlook) render it instantly without external hosting dependencies
  let logoAttachment: { filename: string; content: Buffer; contentType: string; contentId: string } | undefined;
  let logoSrc = `${appUrl}/blactify_logo_dark.png`;

  try {
    const logoPath = path.join(process.cwd(), 'public', 'blactify_logo_dark.png');
    if (fs.existsSync(logoPath)) {
      const content = fs.readFileSync(logoPath);
      logoAttachment = {
        filename: 'blactify_logo.png',
        content,
        contentType: 'image/png',
        contentId: 'blactify-logo',
      };
      logoSrc = 'cid:blactify-logo';
    }
  } catch (err) {
    console.warn('[Resend] Could not load inline logo asset:', err);
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `You've been invited to Blactify Team`,
      attachments: logoAttachment ? [logoAttachment] : undefined,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Blactify Dashboard Invitation</title>
          <!--[if mso]>
          <style type="text/css">
            body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
          </style>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #0f172a;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; padding: 40px 16px;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; text-align: center;">
                  
                  <!-- Logo / Brand Header -->
                  <tr>
                    <td style="padding: 16px 0 36px 0; text-align: center;">
                      <a href="${appUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                        <img src="${logoSrc}" alt="BLACTIFY" width="160" style="display: block; margin: 0 auto; width: 160px; max-width: 100%; height: auto; border: 0; outline: none; text-decoration: none;" />
                      </a>
                    </td>
                  </tr>

                  <!-- Main Heading -->
                  <tr>
                    <td style="padding: 0 0 16px 0; text-align: center;">
                      <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; line-height: 1.3;">
                        Join the TEAM
                      </h1>
                    </td>
                  </tr>

                  <!-- Message -->
                  <tr>
                    <td style="padding: 0 12px 32px 12px; text-align: center;">
                      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #475569;">
                        <strong style="color: #0f172a;">${inviterText}</strong> has invited you to collaborate on the <strong style="color: #0f172a;">Blactify Team</strong> as <strong style="color: #000000;">${roleName}</strong>.
                      </p>
                    </td>
                  </tr>

                  <!-- CTA Button -->
                  <tr>
                    <td align="center" style="padding: 0 0 28px 0;">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${appUrl}" style="height:46px;v-text-anchor:middle;width:220px;" arcsize="18%" stroke="f" fillcolor="#000000">
                        <w:anchorlock/>
                        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">Accept Invitation &rarr;</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-->
                      <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; text-align: center;">
                        Accept Invitation &rarr;
                      </a>
                      <!--<![endif]-->
                    </td>
                  </tr>

                  <!-- Sign-in Note -->
                  <tr>
                    <td style="padding: 0 12px 36px 12px; text-align: center;">
                      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                        Please sign in with your Google account for <strong style="color: #0f172a;">${toEmail}</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Divider -->
                  <tr>
                    <td style="border-top: 1px solid #f1f5f9; padding: 0 0 28px 0;"></td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="text-align: center;">
                      <p style="margin: 0 0 6px 0; font-size: 12px; line-height: 1.5; color: #94a3b8;">
                        If you were not expecting this invitation, you can safely ignore this email.
                      </p>
                      <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
                        &copy; ${new Date().getFullYear()} Blactify. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
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
