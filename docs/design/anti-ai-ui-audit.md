# Auditoria Visual e Refatoração Anti-AI Design — FitFlow

**Data da auditoria:** 2026-11-10  
**Referência metodológica:** Skill `frontend-design` (`c:\dev\fitflow\.agents\skills\frontend-design\SKILL.md`) e diretrizes de produto inspiradas em **Linear**, **Apple**, **Nike Training Club**, **TrueCoach** e **Trainerize**.  
**Nota sobre skill `anti-ai-design`:** A skill `anti-ai-design` não foi encontrada instalada no ambiente da IDE (nem em `.agents/skills` nem em `C:\Users\vande\.gemini\antigravity`). Conforme instruído, utilizou-se a skill equivalente instalada (`frontend-design`) combinada integralmente com as diretrizes técnicas e visuais deste projeto.

---

## 1. Resumo Executivo

A base funcional do FitFlow está sólida (multi-tenancy, versionamento imutável, portal mobile-first, gráficos de evolução), porém a camada visual atual apresenta diversos sinais clássicos de interface gerada por IA ("SaaS-Card Kit"):

1. **Excesso de cards e aninhamento ("caixas dentro de caixas"):** Quase todos os blocos e itens de lista estão encapsulados em `<Card>` ou `div` com `border`, `rounded-xl` e fundo escuro distinto, gerando ruído visual e baixa densidade escaneável.
2. **Proliferação de micro-rótulos `ALL CAPS` + `tracking-wider` e strings com `•`:** Cabeçalhos de métricas, chips de dia da semana, barra superior (`• Tenant Ativo`) e títulos de seção repetem esse padrão genérico.
3. **Tokens visuais duplicados e hardcoded:** Centenas de ocorrências de hexadecimais literais (`#090B0E`, `#12161D`, `#161B24`, `#0E131A`, `#242C3A`, `#9BA3AF`, `#F3F5F7`) e classes de botão/select/textarea repetidas inline em vez de consumirem componentes e tokens centralizados.
4. **Efeitos decorativos sem função:** Gradiente no hero do aluno (`bg-gradient-to-b from-[#141F23] to-[#12161D]`), sombras coloridas (`shadow-emerald-500/20`, `shadow-2xl`), `animate-pulse` contínuo em ícones, ícones em caixas quadradas repetitivas em toda tela de auth/landing e `backdrop-blur` excessivo.
5. **Lacunas operacionais e de experiência do aluno:**
   - Botão de notificações (`Bell`) morto no `CoachShell`.
   - `MediaPreview` já existe em `src/components/ui/media-preview.tsx`, mas não é utilizado na execução do treino (`WorkoutRunner`) nem na ficha de detalhe do exercício (`CoachExerciseDetailPage`), impedindo o aluno de abrir instruções passo a passo e vídeos durante o treino.
   - Botões do cronômetro de descanso e navegação do `WorkoutRunner` com altura `h-7` (28px), abaixo do alvo ergonômico de toque (`44px–48px`).
   - Ausência de arquivos `loading.tsx` e `error.tsx` nas áreas `(coach)` e `(student)`, além de falta de suporte a `prefers-reduced-motion`.

---

## 2. Inventário de Problemas por Categoria e Prioridade

| Prioridade | Categoria | Problema Encontrado | Arquivos Afetados | Mudança Recomendada |
| :--- | :--- | :--- | :--- | :--- |
| **P0 — Crítica** | Design System & Tokens | Cores hardcoded (`#090B0E`, `#12161D`, `#161B24`, `#0E131A`, `#141F23`, `#242C3A`) espalhadas nos componentes; falta de primitivos reutilizáveis (`Select`, `Textarea`, `Table`, `Dialog`/`Drawer`, `EmptyState`, `PageHeader`). | `src/app/globals.css`, `tailwind.config.ts`, `src/components/ui/*`, todas as páginas | Centralizar tokens semânticos em `globals.css` e `tailwind.config.ts`; criar `select.tsx`, `textarea.tsx`, `table.tsx`, `dialog.tsx`, `page-header.tsx`, `empty-state.tsx`; adicionar suporte a `prefers-reduced-motion` e `tabular-nums`. |
| **P0 — Crítica** | Portal do Aluno (Execução) | `WorkoutRunner` não exibe instruções detalhadas nem vídeos/mídias (`MediaPreview`) do exercício; botões do timer de descanso (`h-7` = 28px) e navegação são pequenos para uso na academia; modal de conclusão sem fechamento por `Escape` ou `role="dialog"`. | `src/app/(student)/student/session/[sessionId]/workout-runner.tsx`, `page.tsx`, `src/app/(student)/student/today/page.tsx` | Integrar drawer/accordion acessível com mídia (`MediaPreview`) e passos técnicos + alertas posturais por exercício; aumentar alvos de toque para ≥44px (`h-11`/`h-12`); remover `animate-pulse` contínuo, gradiente e `shadow-emerald-500/20`; substituir sets em cards individuais por linhas tabulares limpas. |
| **P0 — Crítica** | Navegação & Shells | `CoachShell` possui botão `Bell` decorativo sem ação, rótulo `• TENANT ATIVO` em `ALL CAPS`, item ativo com borda em caixa e `backdrop-blur`; `StudentShell` tem pílulas com borda e `backdrop-blur`. | `src/app/(coach)/coach-shell.tsx`, `src/app/(student)/student-shell.tsx` | Remover botão de notificação morto e rótulo `Tenant Ativo`; aplicar navegação limpa estilo Linear (indicador lateral discreto/superfície sutil sem caixa pesada); substituir `backdrop-blur` excessivo por superfície sólida com divisor fino. |
| **P1 — Alta** | Dashboard do Treinador | 4 cards KPI com pesos idênticos e títulos em `ALL CAPS`; atividades recentes e alunos inativos em cards aninhados; ausência de atalhos operacionais rápidos e visualização em tabela compacta. | `src/app/(coach)/coach/dashboard/page.tsx` | Trocar faixa superior por barra de métricas compacta com `tabular-nums` e sem `ALL CAPS` decorativo; exibir "Últimas Atividades" em tabela/lista limpa com divisores sutis e "Alunos que Precisam de Atenção" com ação direta para perfil/prescrição + atalhos rápidos. |
| **P1 — Alta** | Editor de Treinos (Workout Builder) | `AddTrainingDayForm` usa `sm:grid-cols-3` dentro da coluna estreita (`xl:col-span-4`), comprimindo campos; 4 camadas de bordas aninhadas por exercício; `→` em texto de link; selects/textareas crus. | `src/app/(coach)/coach/workouts/[id]/page.tsx`, `builder-forms.tsx`, `src/app/(coach)/coach/workouts/page.tsx` | Padronizar layout 2 colunas sem compressão (formulário de dia empilhado ou barra superior/drawer); eliminar caixas aninhadas nos exercícios usando divisores sutis; remover `→` decorativo; usar `Select`, `Textarea` e `Table` do Design System. |
| **P1 — Alta** | Gestão de Alunos & Perfil | Formulário completo de convite sempre aberto no topo empurrando a lista de alunos para baixo; cada aluno em um card separado em vez de tabela/lista estruturada; `StudentDetailPage` empilha cards pesados. | `src/app/(coach)/coach/students/page.tsx`, `invite-form.tsx`, `[id]/page.tsx`, `[id]/edit-student-form.tsx` | Transformar convite em painel expansível/modal acionado pelo cabeçalho; apresentar diretório de alunos em tabela responsiva (desktop) / lista limpa (mobile) com divisores; organizar perfil individual em seções limpas com divisores. |
| **P1 — Alta** | Biblioteca de Exercícios | 12 pílulas `rounded-full` para categorias + card de filtro + cards com box aninhado de segurança + formulário completo expandido no rodapé; página de detalhe não usa `MediaPreview` para vídeos externos. | `src/app/(coach)/coach/exercises/page.tsx`, `[id]/page.tsx`, `exercise-form.tsx` | Substituir 12 pílulas por barra de filtro horizontal limpa / seletor; simplificar cards do catálogo (sem boxes internos repetitivos); colocar criação de exercício em modal/painel sob demanda; integrar `MediaPreview` em `[id]/page.tsx`. |
| **P2 — Média** | Evolução & Gráficos | `BodyCompositionChart` usa `<linearGradient>` decorativo; 4 KPIs repetem `ALL CAPS` e ícones `Flame`; formulário de avaliação com 14 inputs comprimidos em 5 colunas. | `src/app/(coach)/coach/progress/page.tsx`, `charts.tsx`, `assessment-form.tsx` | Remover gradientes SVG desnecessários nos gráficos (linhas limpas com área sutil sólida opcional); padronizar faixa de métricas sem `ALL CAPS`; abrir registro de avaliação em drawer/modal ou seção dedicada com boa largura. |
| **P2 — Média** | Portal do Aluno (Semana, Histórico, Perfil) | `StudentTodayPage` usa `rounded-2xl`, gradiente, `animate-pulse` e sets em cards separados; `StudentWeek` e `StudentHistory` usam caixas aninhadas e `uppercase` excessivo; `StudentProfile` usa card com divisor interno redundante. | `src/app/(student)/student/today/page.tsx`, `week/page.tsx`, `history/page.tsx`, `profile/page.tsx` | Unificar superfície do treino de hoje com foco tipográfico e CTA claro; exibir séries previstas em lista tabular compacta e clicável para detalhes do exercício; limpar cards internos de histórico e perfil. |
| **P2 — Média** | Landing & Autenticação | `HomePage` exibe badge `SaaS Multi-Tenant`, pílula decorativa com `Flame`, caixas de ícone idênticas nos 3 cards de destaque; telas de Auth usam `shadow-2xl` e caixas de ícone idênticas centralizadas. | `src/app/page.tsx`, `src/app/(auth)/**/page.tsx`, `*-form.tsx` | Substituir landing genérica por apresentação sóbria e técnica alinhada à marca FitFlow; remover `shadow-2xl` e caixas de ícone decorativas nas telas de auth, mantendo clareza, contraste e foco no formulário. |
| **P2 — Média** | Estados de Carregamento e Erro | Não existem arquivos `loading.tsx`, `error.tsx` nem `not-found.tsx` nos grupos `(coach)` e `(student)`. | `src/app/(coach)/coach/*`, `src/app/(student)/student/*` | Adicionar `loading.tsx` com skeletons estruturais e `error.tsx` com ação objetiva de recuperação. |

---

## 3. Diretrizes de Refatoração Aplicadas (Plano do Design System)

1. **Paleta Funcional (Grafite, Carvão & Esmeralda Preciso):**
   - `--bg-canvas`: `#0A0C0F` (grafite profundo, neutro, sem matiz azulada artificial)
   - `--bg-surface`: `#111419` (carvão para superfícies principais)
   - `--bg-surface-elevated`: `#171B22` (modais, dropdowns, cabeçalhos de tabela)
   - `--bg-surface-subtle`: `#1E242E` (hover e estados ativos sutis)
   - `--border-subtle`: `#232934` (divisores discretos)
   - `--border-strong`: `#323B49` (inputs e foco)
   - `--text-primary`: `#F3F5F7`
   - `--text-secondary`: `#9CA3AF`
   - `--text-muted`: `#6B7280`
   - `--accent-primary`: `#10B981` (verde-esmeralda sóbrio para ações primárias, foco e conclusão)
   - Semânticos: Sucesso `#10B981`, Atenção `#F59E0B`, Erro `#EF4444`.
2. **Escala Tipográfica e Números:**
   - Fonte principal `Inter` + mono `JetBrains Mono` / `ui-monospace` apenas para timers e métricas numéricas.
   - Uso sistemático de `tabular-nums` em cargas, séries, durações, KPIs e datas.
   - Eliminação de rótulos `ALL CAPS` decorativos em títulos de seção e métricas; preferência por *Sentence case* e peso tipográfico (`font-medium` / `font-semibold`).
3. **Geometria e Superfícies:**
   - Redução de `rounded-2xl` e `rounded-full` em botões/abas de controle para um raio técnico consistente (`--radius: 0.5rem` / `8px`, `rounded-md` = `6px`, `rounded-lg` = `8px`).
   - Substituição de cards aninhados por **seções delimitadas por hairline borders (`divide-y`)**, tabelas limpas e contraste sutil entre `#0A0C0F` e `#111419`.
   - Remoção de `shadow-2xl`, sombras coloridas (`shadow-emerald-500/20`) e gradientes decorativos.
4. **Movimento e Acessibilidade:**
   - Remoção de `animate-pulse` contínuo em ícones estáticos.
   - Transições rápidas (`150ms`) apenas em feedback de interação.
   - Regra global `@media (prefers-reduced-motion: reduce)` em `globals.css`.
   - Alvos de toque mínimos de `44px–48px` em todos os controles móveis do portal do aluno.
