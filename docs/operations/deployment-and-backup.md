# FitFlow — Manual de Operações, Deploy e Procedimentos de Backup

## 1. Visão Geral de Infraestrutura e Arquitetura

O **FitFlow** opera sob uma arquitetura SaaS multi-tenant em nuvem, garantindo isolamento lógico estrito entre inquilinos (*tenants*) no banco de dados e no runtime:

- **Frontend & API Gateway:** Vercel (Next.js 15 App Router, React 19 Server Components e Server Actions).
- **Banco de Dados Relacional:** Neon Serverless PostgreSQL 17 (com pooling PgBouncer para conexões de curta duração e conexão direta `DIRECT_URL` para migrações DDL do Prisma).
- **Ambiente Local / Testes:** PostgreSQL 17 em contêiner Docker isolado (`fitflow-db` em `127.0.0.1:54329`) com dois bancos segregados: `fitflow_dev` (desenvolvimento) e `fitflow_test` (testes automatizados de integração com truncamento seguro).
- **Autenticação & Sessões:** Auth.js v5 (JWT criptografado com `AUTH_SECRET`, bcrypt cost 12 para credenciais, tokens de verificação com hash SHA-256 de uso único).
- **Armazenamento de Mídia:** Cloudflare R2 / URLs HTTPS seguras de streaming e diagramas vetoriais auto-hospedados (`/images/exercises/`).

---

## 2. Variáveis de Ambiente Obrigatórias em Produção

| Variável | Descrição | Exemplo / Formato |
|---|---|---|
| `DATABASE_URL` | URL de conexão com pooling (PgBouncer) | `postgresql://user:pass@ep-xyz-pooler.neon.tech/fitflow?sslmode=require` |
| `DIRECT_URL` | URL de conexão direta para DDL/migrações | `postgresql://user:pass@ep-xyz.neon.tech/fitflow?sslmode=require` |
| `AUTH_SECRET` | Chave simétrica de 256 bits para cookies/JWT | String de 32+ bytes aleatórios gerados via `crypto.randomBytes(32)` |
| `AUTH_URL` | URL canônica do app para Auth.js | `https://app.fitflow.com.br` |
| `NEXT_PUBLIC_APP_URL` | URL pública base usada nos e-mails de convite | `https://app.fitflow.com.br` |
| `RESEND_API_KEY` | Chave de envio transacional de e-mails | `re_123456789...` (opcional; sem chave registra em log/outbox) |
| `NODE_ENV` | Modo de execução do Node.js | `production` |

---

## 3. Pipeline de Deploy Contínuo (CI/CD)

### 3.1. Pré-Requisitos de Validação
Nenhum artefato deve ser promovido para produção sem aprovação nos 4 gates de qualidade:

```bash
# 1. Linting estrito sem avisos ou erros
npm run lint

# 2. Suíte de testes unitários e de integração multi-tenant
npm run test

# 3. Suíte de testes End-to-End (Playwright)
npm run test:e2e

# 4. Compilação e tipagem estrita de produção do Next.js
npm run build
```

### 3.2. Procedimento de Migração de Banco de Dados
No Vercel ou na pipeline de CI/CD, o comando de build deve executar migrações DDL pendentes através do Prisma:

```bash
npx prisma migrate deploy
```

---

## 4. Política de Backup e Recuperação de Desastres (DR)

### 4.1. Point-in-Time Restore (PITR) — Neon PostgreSQL
- O Neon mantém histórico contínuo de WAL (Write-Ahead Logging), permitindo restaurar o banco de dados para qualquer segundo específico nos últimos 7 a 30 dias (conforme o plano contratado).
- Para criar um clone instantâneo a partir de um ponto no tempo:
  ```bash
  neon branches create --name restore-emergency --timestamp "2026-11-10T14:30:00Z"
  ```

### 4.2. Backup Lógico Automatizado (`pg_dump`)
Além do PITR, backups lógicos diários são gerados e armazenados em bucket seguro (Cloudflare R2 ou AWS S3 com retenção imutável de 90 dias):

```bash
# Dump diário compactado
pg_dump "$DIRECT_URL" --format=custom --no-owner --no-privileges --file=fitflow_backup_$(date +%Y%m%d_%H%M%S).dump

# Procedimento de restauração em ambiente de contingência
pg_restore --clean --if-exists --no-owner -d "$NEW_DATABASE_URL" fitflow_backup_XXXXX.dump
```

---

## 5. Auditoria de Segurança, LGPD e Conformidade

1. **Isolamento de Tenants:** Todas as consultas no banco de dados passam pelo `TenantContext` resolvido no servidor a partir da sessão (`WHERE tenantId = ctx.tenantId`). Tentativas de manipulação de ID (*IDOR*) disparam `NotFoundError` sem revelar a existência do recurso.
2. **Dados de Saúde & Anamnese:** Restrições e observações de saúde de alunos são armazenadas de forma criptografada em trânsito (TLS 1.3) e em repouso (AES-256), acessíveis apenas ao aluno e ao treinador responsável.
3. **Trilha de Auditoria:** A tabela `audit_logs` registra operações críticas (`EXERCISE_CREATED`, `PROGRAM_VERSION_PUBLISHED`, `WORKOUT_SESSION_COMPLETED`, `PHYSICAL_ASSESSMENT_RECORDED`), gravando `tenantId`, `userId`, IP e timestamp para conformidade legal.
4. **Proteção contra Força Bruta:** Rate-limiting atômico em PostgreSQL (`rate_limits`) bloqueia tentativas abusivas em rotas de login (máximo de 5 tentativas com bloqueio temporário), recuperação de senha e emissão de convites.
