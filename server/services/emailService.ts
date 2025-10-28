import nodemailer from "nodemailer";

// Configure email transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "sentrapartners@gmail.com",
    pass: process.env.SMTP_PASS || "",
  },
});

export interface SendEAEmailParams {
  to: string;
  eaName: string;
  accountNumber: string;
  expiryDate: Date;
  downloadUrl?: string;
  attachmentPath?: string;
}

/**
 * Send EA delivery email
 */
export async function sendEADeliveryEmail(params: SendEAEmailParams): Promise<void> {
  const { to, eaName, accountNumber, expiryDate, downloadUrl, attachmentPath } = params;
  
  const subject = `Seu Expert Advisor - ${eaName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Seu EA está pronto!</h1>
          <p>Obrigado por sua compra</p>
        </div>
        <div class="content">
          <p>Olá,</p>
          <p>Seu Expert Advisor foi compilado e está pronto para uso!</p>
          
          <div class="info-box">
            <h3>📋 Detalhes do EA</h3>
            <p><strong>Nome:</strong> ${eaName}</p>
            <p><strong>Conta MT4/MT5:</strong> ${accountNumber}</p>
            <p><strong>Validade:</strong> ${expiryDate.toLocaleDateString("pt-BR")}</p>
          </div>
          
          ${downloadUrl ? `
            <div style="text-align: center;">
              <a href="${downloadUrl}" class="button">📥 Baixar EA</a>
            </div>
          ` : `
            <p><strong>O EA está anexado neste email.</strong></p>
          `}
          
          <div class="info-box">
            <h3>📖 Como Instalar</h3>
            <ol>
              <li>Baixe o arquivo .ex4 ou .ex5</li>
              <li>Copie para a pasta <code>MQL4/Experts</code> ou <code>MQL5/Experts</code></li>
              <li>Reinicie o MetaTrader</li>
              <li>Arraste o EA para um gráfico</li>
              <li>Ative o AutoTrading</li>
            </ol>
          </div>
          
          <p><strong>⚠️ Importante:</strong> Este EA está vinculado à conta <strong>${accountNumber}</strong> e expira em <strong>${expiryDate.toLocaleDateString("pt-BR")}</strong>.</p>
          
          <p>Se tiver dúvidas, entre em contato com nosso suporte.</p>
          
          <div class="footer">
            <p>Sentra Partners © 2025</p>
            <p>sentrapartners@gmail.com</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const mailOptions: any = {
    from: `"Sentra Partners" <${process.env.SMTP_USER || "sentrapartners@gmail.com"}>`,
    to,
    subject,
    html,
  };
  
  // Attach EA file if provided
  if (attachmentPath) {
    mailOptions.attachments = [
      {
        filename: path.basename(attachmentPath),
        path: attachmentPath,
      },
    ];
  }
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] EA delivery email sent to ${to}`);
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    throw error;
  }
}

import path from "path";

