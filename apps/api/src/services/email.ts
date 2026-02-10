/**
 * Email service for sending verification emails using Resend
 * Cloudflare Workers compatible
 */

export interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

export interface VerificationEmailParams {
    email: string;
    username: string;
    token: string;
}

/**
 * Send email using Resend API
 */
export async function sendEmail(
    params: SendEmailParams,
    apiKey: string,
    fromEmail: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: fromEmail,
                to: params.to,
                subject: params.subject,
                html: params.html,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Resend API error:', error);
            return { success: false, error: `Failed to send email: ${error}` };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send verification email to new user
 */
export async function sendVerificationEmail(
    params: VerificationEmailParams,
    apiKey: string,
    fromEmail: string,
    frontendUrl: string
): Promise<{ success: boolean; error?: string }> {
    const verificationUrl = `${frontendUrl}/verify-email?token=${params.token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Email - KirimKata</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">KirimKata</h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Undangan Digital Anda</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Halo, ${params.username}!</h2>
                            <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                Terima kasih telah mendaftar di KirimKata. Untuk melanjutkan, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                                            Verifikasi Email
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                                Atau salin dan tempel link berikut ke browser Anda:
                            </p>
                            <p style="margin: 10px 0 0 0; color: #667eea; font-size: 14px; word-break: break-all;">
                                ${verificationUrl}
                            </p>
                            
                            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #eeeeee;">
                                <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6;">
                                    <strong>Catatan:</strong> Link verifikasi ini berlaku selama 24 jam. Jika Anda tidak mendaftar di KirimKata, abaikan email ini.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center;">
                            <p style="margin: 0; color: #999999; font-size: 12px;">
                                © 2026 KirimKata. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();

    return sendEmail(
        {
            to: params.email,
            subject: 'Verifikasi Email Anda - KirimKata',
            html,
        },
        apiKey,
        fromEmail
    );
}

/**
 * Send password reset email (for future use)
 */
export async function sendPasswordResetEmail(
    email: string,
    username: string,
    token: string,
    apiKey: string,
    fromEmail: string,
    frontendUrl: string
): Promise<{ success: boolean; error?: string }> {
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Password - KirimKata</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px;">
        <h1 style="color: #333333;">Reset Password</h1>
        <p>Halo ${username},</p>
        <p>Anda menerima email ini karena ada permintaan untuk reset password akun Anda.</p>
        <p>Klik tombol di bawah untuk reset password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Reset Password
        </a>
        <p>Atau salin link berikut: ${resetUrl}</p>
        <p style="color: #999999; font-size: 12px; margin-top: 30px;">
            Link ini berlaku selama 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.
        </p>
    </div>
</body>
</html>
    `.trim();

    return sendEmail(
        {
            to: email,
            subject: 'Reset Password - KirimKata',
            html,
        },
        apiKey,
        fromEmail
    );
}
