# Arquitetura do Sistema — FitFlow

## 1. Visão Geral da Arquitetura

O **FitFlow** é estruturado como uma aplicação SaaS moderna, monolítica modular e distribuída em nuvem, baseada no framework **Next.js (App Router)** com **TypeScript Strict**, banco de dados relacional **PostgreSQL (Neon Serverless)** e armazenamento de objetos **Cloudflare R2**.

A arquitetura prioriza:
1. **Isolamento Multi-Tenant Estrito** em nível lógico e operacional.
2. **Alta Performance com Server Components** (RSC), eliminando waterfalls de requisição e minimizando o tráfego de JavaScript para o navegador.
3. **Desacoplamento de Camadas**, separando a interface React da lógica de domínio e das consultas ao banco de dados.
4. **Resiliência Mobile-First para o Aluno**, garantindo execução contínua de treinos sem interrupções.

---

## 2. Diagrama de Arquitetura de Alto Nível

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENTES (DISPOSITIVOS)                       │
├───────────────────────────────────┬────────────────────────────────────┤
│       Portal do Treinador         │          Portal do Aluno           │
│    (Desktop / Tablet / Notebook)  │      (Mobile-First / PWA)          │
│   - Gestão de Alunos & Prescrição │     - Execução & Registro          │
└─────────────────┬─────────────────┴──────────────────┬─────────────────┘
                  │ HTTPS / TLS 1.3                    │ HTTPS / TLS 1.3
                  ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        VERCEL EDGE & CLOUD NETWORK                     │
│  - Edge Middleware: Roteamento de rotas, verificação de JWT/Cookie     │
│  - Segurança: Headers CSP, HSTS, X-Content-Type-Options, Anti-CSRF     │
└───────────────────────────────────┬────────────────────────────────────┤
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   NEXT.JS APP ROUTER (FULL-STACK HOST)                 │
│                                                                        │
│  ┌────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │    Rotas de UI (RSC)   │  │        Rotas de API / Actions        │  │
│  │  - app/(coach)/*       │  │  - app/api/auth/[...nextauth]        │  │
│  │  - app/(student)/*     │  │  - app/api/upload/*                  │  │
│  │  - app/(auth)/*        │  │  - Server Actions (Módulos)          │  │
│  └───────────┬────────────┘  └──────────────────┬───────────────────┘  │
│              │                                  │                      │
│              └─────────────────┬────────────────┘                      │
│                                │ Contexto de Sessão Autenticada        │
│                                ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              CAMADA DE SEGURANÇA E MULTI-TENANCY                 │  │
│  │  - TenantContextResolver (extrai tenantId de sessão segura)      │  │
│  │  - AuthorizationGuard (validação de papéis: COACH vs STUDENT)   │  │
│  │  - IDORInterceptor (bloqueia IDs cruzados entre tenants)         │  │
│  └─────────────────────────────┬────────────────────────────────────┘  │
│                                │ Contexto Validado (tenantId, userId)  │
│                                ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     SERVIÇOS DE DOMÍNIO                          │  │
│  │  - StudentService         - ProgramPrescriptionService           │  │
│  │  - ExerciseCatalogService - WorkoutExecutionService              │  │
│  │  - AnalyticsService       - NotificationService                  │  │
│  └─────────────────────────────┬────────────────────────────────────┘  │
│                                │                                       │
│                                ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                CAMADA DE ACESSO A DADOS (DAL)                    │  │
│  │  - Prisma Client com Extensão de Multi-Tenant Enforced          │  │
│  │  - Validação de Esquema Zod                                      │  │
│  └─────────────────────────────┬────────────────────────────────────┘  │
└────────────────────────────────┼───────────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
┌────────────────────────────────┐ ┌────────────────────────────────────┐
│      NEON POSTGRESQL (DB)      │ │        CLOUDFLARE R2 (S3)          │
│  - Pooling Serverless          │ │  - Vídeos demonstrativos de treinos│
│  - Índices Compostos Multi-Ten │ │  - Fotos de perfil e mídias        │
│  - Migrations Versionadas      │ │  - Uploads via Pre-Signed URLs     │
└────────────────────────────────┘ └────────────────────────────────────┘
```

---

## 3. Modelo Multi-Tenant em Camadas (Defense-in-Depth)

No FitFlow, cada personal trainer é uma organização independente (Tenant). Para assegurar isolamento absoluto e impedir vazamentos de dados ou ataques IDOR (Insecure Direct Object Reference), a aplicação adota uma estratégia de proteção em quatro camadas:

### 3.1. Camada 1: Identidade e Sessão Criptografada
- O `tenant_id` nunca é aceito a partir de parâmetros enviados pelo cliente (query string, body JSON ou headers livres).
- A identificação do usuário e seu vínculo com o tenant são resolvidos exclusivamente a partir da sessão criptografada decodificada no servidor (`auth()`).
- O usuário possui uma relação de membro (`tenant_members`) que define sua role (`OWNER` / `COACH` para o personal, `STUDENT` para o aluno).

### 3.2. Camada 2: Guardião Centralizado de Autorização
Antes de executar qualquer operação de leitura ou escrita, os Domain Services acionam o utilitário de segurança:

```typescript
// Exemplo conceitual do guardião de autorização
export async function getAuthorizedTenantContext() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError("Sessão não autenticada.");
  }

  const membership = await getTenantMember(session.user.id);
  if (!membership) {
    throw new ForbiddenError("Usuário não associado a nenhum tenant ativo.");
  }

  return {
    userId: session.user.id,
    tenantId: membership.tenantId,
    role: membership.role,
  };
}
```

### 3.3. Camada 3: Data Access Layer (DAL) com Escopo de Tenant Obrigatório
Todas as consultas ao Prisma exigem a passagem explícita do `tenantId`. Consultas que buscam itens específicos por ID devem obrigatoriamente combinar o ID do recurso com o `tenantId`:

```typescript
// Padrão obrigatório de consulta:
const student = await prisma.studentProfile.findFirst({
  where: {
    id: studentId,
    tenantId: ctx.tenantId, // Obrigatório: impede IDOR mesmo que studentId seja forjado
  },
});
```

### 3.4. Camada 4: Índices de Banco de Dados Otimizados
Para garantir alta performance e eliminar gargalos ao filtrar milhões de registros por inquilino, todas as tabelas compartilhadas possuem índices compostos iniciando por `tenant_id`:
- `CREATE INDEX idx_students_tenant ON student_profiles(tenant_id, status);`
- `CREATE INDEX idx_workouts_tenant ON training_programs(tenant_id, is_active);`
- `CREATE INDEX idx_sessions_tenant ON workout_sessions(tenant_id, student_id, started_at);`

---

## 4. Estratégia de Versionamento de Treinos

Um problema clássico em softwares de fitness é a mutação destrutiva: o personal edita uma série de 10 para 12 repetições e o histórico de treinos antigos do aluno é alterado indevidamente. O FitFlow resolve isso através do desacoplamento formal entre **Prescrição** e **Execução**:

1. **Entidade de Prescrição (`training_programs` & `training_program_versions`):**
   - Um programa possui versões sequenciais (`v1`, `v2`).
   - Enquanto em status `DRAFT`, o treinador pode alterar livremente.
   - Ao clicar em `PUBLICAR`, a versão atual é congelada como `PUBLISHED` (somente-leitura) e vinculada ao aluno.
   - Qualquer nova alteração cria um clone em `DRAFT` para uma nova versão (`v2`).
2. **Entidade de Execução (`workout_sessions` & `set_logs`):**
   - Cada sessão de treino iniciada pelo aluno referencia o `program_version_id` exato vigente no momento do treino.
   - Cada série realizada (`set_logs`) grava a carga prescrita de referência e os dados reais executados (carga, repetições, timestamp de conclusão, RPE).
   - Se o treinador mudar o programa no futuro, as sessões passadas permanecem 100% íntegras.

---

## 5. Arquitetura de Mídia e Armazenamento (Cloudflare R2)

Para garantir carregamento ultra-rápido de vídeos demonstrativos e fotos sem onerar o servidor Next.js:
1. **Armazenamento de Vídeos e Imagens:** Hospedado no Cloudflare R2 (compatível com S3, sem taxas de saída de dados / egress).
2. **Upload Seguro com Pre-Signed URLs:** O navegador do personal trainer solicita uma URL de upload pré-assinada de curta duração (15 minutos). O upload do arquivo de vídeo ocorre diretamente do navegador para o R2, aliviando o tráfego da API.
3. **Validação de Tipos:** Apenas tipos MIME verificados são autorizados (`image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/webm`) com limite de 100MB por arquivo de vídeo.
4. **Mídia Privada:** Dados de fotos de avaliação física e acompanhamento são servidos exclusivamente através de URLs assinadas temporárias geradas pelo backend após validação de permissão.

---

## 6. Arquitetura PWA e Resiliência Mobile do Aluno

O ambiente de execução do aluno foi projetado especificamente para as condições reais de uma academia:
- **PWA Instalável:** Manifest padronizado (`manifest.json`) com ícones dedicados e modo de exibição `standalone`, permitindo adicionar o FitFlow à tela de início sem passar por app stores.
- **Gerenciamento de Estado Ativo:** Durante o treino, o estado atual (exercício corrente, séries marcadas, cronômetro de descanso em contagem) é sincronizado em `localStorage` a cada clique.
- **Recuperação de Interrupção:** Se o celular desligar, a tela for bloqueada ou a aba for encerrada acidentalmente, ao reabrir a aplicação o aluno visualiza o banner: *"Treino em andamento detectado. Deseja continuar de onde parou?"* restaurando a sessão instantaneamente.

---

## 7. Topologia de Infraestrutura e Implantação

| Componente | Provedor / Serviço | Finalidade Técnica |
|---|---|---|
| **Frontend & API Gateway** | Vercel (Edge + Serverless) | Hospedagem do Next.js App Router, SSR, Server Components e Edge Middleware. |
| **Banco de Dados Relacional** | Neon PostgreSQL | Instância Serverless com autoscaling, conexão via pooling (-pooler) e réplicas de leitura se necessário. |
| **Armazenamento de Objetos** | Cloudflare R2 | Armazenamento de mídia demonstrativa, vídeos de exercícios e fotos de perfil. |
| **Autenticação & Sessão** | Auth.js com Prisma Adapter | Gestão de credenciais, cookies de sessão criptografados e proteção CSRF. |
| **Observabilidade & Logs** | Vercel Analytics + Prisma Audit | Rastreamento de erros, tempo de resposta de queries e auditoria de ações sensíveis. |
