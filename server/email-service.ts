import nodemailer from 'nodemailer';
import { getDb } from './db';
import { systemConfig } from '../drizzle/schema';

interface SendOrderEmailParams {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: string;
  pdfBuffer: Buffer;
  excelBuffer: Buffer;
}

/**
 * Get SMTP configuration from database
 */
async function getSmtpConfig() {
  const db = await getDb();
  const configs = await db.select().from(systemConfig);
  
  const host = configs.find(c => c.key === "smtp_host")?.value || "smtp.gmail.com";
  const port = parseInt(configs.find(c => c.key === "smtp_port")?.value || "587");
  const secure = configs.find(c => c.key === "smtp_secure")?.value === "ssl";
  const user = configs.find(c => c.key === "smtp_user")?.value || "";
  const pass = configs.find(c => c.key === "smtp_password")?.value || "";
  const fromName = configs.find(c => c.key === "smtp_from_name")?.value || "IMPORKAM Tienda";
  const fromEmail = configs.find(c => c.key === "smtp_from_email")?.value || "";
  const recipientEmail = configs.find(c => c.key === "order_recipient_email")?.value || user;
  
  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    fromName,
    fromEmail,
    recipientEmail,
  };
}

/**
 * Send order email with PDF and Excel attachments
 */
export async function sendOrderEmail(params: SendOrderEmailParams): Promise<void> {
  const {
    orderNumber,
    customerName,
    customerEmail,
    total,
    pdfBuffer,
    excelBuffer
  } = params;

  try {
    const smtpConfig = await getSmtpConfig();
    
    // Validate SMTP configuration
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass || !smtpConfig.fromEmail) {
      throw new Error("Configuración SMTP incompleta. Por favor configura el correo en el panel de administración.");
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth,
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to: smtpConfig.recipientEmail, // Send to configured recipient
      cc: customerEmail && customerEmail !== 'sin-email@example.com' ? customerEmail : undefined, // Copy to customer if they have email
      subject: `Nuevo Pedido - ${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Nuevo Pedido Recibido</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Número de Pedido:</strong> ${orderNumber}</p>
            <p><strong>Cliente:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
            <p><strong>Total:</strong> $${parseFloat(total).toFixed(2)}</p>
          </div>

          <p>Se adjuntan los detalles del pedido en formato PDF y Excel.</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              Este es un correo automático generado por ${smtpConfig.fromName}.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Pedido_${orderNumber}.pdf`,
          content: pdfBuffer,
        },
        {
          filename: `Pedido_${orderNumber}.xlsx`,
          content: excelBuffer,
        }
      ]
    });

    console.log(`✅ Order email sent for ${orderNumber}`, info.messageId);
  } catch (error) {
    console.error(`❌ Failed to send order email for ${orderNumber}:`, error);
    throw error;
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfig(): Promise<boolean> {
  try {
    const smtpConfig = await getSmtpConfig();
    
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass || !smtpConfig.fromEmail) {
      console.error('❌ SMTP configuration incomplete');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth,
    });

    const info = await transporter.sendMail({
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to: smtpConfig.recipientEmail,
      subject: 'Test - Configuración de Email',
      html: '<p>Este es un correo de prueba. La configuración está funcionando correctamente.</p>'
    });

    console.log('✅ Email test successful', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email test error:', error);
    return false;
  }
}

