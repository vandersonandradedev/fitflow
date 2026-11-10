# Análise Competitiva e Engenharia Reversa Funcional — FitFlow

## 1. Visão Geral e Metodologia

Este documento estabelece a base estratégica e funcional para a concepção do **FitFlow**, baseando-se em engenharia reversa de produto realizada sobre as três soluções líderes do mercado global de software para personal trainers e fitness coaching:

1. **ABC Trainerize** (Referência primária para fluxos de negócio, compliance de clientes e gestão holística).
2. **TrueCoach** (Referência para velocidade de prescrição, flexibilidade no editor de treinos e experiência de execução direta).
3. **Everfit** (Referência para arquitetura modular de treinos, organização em seções/blocos, biblioteca rica e interface contemporânea).

### 1.1. Metodologia de Engenharia Reversa Ética
- **Fontes Primárias:** Centrais de ajuda oficiais públicas (help.trainerize.com, help.everfit.io, truecoach.co/features), documentações de produto, demonstrações autorizadas e guias de suporte aos usuários.
- **Conformidade Legal:** Não foram realizadas cópias de código-fonte, elementos de design protegido, marcas ou ativos proprietários. A análise ateve-se estritamente à taxonomia funcional, arquitetura de fluxos de usuário, modelos conceituais de dados subjacentes e gaps de usabilidade.
- **Critério de Certeza:** Funcionalidades dependentes de planos enterprise fechados ou fluxos privados não verificáveis foram catalogadas expressamente como "Não Verificado" para evitar suposições infundadas.

---

## 2. Matriz de Análise Competitiva

| Funcionalidade | ABC Trainerize | TrueCoach | Everfit | FitFlow (Definição para MVP) |
|---|---|---|---|---|
| **1. Gestão de Alunos** | Centralizada, rica em metadados (tags, tipo de cliente, compliance semanal, formulários de adesão). Interface densa e legacy. | Rápida, focada no relacionamento direto coach-aluno. Chat integrado no perfil. Configuração simples de objetivos. | Moderna, visual em cards ou lista. Gestão de tags, grupos e programas atribuídos em lote. | **Adotar:** Ficha cadastral clara com status ativo/pausado, metas, anamnese mínima em conformidade com a LGPD e vínculo estrito ao tenant. |
| **2. Dashboard do Treinador** | Painel analítico com KPIs de compliance (workouts completados, sign-ins, nutrição, faltas). Tiles customizáveis. | Feed de atividades diárias (quem treinou, quem comentou, treinos pendentes para revisão). Foco operacional. | Dashboard visual com métricas rápidas de clientes ativos, tarefas do dia, treinos recentes e aniversários. | **Adotar:** Dashboard operacional em tempo real: total de alunos, alunos ativos/pausados, treinos concluídos na semana, alunos em risco (sem treinar há > 7 dias) e atalhos rápidos. |
| **3. Editor de Treinos** | Baseado em "Master Workouts" e "Programs". Interface em etapas; recentemente adicionou assistente por IA. | Editor baseado em blocos rápidos de texto/campos estruturados (A1/A2, séries, repetições, tempo, descanso). Altíssima velocidade de digitação. | Canvas em 3 painéis (Biblioteca à esquerda, Canvas de montagem ao centro, Painel de ordenação/agenda à direita). Suporta seções (regular, AMRAP, HIIT, circuitos). | **Adotar & Adaptar:** Editor visual de 2 ou 3 colunas, combinando a flexibilidade de seções do Everfit (aquecimento, bloco principal, finisher/supersets) com a velocidade de preenchimento do TrueCoach (campos inline de séries, reps, carga sugerida, descanso e cadência). |
| **4. Biblioteca de Exercícios** | Ampla biblioteca pré-existente organizada por grupo muscular e equipamento. Permite criar exercícios customizados com vídeo. | Biblioteca com mais de 3.000 exercícios integrados em vídeo. Suporte para upload de vídeos próprios ou links do YouTube. | Biblioteca modular com animações 3D e vídeos. Filtros inteligentes (foco principal, secundário, categoria, disponibilidade de vídeo). | **Adotar:** Biblioteca categorizada por grupos musculares anatômicos padronizados. Suporte híbrido: catálogo global (read-only para tenants) + catálogo customizado do personal trainer (isolado por tenant). |
| **5. Vídeos Demonstrativos** | Vídeos curtos demonstrativos em looping no app mobile. Links externos ou hosting próprio. | Vídeos curtos incorporados diretamente no card do exercício na web e no app. Permite vídeo de feedback do aluno. | Animações anatômicas e vídeos em streaming responsivo, com instruções passo a passo e dicas de postura. | **Adotar:** Suporte nativo a demonstrações via Cloudflare R2 com URLs assinadas e compatibilidade com players embutidos (YouTube/Vimeo não-listados), garantindo alta velocidade sem quebra de links. |
| **6. Programação Semanal** | Calendário semanal ou mensal. Atribuição de treinos em dias específicos com reagendamento manual. | Calendário dinâmico em grade (segunda a domingo) com código de cores por status do treino. Suporte para copiar semanas inteiras. | Master Planner flexível com visão diária/semanal, suporte a drag-and-drop e duplicação em massa de blocos de treino. | **Adotar:** Calendário semanal flexível sem amarração a divisões fixas (permite qualquer distribuição: A/B, ABC, Push/Pull/Legs, dias de descanso ativos). Visualização clara de treino planejado vs realizado. |
| **7. Registro de Cargas** | O aluno preenche os campos de carga e repetições durante o treino. Registra automaticamente Recordes Pessoais (PRs). | Registro por série com histórico visível do último treino na mesma tela (facilita progressão de carga). | Registro série a série com auto-preenchimento baseado na última carga registrada e badges visuais de PR. | **Adotar:** Interface de execução móvel com exibição imediata do histórico da última sessão para aquele exercício, campos numéricos ergonômicos e cálculo automático de volume total (carga x repetições). |
| **8. Histórico de Execução** | Histórico detalhado por data e por exercício. Exibe notas do aluno e comparação de esforço. | Histórico com notas bidirecionais (comentários do aluno e feedback do treinador por exercício). | Timeline de treinos finalizados com detalhes de tempo total despendido, carga acumulada e taxa de conclusão. | **Adotar:** Persistência de sessões finalizadas com data/hora, tempo de duração, cada série efetivamente realizada (carga + reps) e notas de esforço (RPE opcional). Preservação de versões anteriores do programa. |
| **9. Evolução Física** | Gráficos de peso corporal, percentual de gordura, fotos de antes/depois e evolução de carga por exercício individual. | Gráficos de métricas corporais e gráficos de 1RM estimada/máxima para exercícios-chave. | Hub de progresso com gráficos de adesão, volume de treinamento semanal e medidas corporais. | **Adotar:** Gráficos limpos em Recharts: Frequência semanal, Evolução de carga por exercício selecionado e Volume de treinamento acumulado (tonelagem). Avaliações corporais básicas opcionais. |
| **10. Experiência Mobile** | App nativo para treinador e aluno (apps separados ou white-label em planos caros). Focado em smartphone. | App nativo minimalista para o aluno, focado na rotina diária de treino, cronômetro e envio de vídeos. | App moderno, altamente responsivo, com cronômetro integrado, tela de descanso inteligente e áudio cues. | **Adotar:** Portal do Aluno desenvolvido mobile-first como Progressive Web App (PWA) instalável, com layout ergonômico para uso com uma mão na academia, cronômetro de descanso em tela cheia e tolerância a perda momentânea de conexão. |

---

## 3. Síntese dos Fluxos de Usuário Analisados

### 3.1. Fluxo de Criação e Prescrição de Programas (Trainerize vs TrueCoach vs Everfit)

```
[Fluxo 1: Criação de Programa (Treinador)]
Criar Novo Programa (Nome, Objetivo, Duração)
       │
       ▼
Criar/Editar Versão em Rascunho (Draft)
       │
       ├─► Adicionar Dias de Treino (Ex: Treino A - Peito e Tríceps)
       │      │
       │      ├─► Selecionar/Filtrar Exercício da Biblioteca
       │      │      └─► Inserir Séries (Prescrito: 3x 10-12 reps, Carga Sugerida, RPE, 60s descanso)
       │      │
       │      ├─► Agrupar em Supersets / Circuitos (opcional)
       │      │
       │      └─► Reordenar exercícios via arrasto ou botões direcionais
       │
       ▼
Revisar e Publicar Versão (Bloqueia alterações destrutivas em sessões históricas)
       │
       ▼
Atribuir Programa ao Calendário do Aluno (Dias específicos da semana)
```

### 3.2. Fluxo de Execução do Aluno (Mobile)

```
[Fluxo 2: Execução de Sessão de Treino (Aluno)]
Acessar Portal do Aluno ──► Visualizar "Treino de Hoje"
                                  │
                                  ▼
                            Iniciar Sessão (Registra timestamp de início)
                                  │
                                  ├─► Abrir Exercício 1 (Assistir vídeo / ler instruções)
                                  │      │
                                  │      ├─► Executar Série 1 (Ex: Prescrito 10 reps @ 50kg)
                                  │      │      └─► Digitar Realizado: 10 reps @ 52.5kg
                                  │      │      └─► Marcar Check (Dispara Cronômetro de Descanso)
                                  │      │
                                  │      ├─► Contagem regressiva do descanso com botão +30s / Pular
                                  │      │
                                  │      └─► Repetir para séries 2, 3...
                                  │
                                  ├─► Próximo Exercício (Estado persistido em LocalStorage para segurança)
                                  │
                                  ▼
                            Finalizar Treino
                                  │
                                  ├─► Inserir Feedback Geral / RPE da Sessão
                                  └─► Salvar no Servidor (Cria registro imutável em workout_sessions)
```

---

## 4. Decisões de Produto para o FitFlow

### 4.1. O que será Reproduzido Funcionalmente
1. **Separação rigorosa entre Prescrição e Execução:** Treinos prescritos são modelos/versões; treinos executados são registros de log com timestamps e valores reais realizados.
2. **Cronômetro de descanso dinâmico:** Disparo automático ao checar a conclusão de uma série, mantendo o aluno no ritmo do treino sem exigir outro app.
3. **Editor em blocos com Supersets:** O personal poderá agrupar dois ou mais exercícios em conjunto sem complicação visual.
4. **Visão da última carga executada:** Durante a execução de um exercício, o aluno enxerga imediatamente o que fez na última sessão, estimulando a sobrecarga progressiva.

### 4.2. O que será Adaptado
1. **Editor de Treinos do Everfit:** Em vez de 3 painéis complexos que exigem telas ultrawide (como no Everfit), o FitFlow usará um layout de 2 colunas responsivo: à esquerda uma gaveta inteligente de exercícios com pesquisa em tempo real, e à direita a ficha contínua do dia.
2. **Nomenclatura e Taxonomia:** Em vez de termos confusos em inglês (ex: "Straight sets vs Freestyle vs AMRAP"), utilizaremos terminologia clara e adotada por treinadores brasileiros (Séries Normais, Bi-Set/Super-série, Circuito, Aquecimento).
3. **PWA Mobile-First em vez de App Nativo:** Em vez de obrigar download via lojas (App Store / Google Play) com custos de publicação e barreiras de entrada, o Portal do Aluno será um Web App progressivo ultra-otimizado que pode ser adicionado à tela inicial em um clique.

### 4.3. O que será Descartado no MVP
1. **Cobrança integrada e automação financeira:** Removida do escopo do MVP para foco total na experiência central de treinamento e estabilidade multi-tenant.
2. **Chat em tempo real com WebSocket / videochamada:** Substituído por campos de observações na sessão e histórico de notas.
3. **Geração de treinos por IA generativa sem supervisão:** Treinadores reais priorizam controle e segurança de prescrição; o foco do FitFlow é empoderar o personal, não substituí-lo.
4. **Integração complexa com dezenas de wearables (Apple Health, Garmin, Fitbit):** Prioridade adiada para versões futuras pós-validação de mercado.

---

## 5. Oportunidades de Diferenciação do FitFlow

1. **Velocidade de Carregamento e Interface Limpa:** Plataformas legadas como Trainerize sofrem de lentidão, excesso de cliques e layouts pesados. O FitFlow usará Next.js App Router com Server Components e carregamento instantâneo.
2. **Experiência de Execução de Treino Realista:** O aluno na academia está suado, cansado e usando o celular com uma mão. Os botões de check de série e os inputs numéricos do FitFlow terão alvos de toque grandes (mínimo 48px), modo escuro confortável e recuperação de sessão caso a tela feche ou a bateria acabe.
3. **Segurança Multi-Tenant Rigorosa:** Isolamento garantido por arquitetura, impedindo que dados médicos, fotos ou treinos vazem entre treinadores concorrentes.

---

## 6. Limitações da Pesquisa

- Os detalhes dos algoritmos de recomendação interna e funcionalidades proprietárias restritas a planos corporativos superiores não puderam ser verificados e foram expressamente desconsiderados.
- Testes de stress de rede e limites de upload de vídeo das plataformas concorrentes não foram executados contra seus servidores produtivos em conformidade com as diretrizes éticas de engenharia reversa.
