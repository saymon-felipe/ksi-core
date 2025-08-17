let year = new Date().getFullYear();

let template = `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="background-color:#DEE9F0; padding:30px 0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.12);">
                <tr>
                    <td align="center" style="background: linear-gradient(to top, #E4ECF2, #ACC4D7); padding:30px;">
                    <img src="https://kineticsolutions.s3.sa-east-1.amazonaws.com/logo.png" alt="KSI - Kinetic Solutions" width="200" style="display:block; margin: 10px auto;" />
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding:40px 30px 30px 30px;">
                    <h2 style="color:#17517E; margin:0; font-size:20px; font-weight:bold;">Obrigado pelo seu contato!</h2>
                    <p style="color:#444444; font-size:15px; line-height:1.6; margin:20px 0 0 0;">
                        Agradecemos seu interesse em nossos serviços. <br/>
                        Recebemos a sua mensagem e nossa equipe já está analisando sua solicitação.
                        <br><br>
                        Retornaremos o contato em breve com mais informações.
                    </p>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding:20px;">
                    <a href="https://kineticsolutions.netlify.app" target="_blank" 
                        style="display:inline-block; background:#101010; color:#F8F8F8; text-decoration:none; font-weight:bold; padding:14px 28px; border-radius:30px; font-size:14px; letter-spacing:0.5px;">
                        VISITAR SITE
                    </a>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="background-color:#f4f8fc; padding:20px; font-size:12px; color:#666666; border-top:1px solid #dce6f7;">
                    © ${year} KSI. Todos os direitos reservados.
                    </td>
                </tr>
                </table>
            </td>
        </tr>
    </table>
`;

module.exports = template;