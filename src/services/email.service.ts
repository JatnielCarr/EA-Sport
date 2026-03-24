import nodemailer from 'nodemailer';

/**
 * =====================================================
 * SERVICIO DE EMAIL — Transaccional
 * =====================================================
 * 
 * Usa Nodemailer con SMTP (configurable via .env).
 * En desarrollo usa Ethereal (fake SMTP).
 * En producción usa SendGrid, SES, o SMTP real.
 */

let transporter: nodemailer.Transporter;

async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    // Producción: usar SMTP real
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  } else {
    // Desarrollo: crear cuenta Ethereal temporal
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Email usando Ethereal (dev). User:', testAccount.user);
  }

  return transporter;
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'Apex Tournament <noreply@apextournament.com>';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const APP_NAME = 'Apex Tournament';

// =====================================================
// TEMPLATES
// =====================================================

function baseTemplate(content: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0e17; color: #e1e5ee; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
      .header { text-align: center; margin-bottom: 30px; }
      .header h1 { color: #00d4ff; font-size: 28px; margin: 0; }
      .header p { color: #8b95a5; font-size: 14px; }
      .card { background: #141926; border: 1px solid #1e2740; border-radius: 16px; padding: 32px; margin-bottom: 20px; }
      .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00d4ff, #00ff88); color: #000; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; }
      .footer { text-align: center; font-size: 12px; color: #8b95a5; margin-top: 30px; }
      .code { font-family: 'Courier New', monospace; font-size: 32px; font-weight: 900; color: #00d4ff; letter-spacing: 4px; text-align: center; padding: 20px; background: #0d1117; border-radius: 10px; margin: 20px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎮 ${APP_NAME}</h1>
        <p>Plataforma competitiva de eSports</p>
      </div>
      ${content}
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.</p>
      </div>
    </div>
  </body>
  </html>`;
}

// =====================================================
// EMAIL FUNCTIONS
// =====================================================

export const emailService = {

  /**
   * Enviar email de verificación
   */
  async sendVerificationEmail(email: string, username: string, token: string) {
    const transport = await getTransporter();
    const verifyUrl = `${APP_URL}/#/verify-email?token=${token}`;

    const html = baseTemplate(`
      <div class="card">
        <h2 style="margin-top:0;">¡Bienvenido, ${username}! 🎮</h2>
        <p>Gracias por registrarte en ${APP_NAME}. Verifica tu email para activar tu cuenta:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${verifyUrl}" class="btn">✅ Verificar mi Email</a>
        </div>
        <p style="font-size: 13px; color: #8b95a5;">O copia este enlace: ${verifyUrl}</p>
        <p style="font-size: 12px; color: #8b95a5;">Este enlace expira en 24 horas.</p>
      </div>
    `);

    const info = await transport.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: `✅ Verifica tu email — ${APP_NAME}`,
      html
    });

    console.log(`📧 Verification email sent to ${email}. Preview: ${nodemailer.getTestMessageUrl(info) || 'N/A'}`);
    return info;
  },

  /**
   * Enviar email de reset de password
   */
  async sendPasswordResetEmail(email: string, username: string, token: string) {
    const transport = await getTransporter();
    const resetUrl = `${APP_URL}/#/reset-password?token=${token}`;

    const html = baseTemplate(`
      <div class="card">
        <h2 style="margin-top:0;">Recuperar Contraseña 🔐</h2>
        <p>Hola <strong>${username}</strong>, recibimos una solicitud para restablecer tu contraseña.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" class="btn">🔑 Restablecer Contraseña</a>
        </div>
        <p style="font-size: 13px; color: #8b95a5;">O copia este enlace: ${resetUrl}</p>
        <p style="font-size: 12px; color: #8b95a5;">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este email.</p>
      </div>
    `);

    const info = await transport.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: `🔑 Restablecer contraseña — ${APP_NAME}`,
      html
    });

    console.log(`📧 Password reset email sent to ${email}. Preview: ${nodemailer.getTestMessageUrl(info) || 'N/A'}`);
    return info;
  },

  /**
   * Enviar notificación de premio recibido
   */
  async sendPrizeNotificationEmail(email: string, username: string, amount: number, tournamentName: string, position: number) {
    const transport = await getTransporter();

    const html = baseTemplate(`
      <div class="card">
        <h2 style="margin-top:0;">🏆 ¡Felicitaciones, ${username}!</h2>
        <p>Obtuviste el <strong>${position}° lugar</strong> en <strong>${tournamentName}</strong>.</p>
        <div class="code">$${amount.toFixed(2)} MXN</div>
        <p>El premio ya fue depositado en tu monedero virtual. Puedes retirarlo cuando quieras.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${APP_URL}/#/monedero" class="btn">💰 Ver mi Monedero</a>
        </div>
      </div>
    `);

    const info = await transport.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: `🏆 ¡Ganaste $${amount.toFixed(2)} MXN! — ${APP_NAME}`,
      html
    });

    return info;
  },

  /**
   * Enviar notificación de retiro procesado
   */
  async sendWithdrawalStatusEmail(email: string, username: string, amount: number, status: 'approved' | 'rejected', reason?: string) {
    const transport = await getTransporter();
    const isApproved = status === 'approved';

    const html = baseTemplate(`
      <div class="card">
        <h2 style="margin-top:0;">${isApproved ? '✅ Retiro Aprobado' : '❌ Retiro Rechazado'}</h2>
        <p>Hola <strong>${username}</strong>,</p>
        <p>Tu solicitud de retiro por <strong>$${amount.toFixed(2)} MXN</strong> ha sido ${isApproved ? 'aprobada y procesada' : 'rechazada'}.</p>
        ${!isApproved && reason ? `<p><strong>Razón:</strong> ${reason}</p>` : ''}
        ${isApproved ? '<p>El depósito debería reflejarse en tu cuenta en 1-3 días hábiles.</p>' : '<p>El monto ha sido devuelto a tu monedero virtual.</p>'}
      </div>
    `);

    const info = await transport.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: `${isApproved ? '✅' : '❌'} Retiro ${isApproved ? 'aprobado' : 'rechazado'} — ${APP_NAME}`,
      html
    });

    return info;
  },

  /**
   * Email genérico
   */
  async sendGenericEmail(to: string, subject: string, bodyHtml: string) {
    const transport = await getTransporter();
    const html = baseTemplate(`<div class="card">${bodyHtml}</div>`);
    return transport.sendMail({ from: FROM_EMAIL, to, subject, html });
  }
};
