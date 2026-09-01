const layout = ({ title, greeting, body, button, rights }) => `
<table width="100%" cellspacing="0" cellpadding="0" style="background:#DEE9F0;padding:30px 0;font-family:Arial,sans-serif"><tr><td align="center">
<table width="600" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:16px;overflow:hidden"><tr><td align="center" style="background:#ACC4D7;padding:30px"><img src="https://kineticsolutions.s3.sa-east-1.amazonaws.com/logo.png" alt="KSI - Kinetic Solutions" width="200" style="display:block" /></td></tr>
<tr><td align="center" style="padding:40px 30px 30px;color:#444;font-size:15px;line-height:1.6"><h2 style="color:#17517E;margin:0;font-size:20px">${title}</h2><p>${greeting}</p><p>${body}</p></td></tr>
<tr><td align="center" style="padding:0 20px 30px"><a href="https://kineticsolutions.com.br" style="display:inline-block;background:#101010;color:#F8F8F8;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:30px;font-size:14px">${button}</a></td></tr>
<tr><td align="center" style="background:#f4f8fc;padding:20px;font-size:12px;color:#666;border-top:1px solid #dce6f7">© {{year}} KSI. ${rights}</td></tr></table>
</td></tr></table>`;

module.exports = {
  'pt-BR': layout({ title: 'Obrigado pelo seu contato!', greeting: 'Olá, {{name}}!', body: 'Recebemos sua mensagem e nossa equipe já está analisando a sua solicitação. Retornaremos em breve com mais informações.', button: 'VISITAR SITE', rights: 'Todos os direitos reservados.' }),
  en: layout({ title: 'Thank you for contacting us!', greeting: 'Hello, {{name}}!', body: 'We received your message and our team is already reviewing your request. We will get back to you shortly with more information.', button: 'VISIT WEBSITE', rights: 'All rights reserved.' }),
  es: layout({ title: '¡Gracias por contactarnos!', greeting: '¡Hola, {{name}}!', body: 'Recibimos tu mensaje y nuestro equipo ya está analizando tu solicitud. Nos pondremos en contacto pronto con más información.', button: 'VISITAR SITIO', rights: 'Todos los derechos reservados.' })
};
