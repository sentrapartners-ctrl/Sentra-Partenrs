# Sistema de Licenciamento dos EAs

## 🔐 Como Funciona

Todos os EAs agora possuem um sistema de licenciamento simples baseado em:

1. **Data de Expiração** - Definida no código
2. **Contas Permitidas** - Lista de números de conta autorizados

## 📝 Configuração

### **Para permitir TODAS as contas:**

Abra o arquivo `.mq4` ou `.mq5` no MetaEditor e localize:

```mql4
#define LICENSE_EXPIRY_DATE D'2025.12.31 23:59:59'  // Data de expiração
#define ALLOWED_ACCOUNTS ""  // Deixe vazio para permitir todas
```

### **Para permitir apenas contas específicas:**

```mql4
#define LICENSE_EXPIRY_DATE D'2026.12.31 23:59:59'
#define ALLOWED_ACCOUNTS "12345,67890,11111"  // Números das contas separados por vírgula
```

### **Para alterar a data de expiração:**

```mql4
#define LICENSE_EXPIRY_DATE D'2026.06.30 23:59:59'  // Formato: YYYY.MM.DD HH:MM:SS
```

## 🔧 Como Aplicar

1. Abra o arquivo no **MetaEditor** (F4 no MT4/MT5)
2. Localize as linhas com `LICENSE_EXPIRY_DATE` e `ALLOWED_ACCOUNTS` (linhas 14-15)
3. Altere conforme necessário
4. **Compile** o EA (F7)
5. O arquivo `.ex4` ou `.ex5` gerado terá as novas configurações

## ✅ Validação

Quando o EA inicia, ele verifica:

1. ✅ Se a data atual é menor que `LICENSE_EXPIRY_DATE`
2. ✅ Se a conta está na lista `ALLOWED_ACCOUNTS` (ou se a lista está vazia)

Se qualquer validação falhar, o EA mostra:

```
❌ LICENÇA INVÁLIDA!
❌ EA bloqueado: Licença inválida ou expirada.
```

Se tudo estiver OK:

```
✅ Licença válida até: 2025.12.31 23:59:59
✅ Todas as contas permitidas
```

ou

```
✅ Licença válida até: 2025.12.31 23:59:59
✅ Conta autorizada: 12345
```

## 📋 Exemplos

### **Exemplo 1: Licença vitalícia para todas as contas**

```mql4
#define LICENSE_EXPIRY_DATE D'2099.12.31 23:59:59'
#define ALLOWED_ACCOUNTS ""
```

### **Exemplo 2: Licença de 1 mês para conta específica**

```mql4
#define LICENSE_EXPIRY_DATE D'2025.11.30 23:59:59'
#define ALLOWED_ACCOUNTS "123456"
```

### **Exemplo 3: Licença de 1 ano para múltiplas contas**

```mql4
#define LICENSE_EXPIRY_DATE D'2026.10.30 23:59:59'
#define ALLOWED_ACCOUNTS "123456,789012,345678"
```

## 🎯 Distribuição

Quando você compilar o EA com as configurações desejadas:

1. O arquivo compilado (`.ex4` ou `.ex5`) terá as restrições **hardcoded**
2. O usuário **não pode** alterar a licença sem o código-fonte
3. Você pode distribuir apenas o `.ex4`/`.ex5` sem o `.mq4`/`.mq5`

## ⚠️ Importante

- As configurações são aplicadas **no momento da compilação**
- Cada cliente precisa de um EA compilado especificamente para ele (se usar contas específicas)
- A data de expiração é verificada usando o horário do servidor MT4/MT5
- Não há validação online - tudo é local

## 📦 Arquivos Incluídos

- `SentraPartners_MT4.mq4` - Conector MT4
- `SentraPartners_MT5.mq5` - Conector MT5
- `SentraPartners_Master_MT4.mq4` - Copy Trading Master MT4
- `SentraPartners_Master_MT5.mq5` - Copy Trading Master MT5
- `SentraPartners_Slave_MT4.mq4` - Copy Trading Slave MT4
- `SentraPartners_Slave_MT5.mq5` - Copy Trading Slave MT5

Todos com sistema de licenciamento implementado!
