import { router, publicProcedure } from './trpc';
import { z } from 'zod';
import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Configurar transporter de email (usando Gmail como exemplo)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'sentrapartners@gmail.com',
    pass: process.env.EMAIL_PASSWORD || '', // Você precisa configurar isso
  },
});

export const passwordResetRouter = router({
  // Solicitar reset de senha
  requestReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Verificar se usuário existe
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user) {
        // Não revelar se o email existe ou não (segurança)
        return {
          success: true,
          message: 'Se o email existir, você receberá um link de redefinição.',
        };
      }

      // Gerar token único
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hora

      // Salvar token no banco
      await db.execute(`
        INSERT INTO password_reset_tokens (userId, token, expiresAt)
        VALUES (${user.id}, '${token}', '${expiresAt.toISOString().slice(0, 19).replace('T', ' ')}')
      `);

      // Enviar email
      const resetLink = `${process.env.FRONTEND_URL || 'https://sentrapartners.com'}/reset-password?token=${token}`;

      try {
        await transporter.sendMail({
          from: '"Sentra Partners" <sentrapartners@gmail.com>',
          to: input.email,
          subject: 'Redefinir sua senha - Sentra Partners',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Redefinir Senha</h2>
              <p>Olá, ${user.name}!</p>
              <p>Você solicitou a redefinição de senha da sua conta Sentra Partners.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <a href="${resetLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                Redefinir Senha
              </a>
              <p>Ou copie e cole este link no seu navegador:</p>
              <p style="color: #666; font-size: 14px;">${resetLink}</p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Este link expira em 1 hora.<br>
                Se você não solicitou esta redefinição, ignore este email.
              </p>
            </div>
          `,
        });
      } catch (error) {
        console.error('Erro ao enviar email:', error);
        throw new Error('Erro ao enviar email de redefinição');
      }

      return {
        success: true,
        message: 'Email de redefinição enviado com sucesso!',
      };
    }),

  // Validar token
  validateToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      const [tokenData] = await db.execute(`
        SELECT prt.*, u.email, u.name
        FROM password_reset_tokens prt
        JOIN users u ON prt.userId = u.id
        WHERE prt.token = '${input.token}'
          AND prt.used = FALSE
          AND prt.expiresAt > NOW()
        LIMIT 1
      `);

      if (!tokenData) {
        return {
          valid: false,
          message: 'Token inválido ou expirado',
        };
      }

      return {
        valid: true,
        email: (tokenData as any).email,
      };
    }),

  // Redefinir senha
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Validar token
      const [tokenData] = await db.execute(`
        SELECT *
        FROM password_reset_tokens
        WHERE token = '${input.token}'
          AND used = FALSE
          AND expiresAt > NOW()
        LIMIT 1
      `);

      if (!tokenData) {
        throw new Error('Token inválido ou expirado');
      }

      const userId = (tokenData as any).userId;

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      // Atualizar senha
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));

      // Marcar token como usado
      await db.execute(`
        UPDATE password_reset_tokens
        SET used = TRUE
        WHERE token = '${input.token}'
      `);

      return {
        success: true,
        message: 'Senha redefinida com sucesso!',
      };
    }),
});

