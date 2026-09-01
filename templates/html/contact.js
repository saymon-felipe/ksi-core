const layout = ({ title, intro, labels, rights }) => `
<table width="100%" cellspacing="0" cellpadding="0" style="background:#DEE9F0;padding:30px 0;font-family:Arial,sans-serif"><tr><td align="center">
<table width="600" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:16px;overflow:hidden"><tr><td align="center" style="background:#ACC4D7;padding:30px"><img src="https://kineticsolutions.s3.sa-east-1.amazonaws.com/logo.png" alt="KSI - Kinetic Solutions" width="200" style="display:block" /></td></tr>
<tr><td style="padding:40px 30px 20px;color:#444;font-size:15px;line-height:1.6"><h2 style="color:#17517E;text-align:center;margin:0">${title}</h2><p>${intro}</p><table width="100%" cellspacing="0" cellpadding="8" style="border-collapse:collapse;font-size:14px;color:#333">
<tr><td style="background:#f4f8fc;font-weight:bold;border:1px solid #dce6f7">${labels.name}</td><td style="border:1px solid #dce6f7">{{name}}</td></tr>
<tr><td style="background:#f4f8fc;font-weight:bold;border:1px solid #dce6f7">${labels.email}</td><td style="border:1px solid #dce6f7">{{email}}</td></tr>
<tr><td style="background:#f4f8fc;font-weight:bold;border:1px solid #dce6f7">${labels.phone}</td><td style="border:1px solid #dce6f7">{{tel}}</td></tr>
<tr><td style="background:#f4f8fc;font-weight:bold;border:1px solid #dce6f7">${labels.service}</td><td style="border:1px solid #dce6f7">{{requestType}}</td></tr>
<tr><td style="background:#f4f8fc;font-weight:bold;border:1px solid #dce6f7">${labels.message}</td><td style="border:1px solid #dce6f7">{{obs}}</td></tr>
<tr><td style="background:#f4f8fc;font-weight:bold;border:1px solid #dce6f7">${labels.date}</td><td style="border:1px solid #dce6f7">{{date}}</td></tr>
<tr><td style="background:#f4f8fc;font-weight:bold;border:1px solid #dce6f7">IP</td><td style="border:1px solid #dce6f7">{{ip}}</td></tr>
</table></td></tr><tr><td align="center" style="background:#f4f8fc;padding:20px;font-size:12px;color:#666">© {{year}} KSI. ${rights}</td></tr></table>
</td></tr></table>`;

module.exports = {
  'pt-BR': layout({ title: 'Novo contato recebido', intro: 'Um usuário entrou em contato através do site da KSI. Seguem os dados enviados:', labels: { name: 'Nome', email: 'E-mail', phone: 'Telefone', service: 'Tipo de solicitação', message: 'Mensagem', date: 'Data' }, rights: 'Todos os direitos reservados.' }),
  en: layout({ title: 'New contact received', intro: 'A visitor contacted KSI through the website. Here are the submitted details:', labels: { name: 'Name', email: 'Email', phone: 'Phone', service: 'Service requested', message: 'Message', date: 'Date' }, rights: 'All rights reserved.' }),
  es: layout({ title: 'Nuevo contacto recibido', intro: 'Una persona se puso en contacto con KSI a través del sitio web. Estos son los datos enviados:', labels: { name: 'Nombre', email: 'Correo electrónico', phone: 'Teléfono', service: 'Servicio solicitado', message: 'Mensaje', date: 'Fecha' }, rights: 'Todos los derechos reservados.' })
};
