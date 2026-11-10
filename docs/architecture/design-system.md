# Design System e Identidade Visual — FitFlow

## 1. Fundamentos e Direção Conceitual

O **FitFlow** foi concebido sob a perspectiva da skill `frontend-design`: uma aplicação com identidade visual própria, imersiva e funcional, rejeitando categoricamente a estética clichê e padronizada de dashboards gerados por IA (como cartões arredondados idênticos com sombras difusas, gradientes roxo/azul aleatórios e rótulos All-Caps desnecessários).

### 1.1. Contexto do Domínio (Fitness & Personal Training)
- **O Treinador no Desktop:** Precisa de **densidade de informação**, velocidade de leitura, teclado ágil e capacidade de estruturar uma periodização de treino completa sem se afogar em modais aninhados.
- **O Aluno na Academia (Mobile):** Está em movimento, cansado, com a tela do celular muitas vezes sob luzes intensas de refletores de academia e operando com uma mão entre séries. A interface deve ser **altamente contrastante**, com **alvos de toque grandes (≥ 48px)**, tipografia de alta legibilidade e controles imediatos para marcar séries e acompanhar o cronômetro de descanso.

---

## 2. Paleta de Cores e Tokens Visuais

A paleta adota uma base de **Grafite Escuro Profundo** com superfícies em **Carvão Técnico** e destaques em **Verde Esmeralda Esportivo**, transmitindo disciplina, energia e precisão técnica.

```css
:root {
  /* Fundo e Superfícies Base */
  --bg-canvas: #090B0E;         /* Grafite quase preto profundo */
  --bg-surface: #12161D;        /* Painéis e cards principais */
  --bg-surface-elevated: #181E27; /* Modais, dropdowns e gavetas */
  --bg-surface-subtle: #1D2430;   /* Linhas alternadas de tabelas e hover */

  /* Bordas e Divisores Estruturais */
  --border-subtle: #242C3A;     /* Divisores leves e outlines funcionais */
  --border-strong: #333F53;     /* Bordas de campos de input e foco */

  /* Tipografia e Textos */
  --text-primary: #F3F5F7;      /* Branco suave de alto contraste */
  --text-secondary: #9BA3AF;    /* Cinza neutro para instruções e rótulos */
  --text-muted: #647082;        /* Metadados secundários, timestamps */

  /* Cor de Destaque / Ação (Emerald Athletic) */
  --accent-primary: #10B981;    /* Esmeralda vibrante para botões principais e checks */
  --accent-hover: #059669;      /* Estado hover e ativo */
  --accent-subtle: rgba(16, 185, 129, 0.12); /* Fundo sutil de tags ativas e badges */
  --accent-glow: rgba(16, 185, 129, 0.25);

  /* Estados Semânticos */
  --state-success: #10B981;
  --state-warning: #F59E0B;     /* Alerta de aluno inativo */
  --state-danger: #EF4444;      /* Erro, cancelamento e exclusão */
  --state-info: #3B82F6;        /* Informativos e dicas de postura */

  /* Alvos Ergonômicos */
  --touch-target-min: 48px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
}
```

---

## 3. Tipografia e Escala de Hierarquia

A tipografia utiliza a família **Inter** / **Geist** com kerning otimizado e escala modular harmônica:

- **H1 / Display (24px a 28px, Semibold):** Títulos de página do treinador e nome do treino do dia para o aluno.
- **H2 / Section Title (18px a 20px, Medium):** Grupos de exercícios, seções do dia (Ex: "Treino A: Peito e Tríceps") e títulos de cards de KPIs.
- **Body Regular (14px a 15px, Normal, Line-height 1.5):** Textos descritivos, instruções técnicas e anotações.
- **Body Compact / Data (13px, Medium):** Tabelas de dados, colunas de séries, repetições e tags.
- **Timer Display (36px a 44px, Monospace/Tabular Numbers, Bold):** Contagem regressiva do descanso do aluno, legível a 1 metro de distância.

---

## 4. Componentes Principais e Padrões de Interface

### 4.1. Workout Builder (Editor de Treinos do Personal)
O editor abandona a proliferação de modais e adota uma interface de **duas colunas no desktop**:
- **Coluna da Direita (65% da tela): O Canvas Contínuo.**
  - Exibe os dias do treino em abas horizontais limpas (`Treino A`, `Treino B`, `Treino C`).
  - Cada exercício é representado por um bloco estruturado contendo: número de ordem, nome do exercício, badge do grupo muscular, gaveta de séries e botão de agrupamento em Super-série.
  - Tabela inline de séries: campos numéricos para Repetições, Carga Sugerida (kg) e Descanso (s), permitindo preenchimento sequencial com a tecla `Tab`.
- **Coluna da Esquerda (35% da tela): A Gaveta da Biblioteca de Exercícios.**
  - Campo de busca instantânea no topo.
  - Filtros rápidos em pílulas (`Peito`, `Costas`, `Pernas`, `Halteres`, `Máquinas`).
  - Ao clicar em `+ Adicionar`, o exercício entra diretamente no dia selecionado com animação sutil de feedback.

```
┌────────────────────────────────────────┬───────────────────────────────────────────┐
│ GAVETA DE EXERCÍCIOS                   │ CANVAS DO TREINO (Treino A - Peito)       │
├────────────────────────────────────────┼───────────────────────────────────────────┤
│ [🔍 Buscar exercício...]               │ [Treino A] [Treino B] [Treino C]  [+ Dia] │
│ [Todos] [Peito] [Costas] [Pernas]      │                                           │
│                                        │ 1. Supino Reto com Barra   [Bi-set] [x]   │
│ + Supino Reto com Barra                │    ┌────┬─────────┬────────┬──────────┐   │
│ + Supino Inclinado com Halteres        │    │Set │  Reps   │ Carga  │ Descanso │   │
│ + Crucifixo no Crossover               │    ├────┼─────────┼────────┼──────────┤   │
│ + Tríceps Corda na Polia               │    │ 1  │  10-12  │ 60 kg  │   60s    │   │
│ + Paralelas para Peito                 │    │ 2  │  10-12  │ 60 kg  │   60s    │   │
│                                        │    │ 3  │    8    │ 65 kg  │   90s    │   │
│                                        │    └────┴─────────┴────────┴──────────┘   │
└────────────────────────────────────────┴───────────────────────────────────────────┘
```

### 4.2. Portal de Execução do Aluno (Mobile-First)
- **Cabeçalho:** Nome do Treino, tempo de sessão decorrido e botão de encerramento.
- **Card do Exercício em Foco:**
  - Imagem ou miniatura de vídeo com botão de play rápido para instruções.
  - Histórico de referência: *"Última sessão: 3x 10 reps @ 50kg"*.
  - Tabela de séries com grandes botões de check verde:
    - Campo de Carga realizada (kg) e Repetições concluídas.
    - Ao tocar no botão de confirmação da série: a linha fica verde escuro, registra o timestamp e aciona imediatamente o cronômetro de descanso.
- **Cronômetro de Descanso Flutuante:**
  - Widget fixado na parte inferior da tela durante a contagem.
  - Barra de progresso circular ou linear decrescente.
  - Botões de conveniência: `+30s`, `-15s` e `Pular`.
  - Disparo de vibração no dispositivo ao atingir zero.

### 4.3. Dashboard do Personal
- Grade de métricas analíticas no topo com 4 cartões limpos:
  1. **Total de Alunos** (com divisão Ativos / Pausados).
  2. **Treinos da Semana** (concluídos vs meta).
  3. **Alunos em Risco** (sem treinar há > 7 dias, permitindo contato imediato via WhatsApp).
  4. **Recordes Pessoais (PRs)** superados na semana.
- Feed cronológico de atividades em tabela compacta e legível.

---

## 5. Diretrizes de Micro-Interações e Acessibilidade

1. **Sem Animações Excessivas:** Transições suaves de 150ms a 200ms apenas em momentos informativos (ex: abertura de gaveta, marcação de série concluída).
2. **Contraste Acessível:** Todos os pares de texto sobre fundo respeitam a taxa mínima de 4.5:1 (WCAG AA).
3. **Feedback de Estado Imediato:** Ações assíncronas exibem estados claros de carregamento (Skeletons estruturados, nunca telas em branco) e notificações Toast objetivas (Ex: *"Programa publicado com sucesso"*).
