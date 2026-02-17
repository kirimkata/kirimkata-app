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
    const verificationUrl = `${frontendUrl}/client-dashboard/verify-email?token=${params.token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Email - KirimKata</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #1a1a1a; color: #F5F5F0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #2d2d2d; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <h1 style="margin: 0; color: #F5F5F0; font-size: 28px; font-weight: 300; letter-spacing: 0.1em; font-family: Georgia, serif;">kirimkata</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #F5F5F0; font-size: 16px; line-height: 1.6;">Halo, ${params.username}!</p>
                            
                            <p style="margin: 0 0 20px 0; color: rgba(245, 245, 240, 0.8); font-size: 16px; line-height: 1.6;">
                                Selamat datang di <strong>KirimKata - The Signature of Your Special Moment</strong>.
                            </p>

                            <p style="margin: 0 0 20px 0; color: rgba(245, 245, 240, 0.8); font-size: 16px; line-height: 1.6;">
                                Untuk mengaktifkan akun Anda dan mulai membuat undangan digital, silakan verifikasi alamat email Anda dengan menekan tombol di bawah ini:
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; background-color: #F5F5F0; color: #1a1a1a; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 600; letter-spacing: 0.05em; transition: all 0.3s;">
                                            Verifikasi Email
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0 0; color: rgba(245, 245, 240, 0.8); font-size: 14px; line-height: 1.6;">
                                Jika tombol tidak dapat diklik, Anda dapat menyalin dan membuka tautan berikut di browser Anda:
                            </p>
                            <p style="margin: 10px 0 0 0; color: #F5F5F0; font-size: 14px; word-break: break-all; opacity: 0.8;">
                                <a href="${verificationUrl}" style="color: #F5F5F0; text-decoration: underline;">${verificationUrl}</a>
                            </p>
                            
                            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1);">
                                <p style="margin: 0 0 10px 0; color: rgba(245, 245, 240, 0.8); font-size: 14px; line-height: 1.6;">
                                    <strong>Penting:</strong>
                                </p>
                                <p style="margin: 0; color: rgba(245, 245, 240, 0.6); font-size: 14px; line-height: 1.6;">
                                    Tautan verifikasi ini berlaku selama <strong>24 jam</strong>. Jika Anda tidak merasa mendaftar di KirimKata, silakan abaikan email ini.
                                </p>
                            </div>

                            <p style="margin: 30px 0 0 0; color: rgba(245, 245, 240, 0.8); font-size: 16px; line-height: 1.6;">
                                Terima kasih telah bergabung,<br>
                                <strong>Tim KirimKata</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #1a1a1a; padding: 20px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
                            <p style="margin: 0; color: rgba(245, 245, 240, 0.4); font-size: 12px;">
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
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #1a1a1a; padding: 20px; color: #F5F5F0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #2d2d2d; padding: 40px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        <h1 style="color: #F5F5F0; font-size: 24px; font-weight: 300; letter-spacing: 0.05em; margin-bottom: 24px;">Reset Password</h1>
        <p style="color: rgba(245, 245, 240, 0.8); line-height: 1.6;">Halo ${username},</p>
        <p style="color: rgba(245, 245, 240, 0.8); line-height: 1.6;">Anda menerima email ini karena ada permintaan untuk reset password akun Anda.</p>
        <p style="color: rgba(245, 245, 240, 0.8); line-height: 1.6;">Klik tombol di bawah untuk reset password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #F5F5F0; color: #1a1a1a; text-decoration: none; border-radius: 50px; margin: 24px 0; font-weight: 600; letter-spacing: 0.05em;">
            Reset Password
        </a>
        <p style="color: rgba(245, 245, 240, 0.8); line-height: 1.6;">Atau salin link berikut: <span style="color: #F5F5F0; opacity: 0.8; word-break: break-all;">${resetUrl}</span></p>
        <p style="color: rgba(245, 245, 240, 0.5); font-size: 13px; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
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
