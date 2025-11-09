import { Resend } from 'resend';

const resend = new Resend('re_GthM8i3z_M9asmomfM1pedXoyNigHLzLp');

async function testEmail() {
  console.log('🧪 Testing email configuration...');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Manus Store <onboarding@resend.dev>',
      to: ['ikampedidos@gmail.com', 'ikamcorreo@gmail.com'],
      subject: 'Test - Sistema de Pedidos',
      html: '<h1>Prueba de Correo</h1><p>Este es un correo de prueba del sistema de pedidos de Manus Store.</p>'
    });

    if (error) {
      console.error('❌ Error al enviar correo:', error);
      return;
    }

    console.log('✅ Correo enviado exitosamente!');
    console.log('📧 ID:', data.id);
    console.log('📬 Destinatarios: ikampedidos@gmail.com, ikamcorreo@gmail.com');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testEmail();

