# FitFlow — SaaS Multi-Tenant de Gestão de Personal Trainers e Treinamento Físico

> **Status do Projeto:** Fase 0 (Research, Arquitetura e Planejamento) Concluída com Sucesso. Aguardando autorização para iniciar a Fase 1 (Fundação).

---

## 1. Visão do Produto

O **FitFlow** é uma plataforma SaaS profissional desenvolvida para personal trainers independentes prescreverem treinamentos físicos com agilidade operacional e fornecerem uma experiência de execução intuitiva, mobile-first e confiável para seus alunos na academia.

Diferente de sistemas legados lentos ou aplicativos de demonstração visual, o FitFlow é arquitetado desde a fundação como um sistema de produção:
- **Multi-Tenant Real:** Cada treinador é um inquilino lógico isolado (`tenant`), sem compartilhamento de dados ou riscos de invasão horizontal (IDOR).
- **Separação Rigorosa entre Prescrição e Execução:** Treinos editados no futuro não corrompem o histórico de treinos antigos do aluno através de um mecanismo formal de versionamento de programas.
- **Resiliência Mobile:** Portal do aluno construído como PWA com tolerância a interrupções de conexão e recuperação automática do estado da sessão em andamento.
- **Design System Autêntico:** Paleta profunda em grafite escuro (`#090B0E`), superfícies de alto contraste e acentos em verde esmeralda esportivo (`#10B981`), livre de clichês visuais de IA.

---

## 2. Stack Tecnológica

| Camada | Tecnologia Adotada | Justificativa Técnica |
|---|---|---|
| **Framework Full-Stack** | Next.js (App Router) + React 19 | Server Components (RSC) para eliminação de waterfalls e Server Actions seguras. |
| **Linguagem** | TypeScript (Strict Mode) | Tipagem estrita de ponta a ponta sem permissividade (`noImplicitAny`, schemas Zod sincronizados). |
| **Estilização & UI** | Tailwind CSS + shadcn/ui + Radix UI | Componentes acessíveis, responsividade e tokens semânticos centralizados. |
| **Banco de Dados** | PostgreSQL (Neon Serverless) | Escalabilidade serverless, branching instantâneo para testes e connection pooling. |
| **ORM** | Prisma ORM | Modelagem tipada, migrations declarativas versionadas e extensões de tenant enforcement. |
| **Autenticação & Sessões** | Auth.js (NextAuth) | Sessões criptografadas em cookies HttpOnly, proteção CSRF e tokens de uso único. |
| **Armazenamento de Mídia** | Cloudflare R2 | Armazenamento S3-compatible com zero taxas de egress e upload via Pre-Signed URLs. |
| **Gráficos & Analytics** | Recharts | Renderização de gráficos de sobrecarga progressiva, tonelagem (volume) e aderência. |
| **Testes Automatizados** | Vitest + Playwright | Testes unitários para regras de cálculo/versão e testes E2E para validação de isolamento multi-tenant. |

---

## 3. Índice da Documentação Técnica (Fase 0)

Toda a documentação arquitetural e de engenharia foi formalizada no diretório `docs/`:

- 📊 **[Análise Competitiva e Engenharia Reversa](docs/research/competitive-analysis.md)**: Estudo funcional detalhado de ABC Trainerize, TrueCoach e Everfit; matriz comparativa com as 10 dimensões do projeto; fluxos mapeados; decisões de reprodução, adaptação e descarte.
- 📋 **[Documento de Requisitos de Produto (PRD)](docs/product/product-requirements.md)**: Visão, modelo de negócio no MVP, personas (Lucas e Mariana), requisitos funcionais RF01 a RF09 e requisitos não funcionais.
- 🏛️ **[Visão Geral da Arquitetura do Sistema](docs/architecture/architecture-overview.md)**: Topologia, camadas, isolamento multi-tenant em 4 níveis (Defense-in-Depth), estratégia de versionamento e storage R2.
- 🗄️ **[Modelagem de Banco de Dados](docs/architecture/database-design.md)**: Diagrama ERD em Mermaid, especificação das 26 entidades (identidade, treinos, execução, avaliações, auditoria) e estratégias de indexação SQL.
- 🛡️ **[Modelo de Segurança e Conformidade LGPD](docs/security/security-model.md)**: Análise de ameaças STRIDE, controles contra OWASP Top 10, proteção contra IDOR, gestão de cookies e política LGPD.
- 🎨 **[Design System e Identidade Visual](docs/architecture/design-system.md)**: Paleta de cores, tipografia, regras ergonômicas para academias, layout do Workout Builder e Portal do Aluno.
- 🛠️ **[Inventário de Skills Especializadas](docs/engineering/skills-inventory.md)**: Registro e diretrizes das skills instaladas (`frontend-design`, `vercel-react-best-practices`, `neon-postgres`, `sql-optimization`, `security-and-hardening`, `playwright-cli`, `webapp-testing`, `code-review-and-quality`).
- 🗺️ **[Roadmap de Implementação](docs/engineering/implementation-roadmap.md)**: Cronograma detalhado das Fases 1 a 8, critérios de aceite (DoD) e matriz de riscos.

---

## 4. Skills Integradas ao Ambiente

As seguintes skills foram instaladas no diretório `.agents/skills/` e estão prontas para orientar cada fase da implementação:

1. `frontend-design`: Direção de design autêntico e não-genérico.
2. `vercel-react-best-practices`: 70 regras de otimização de performance para React e Next.js App Router.
3. `neon-postgres`: Gestão de connection pooling, direct URLs para migrations e branching no Neon.
4. `sql-optimization`: Otimização de consultas multi-tenant, índices compostos e paginação rápida.
5. `security-and-hardening`: Modelagem de ameaças e práticas de blindagem contra vulnerabilidades.
6. `playwright-cli`: Automação E2E via CLI para fluxos críticos.
7. `webapp-testing`: Metodologia de testes de regressão e estados de UI.
8. `code-review-and-quality`: Revisão rigorosa de código em 5 eixos antes da aprovação de cada fase.

---

## 5. Próximo Passo: FASE 1 (Fundação)

Aguardando autorização do usuário para iniciar a **Fase 1**, cujas tarefas imediatas são:
1. Inicialização do projeto Next.js App Router com TypeScript estrito.
2. Instalação e configuração do Tailwind CSS com os tokens do Design System.
3. Instalação e configuração do shadcn/ui.
4. Configuração do Prisma ORM conectado ao Neon PostgreSQL.
5. Estruturação dos módulos da aplicação (`/src/modules/*`).
6. Configuração da suíte de testes com Vitest.
