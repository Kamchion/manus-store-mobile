import { Resend } from 'resend';

const resend = new Resend('re_GthM8i3z_M9asmomfM1pedXoyNigHLzLp');

async function testEmail() {
  console.log('🧪 Testing email with verified address...');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Manus Store <onboarding@resend.dev>',
      to: ['chjulio79@gmail.com'],
      subject: 'Test - Sistema de Pedidos Manus Store',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #2563eb;">✅ Sistema de Correos Configurado</h2>
          <p>Este es un correo de prueba del sistema de pedidos.</p>
          <p><strong>Configuración actual:</strong></p>
          <ul>
            <li>Destinatario temporal: chjulio79@gmail.com</li>
            <li>Servicio: Resend</li>
            <li>Estado: Funcionando ✅</li>
          </ul>
          <p>Cuando se cree un pedido, recibirás un correo con PDF y Excel adjuntos.</p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Correo enviado exitosamente!');
    console.log('📧 ID:', data.id);
    console.log('📬 Revisa tu correo: chjulio79@gmail.com');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testEmail();
