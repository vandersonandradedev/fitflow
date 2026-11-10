# Inventário de Skills — FitFlow

Este documento registra o inventário de skills inspecionadas, instaladas e verificadas no ambiente para o desenvolvimento do SaaS **FitFlow**, em conformidade com as diretrizes do projeto e boas práticas de engenharia de software.

---

## 1. Status Geral das Skills

Todas as skills recomendadas foram inspecionadas, instaladas a partir de fontes verificadas e integradas ao diretório de skills do projeto (`.agents/skills/`).

| Categoria | Nome da Skill | Origem / Repositório | Status | Aplicabilidade no FitFlow |
|---|---|---|---|---|
| **Design & Frontend** | `frontend-design` | `anthropics/skills` | **Instalada e Verificada** | Guia de identidade visual autêntica, paleta premium sem clichês de IA, tipografia intencional e micro-interações. |
| **Performance React/Next** | `vercel-react-best-practices` | `vercel-labs/agent-skills` | **Instalada e Verificada** | 70 regras oficiais da Vercel para App Router: eliminação de waterfalls, otimização de bundle, SSR/RSC e memoização. |
| **Banco de Dados** | `neon-postgres` | `neondatabase/agent-skills` | **Instalada e Verificada** | Configuração do Neon PostgreSQL, connection pooling (`-pooler`) para runtime e direct (`DIRECT_URL`) para migrations Prisma. |
| **Banco de Dados** | `sql-optimization` | `github/awesome-copilot` | **Instalada e Verificada** | Otimização de consultas multi-tenant, estratégias de índices compostos `(tenant_id, ...)`, paginação cursor-based e explain plans. |
| **Segurança & Hardening** | `security-and-hardening` | `addyosmani/agent-skills` | **Instalada e Verificada** | Modelagem STRIDE, proteção contra OWASP Top 10, isolamento rigoroso de tenants, prevenção de IDOR e conformidade LGPD. |
| **Testes & Automação** | `playwright-cli` | `microsoft/playwright-cli` | **Instalada e Verificada** | Automação E2E via CLI, testes de fluxo completo de execução de treino e validação entre navegadores. |
| **Testes & Automação** | `webapp-testing` | `anthropics/skills` | **Instalada e Verificada** | Metodologia de testes de aplicações web, cobertura de fluxos críticos de autorização, regressão e estados de UI. |
| **Qualidade de Código** | `code-review-and-quality` | `addyosmani/agent-skills` | **Instalada e Verificada** | Checklist de revisão em 5 eixos (Correção, Legibilidade, Arquitetura, Segurança e Performance) antes de cada entrega de fase. |

---

## 2. Detalhamento e Protocolos de Uso por Skill

### 2.1. `frontend-design`
- **Diretório:** `.agents/skills/frontend-design/SKILL.md`
- **Diretrizes principais:**
  - Evitar clichês visuais de IA (gradientes roxo/azul genéricos, bordas excessivamente arredondadas sem hierarquia, sombras difusas sem critério, textos all-caps genéricos).
  - Construir paleta escura baseada em grafite profundo (`#0A0D12` / `#11141B`) com superfícies de alto contraste e cor de destaque funcional (verde-esmeralda/limão esportivo `#10B981` / `#84CC16`).
  - Estabelecer tipografia escalonada e legível tanto em desktop (visão de alta densidade do treinador) quanto em mobile (visão ergonômica de toque para o aluno em academia).

### 2.2. `vercel-react-best-practices`
- **Diretório:** `.agents/skills/vercel-react-best-practices/SKILL.md`
- **Diretrizes principais:**
  - **Eliminação de Waterfalls:** Utilizar `Promise.all()` para operações de leitura independentes; manter `Suspense` em torno de seções demoradas.
  - **Bundle Size:** Importações diretas de ícones e utilitários (evitar barrel imports massivos que degradem o cold start).
  - **RSC Boundaries:** Componentes de servidor como padrão; Client Components (`"use client"`) restritos a nós interativos (ex: cronômetro, drag and drop, inputs de carga).
  - **Server Actions:** Autenticação e validação Zod no topo de cada Server Action.

### 2.3. `neon-postgres` & `sql-optimization`
- **Diretórios:** `.agents/skills/neon-postgres/SKILL.md` e `.agents/skills/sql-optimization/SKILL.md`
- **Diretrizes principais:**
  - **Dual Connection Pooling:** Uso de conexão com pooling (`DATABASE_URL`) para as rotas e Server Actions em ambiente serverless, e conexão direta sem pooler (`DIRECT_URL`) para migrações Prisma CLI.
  - **Branching:** Aproveitar branching instantâneo do Neon para testes de migrações complexas antes do deploy.
  - **Indexação Multi-Tenant:** Toda tabela contendo `tenant_id` possui índice B-Tree composto iniciando por `tenant_id` (ex: `(tenant_id, student_id)`, `(tenant_id, status)`), permitindo index scan direto e eliminando full table scans.

### 2.4. `security-and-hardening`
- **Diretório:** `.agents/skills/security-and-hardening/SKILL.md`
- **Diretrizes principais:**
  - Nunca confiar em `tenant_id` ou `user_id` vindo do corpo da requisição ou parâmetros de URL.
  - O contexto do tenant é extraído exclusivamente da sessão criptografada validada no backend.
  - Cookies de autenticação com flags `HttpOnly`, `Secure`, `SameSite=Lax`, e rotação de tokens.
  - Sanitização rigorosa e validação de esquemas com Zod na fronteira de entrada.

### 2.5. `webapp-testing`, `playwright-cli` & `code-review-and-quality`
- **Diretórios:** `.agents/skills/webapp-testing/`, `.agents/skills/playwright-cli/`, `.agents/skills/code-review-and-quality/`
- **Diretrizes principais:**
  - Testes unitários com Vitest para regras de negócio (cálculo de carga, volume, versionamento de programas).
  - Testes de isolamento multi-tenant (tentativa do Personal A acessar dados de Personal B deve resultar em 403/404).
  - Testes E2E com Playwright cobrindo o ciclo de vida completo: criação de treino pelo personal -> login do aluno -> execução com cronômetro -> finalização com persistência de séries.
  - Gates de qualidade: nenhuma fase será considerada pronta sem verificação dos 5 eixos de qualidade.

---

## 3. Verificação de Integridade

- Comando executado para inventário: `npx skills ls`
- Repositórios verificados contra vulnerabilidades conhecidas (Socket / Snyk: Low Risk / Safe).
- Documento atualizado em: 10/11/2026.
