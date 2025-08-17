let year = new Date().getFullYear();

let template = `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="background-color:#DEE9F0; padding:30px 0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.12);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background: linear-gradient(to top, #E4ECF2, #ACC4D7); padding:30px;">
                            <img src="https://kineticsolutions.s3.sa-east-1.amazonaws.com/logo.png" alt="KSI - Kinetic Solutions" width="200" style="display:block; margin: 10px auto;" />
                        </td>
                    </tr>

                    <!-- Mensagem -->
                    <tr>
                        <td align="left" style="padding:40px 30px 20px 30px; color:#444444; font-size:15px; line-height:1.6;">
                            <h2 style="color:#17517E; margin:0; font-size:20px; font-weight:bold; text-align:center;">Novo contato recebido</h2>
                            <p style="margin-top:20px;">
                                Um usuário entrou em contato através do site da <strong>KSI</strong>. Seguem os dados enviados:
                            </p>

                            <table width="100%" border="0" cellspacing="0" cellpadding="8" style="margin-top:10px; border-collapse:collapse; font-size:14px; color:#333;">
                                <tr>
                                    <td width="30%" style="background:#f4f8fc; font-weight:bold; border:1px solid #dce6f7;">Nome</td>
                                    <td style="border:1px solid #dce6f7;">{name}</td>
                                </tr>
                                <tr>
                                    <td style="background:#f4f8fc; font-weight:bold; border:1px solid #dce6f7;">E-mail</td>
                                    <td style="border:1px solid #dce6f7;">{email}</td>
                                </tr>
                                <tr>
                                    <td style="background:#f4f8fc; font-weight:bold; border:1px solid #dce6f7;">Telefone</td>
                                    <td style="border:1px solid #dce6f7;">{tel}</td>
                                </tr>
                                <tr>
                                    <td style="background:#f4f8fc; font-weight:bold; border:1px solid #dce6f7;">Tipo de Solicitação</td>
                                    <td style="border:1px solid #dce6f7;">{requestType}</td>
                                </tr>
                                <tr>
                                    <td style="background:#f4f8fc; font-weight:bold; border:1px solid #dce6f7; max-width: 400px; word-break: break-word;">Observações</td>
                                    <td style="border:1px solid #dce6f7;">{obs}</td>
                                </tr>
                                <tr>
                                    <td style="background:#f4f8fc; font-weight:bold; border:1px solid #dce6f7;">Data</td>
                                    <td style="border:1px solid #dce6f7;">{date}</td>
                                </tr>
                                <tr>
                                    <td style="background:#f4f8fc; font-weight:bold; border:1px solid #dce6f7;">IP</td>
                                    <td style="border:1px solid #dce6f7;">{ip}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Rodapé -->
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