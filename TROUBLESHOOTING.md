# Troubleshooting - Sentra Partners

## Problema Atual: Login não está funcionando

### Sintomas
- Usuário preenche email e senha
- Clica em "Entrar"
- Nada acontece (não redireciona, não mostra erro)
- Console do navegador não mostra erros

### Investigação Realizada

1. ✅ **Backend implementado corretamente:**
   - `server/auth.ts` com funções de registro, login, hash de senhas
   - `server/routers.ts` com endpoints `auth.register` e `auth.login`
   - `server/_core/context.ts` atualizado para verificar JWT

2. ✅ **Frontend implementado:**
   - `client/src/pages/Login.tsx` com formulário de login/registro
   - `client/src/_core/hooks/useAuth.ts` funcionando
   - Rotas protegidas em `App.tsx`

3. ✅ **Build realizado:**
   - `pnpm run build` executado com sucesso
   - Servidor rodando em porta 3002

### Possíveis Causas

1. **tRPC não está fazendo a requisição:**
   - O cliente tRPC pode não estar configurado corretamente
   - Verificar `client/src/lib/trpc.ts`

2. **Formato de requisição incorreto:**
   - tRPC usa formato específico para mutations
   - Testar manualmente: `curl -X POST "http://localhost:3002/api/trpc/auth.login?batch=1" -H "Content-Type: application/json" -d '{"0":{"json":{"email":"test@test.com","password":"senha123"}}}'`

3. **Cookie não está sendo setado:**
   - Verificar se `ctx.res.cookie()` está funcionando
   - Verificar configuração de cookies em produção

### Próximos Passos

1. **Adicionar logs no frontend:**
   ```typescript
   const loginMutation = trpc.auth.login.useMutation({
     onSuccess: (data) => {
       console.log('[Login] Success:', data);
       window.location.href = "/";
     },
     onError: (err) => {
       console.error('[Login] Error:', err);
       setError(err.message);
     },
   });
   ```

2. **Adicionar logs no backend:**
   ```typescript
   login: publicProcedure
     .input(z.object({
       email: z.string().email(),
       password: z.string(),
     }))
     .mutation(async ({ input, ctx }) => {
       console.log('[Auth] Login attempt:', input.email);
       const result = await loginUser(input.email, input.password);
       console.log('[Auth] Login result:', result.success);
       // ...
     }),
   ```

3. **Testar criação de usuário via API:**
   ```bash
   curl -X POST "http://localhost:3002/api/trpc/auth.register?batch=1" \
     -H "Content-Type: application/json" \
     -d '{"0":{"json":{"email":"test@test.com","password":"senha123","name":"Test"}}}'
   ```

4. **Verificar Network tab no DevTools:**
   - Abrir DevTools > Network
   - Tentar fazer login
   - Verificar se há requisição para `/api/trpc/auth.login`
   - Ver status code e resposta

## Área de Admin

### Implementado

1. ✅ **Página Admin:**
   - `/client/src/pages/Admin.tsx`
   - Tabs: Usuários, Contas, Sistema
   - Proteção: apenas role="admin" pode acessar

2. ✅ **Rotas Admin no backend:**
   - `admin.listUsers` - lista todos os usuários
   - `admin.listAllAccounts` - lista todas as contas
   - `admin.getSystemStats` - estatísticas do sistema
   - `admin.toggleUserStatus` - ativar/desativar usuário

3. ✅ **Menu Admin:**
   - Item "Admin" aparece apenas para usuários com role="admin"
   - Ícone Shield

4. ✅ **Funções no banco:**
   - `getAllUsers()`
   - `getAllAccounts()`
   - `getSystemStats()`
   - `updateUserStatus()`

### Como Tornar Usuário Admin

Opção 1 - Script:
```bash
cd /home/ubuntu/sentra_partners
pnpm exec tsx make-admin.ts email@usuario.com
```

Opção 2 - Banco de dados direto:
```sql
UPDATE users SET role = 'admin' WHERE email = 'seu@email.com';
```

## Sistema Multi-Usuário

### Como Funciona

1. **Registro:**
   - Usuário cria conta com email/senha
   - Senha é hashada com bcrypt
   - Role padrão: "user"

2. **Login:**
   - Verifica email e senha
   - Cria token JWT (válido por 7 dias)
   - Seta cookie HTTP-only

3. **Conectores MT4/MT5:**
   - EA envia `user_email` no heartbeat
   - Backend busca usuário pelo email
   - Associa conta ao userId encontrado
   - Se email não existe: retorna erro 404

4. **Isolamento:**
   - Todas as queries filtram por `userId`
   - Cada usuário vê apenas suas contas
   - Zero conflito entre usuários

## URLs de Teste

- **Sistema:** https://3002-ifwc82p1opsn7k50rvu6f-137bd2b3.manusvm.computer
- **Login:** https://3002-ifwc82p1opsn7k50rvu6f-137bd2b3.manusvm.computer/login
- **Admin:** https://3002-ifwc82p1opsn7k50rvu6f-137bd2b3.manusvm.computer/admin

## Credenciais de Teste

Criar primeiro usuário:
- Email: admin@sentra.com
- Senha: admin123
- Depois tornar admin com script

## Logs

- Servidor: `/tmp/server-final.log`
- Verificar: `tail -f /tmp/server-final.log`

