# Documento de Requisitos de Produto (PRD) — FitFlow

## 1. Visão do Produto e Modelo de Negócio

### 1.1. Missão do FitFlow
O **FitFlow** é uma plataforma SaaS B2B2C desenvolvida para personal trainers independentes gerenciarem seus alunos e prescreverem programas de treinamento com alta velocidade operacional, confiabilidade técnica e uma experiência premium de execução para o aluno.

### 1.2. Arquitetura de Negócio no MVP
- **Modelo Multi-Tenant Lógico:** Cada personal trainer cadastrado opera como um **Tenant** independente e isolado.
- **Relacionamento 1:N no MVP:** Um Personal Trainer gerencia múltiplos alunos. Cada aluno está associado a exatamente um Personal Trainer (tenant).
- **Contas e Credenciais Separadas:** Alunos e treinadores possuem logins e perfis independentes.
- **Premissas do MVP:**
  - Sem compartilhamento de alunos ou treinos entre treinadores.
  - Sem módulo de faturamento/cobrança integrado na primeira versão (preparado estruturalmente para planos e limites futuros).
  - Sem painel global de super-administrador obrigatório na primeira versão.

---

## 2. Personas de Usuário

### Persona 1: O Personal Trainer (Lucas, 32 anos)
- **Perfil:** Treinador com 25 a 45 alunos particulares e consultorias online.
- **Dores Atuais:** Perde horas montando treinos em planilhas ou PDFs que os alunos perdem no WhatsApp; não sabe se o aluno realmente treinou ou qual carga utilizou; cansaço com plataformas lentas e cheias de cliques desnecessários.
- **Objetivo no FitFlow:** Criar fichas de treino completas em menos de 5 minutos, acompanhar se o aluno treinou na semana e ter um histórico confiável de progressão de cargas para prescrever com embasamento técnico.

### Persona 2: O Aluno (Mariana, 28 anos)
- **Perfil:** Praticante de musculação que treina de 4 a 5 vezes por semana em academia comercial com fone de ouvido.
- **Dores Atuais:** Não lembra o peso que fez na semana passada; perde tempo procurando o exercício no celular; o app antigo travava quando a tela bloqueava; não entende a anotação manual do treinador.
- **Objetivo no FitFlow:** Abrir o app no celular, ver imediatamente o treino do dia, dar play no vídeo demonstrativo quando tiver dúvida, anotar as cargas facilmente enquanto descansa e ser avisada quando o tempo de intervalo terminar.

---

## 3. Requisitos Funcionais Detalhados (Módulos 1 a 9)

### MÓDULO 1: Autenticação e Multi-Tenancy (RF01)
- **RF01.1 — Cadastro de Treinador:** O treinador pode se cadastrar informando Nome, E-mail profissional e Senha. Ao se cadastrar, um novo `Tenant` é criado automaticamente e o usuário é vinculado com a função de `OWNER`.
- **RF01.2 — Autenticação Segura:** Login via e-mail e senha com hash bcrypt, geração de sessão baseada em cookies HTTP-Only e proteção CSRF.
- **RF01.3 — Recuperação de Senha:** Envio de token seguro de uso único com expiração de 1 hora para redefinição de credenciais.
- **RF01.4 — Convite de Aluno:** O personal trainer convida um aluno informando Nome e E-mail. O sistema gera um token criptográfico único vinculado ao `tenant_id` e envia o link de ativação.
- **RF01.5 — Ativação de Conta pelo Aluno:** Ao acessar o link com token válido, o aluno define sua senha, completa seu perfil e ganha acesso imediato ao portal do aluno.
- **RF01.6 — Isolamento de Rotas e Sessão:** O middleware e os handlers do servidor validam que o usuário só acessa o ambiente correspondente à sua função (`(coach)` vs `(student)`) e ao seu respectivo `tenant_id`.

### MÓDULO 2: Dashboard do Personal Trainer (RF02)
- **RF02.1 — Métricas em Tempo Real (Sem Mocks):**
  - Total de alunos cadastrados.
  - Quantidade de alunos ativos e pausados.
  - Programas de treino ativos.
  - Treinos completados na semana corrente (segunda a domingo).
  - Alunos em risco de evasão (sem treinar há mais de 7 dias).
- **RF02.2 — Feed de Atividades Recentes:** Lista das últimas sessões finalizadas com nome do aluno, treino executado e horário de conclusão.
- **RF02.3 — Ações Rápidas:** Botões de acesso direto para "Novo Aluno", "Novo Treino" e "Biblioteca de Exercícios".

### MÓDULO 3: Gestão de Alunos (RF03)
- **RF03.1 — Cadastro e Edição de Perfil:**
  - Dados pessoais: Nome completo, E-mail, Telefone/WhatsApp, Data de nascimento, Foto de perfil.
  - Metadados de treino: Objetivo principal (Hipertrofia, Emagrecimento, Força, Saúde), Nível de experiência (Iniciante, Intermediário, Avançado), Data de início.
  - Status do aluno: Ativo, Pausado ou Arquivado.
  - Observações técnicas confidenciais do treinador.
- **RF03.2 — Listagem e Filtros:** Busca por nome, filtro por status e ordenação por última atividade.
- **RF03.3 — Ficha Unificada do Aluno:** Visualização dos programas atribuídos, histórico cronológico de treinos executados e relatórios de evolução.
- **RF03.4 — Anamnese e Saúde Opcional (LGPD):** Campos opcionais de restrições osteoarticulares ou observações de saúde, com termo de consentimento explícito e minimização de dados.

### MÓDULO 4: Biblioteca de Exercícios (RF04)
- **RF04.1 — Taxonomia Anatômica:** Categorização por grupos musculares principais:
  - Peito, Costas, Ombros, Bíceps, Tríceps, Abdômen, Quadríceps, Posterior de Coxa, Glúteos, Panturrilhas, Cardio e Mobilidade.
- **RF04.2 — Estrutura de Metadados do Exercício:**
  - Nome e Descrição técnica.
  - Grupo muscular principal e secundários.
  - Equipamento necessário (Halter, Barra, Máquina, Cabo, Peso Corporal, Elástico).
  - Nível de dificuldade (Iniciante, Intermediário, Avançado).
  - Instruções de postura e cuidados de segurança.
  - Mídia demonstrativa: Imagem/GIF e URL de vídeo de demonstração.
- **RF04.3 — Catálogo Híbrido (Global vs Custom do Tenant):**
  - Exercícios Globais: Criados pelo sistema, somente-leitura para todos os tenants.
  - Exercícios Customizados: Criados pelo personal trainer, privados e visíveis apenas dentro do seu `tenant_id`.
- **RF04.4 — Pesquisa e Filtros Rápidos:** Busca instantânea por texto, filtro simultâneo por grupo muscular, equipamento e tipo.

### MÓDULO 5: Editor de Treinos & Prescrição (RF05)
- **RF05.1 — Hierarquia Estrutural de Treinamento:**
  - `Programa` (Ex: "Periodização Hipertrofia 12 Semanas")
    - `Versão do Programa` (Ex: "v1.0 - Fase Inicial", imutável após publicação)
      - `Dia de Treino` (Ex: "Treino A - Peito, Deltoide e Tríceps")
        - `Seção / Bloco` (Ex: Aquecimento, Bloco Principal, Bi-Set Finalizador)
          - `Exercício Prescrito` (Referência ao exercício da biblioteca)
            - `Séries Prescritas` (Número da série, Repetições planejadas [ex: 10-12 ou 8], Carga sugerida, Descanso em segundos, Cadência opcional, RPE/RIR opcional).
- **RF05.2 — Recursos do Editor:**
  - Adicionar, duplicar e excluir dias de treino.
  - Adicionar exercícios via gaveta lateral de busca sem sair do contexto.
  - Reordenar exercícios por botões de subida/descida ou drag-and-drop.
  - Criar agrupamentos em Super-séries (Bi-set, Tri-set).
  - Duplicar séries ou preencher valores em lote.
- **RF05.3 — Versionamento e Publicação:**
  - Modo Rascunho (Draft): O treinador edita livremente sem afetar a visão do aluno.
  - Ação de Publicar: Congela a versão, gera o snapshot e atualiza a prescrição ativa do aluno, garantindo que treinos históricos não sejam corrompidos retroativamente.

### MÓDULO 6: Programação Semanal e Calendário (RF06)
- **RF06.1 — Distribuição Semanal Flexível:** O treinador atribui dias de treino aos dias da semana (Segunda a Domingo) ou define divisões sequenciais rotativas (ex: Treino A no Dia 1, Treino B no Dia 2).
- **RF06.2 — Dias de Descanso:** Marcação explícita de dias de repouso ou recuperação ativa.
- **RF06.3 — Reagendamento:** Capacidade de remanejar dias de treino sem quebrar a sequência da periodização.

### MÓDULO 7: Portal do Aluno & Execução Mobile (RF07)
- **RF07.1 — Dashboard do Aluno:** Saudação personalizada, exibição em destaque do "Treino de Hoje", visão da semana e atalho para o último treino realizado.
- **RF07.2 — Modo de Execução do Treino:**
  - Botão "Iniciar Treino" com timestamp de abertura.
  - Navegação vertical clara entre os exercícios prescritos.
  - Acesso à demonstração em vídeo e instruções em modal de toque rápido.
  - Tabela série a série com valores prescritos ao lado dos campos de registro real.
  - Exibição de dica com a carga utilizada na última sessão daquele mesmo exercício.
- **RF07.3 — Cronômetro de Descanso:**
  - Acionamento automático configurável ao marcar o check da série concluída.
  - Contagem regressiva visual em overlay não intrusivo com botões de "+30s", "-15s" e "Pular".
  - Alerta sonoro/vibração web suave ao término do intervalo.
- **RF07.4 — Resiliência de Sessão e Persistência Local:**
  - Armazenamento em tempo real do estado da sessão em andamento no LocalStorage/IndexedDB.
  - Se a página for recarregada ou o navegador fechar, a sessão é restaurada intacta com o tempo decorrido e séries já marcadas.
- **RF07.5 — Finalização do Treino:**
  - Campo opcional de esforço percebido geral (RPE de 1 a 10) e observações do aluno.
  - Gravação transacional no banco de dados na entidade `workout_sessions` e `set_logs`.

### MÓDULO 8: Acompanhamento e Evolução (RF08)
- **RF08.1 — Gráfico de Frequência e Aderência:** Percentual de treinos cumpridos vs planejados nas últimas 4 e 12 semanas.
- **RF08.2 — Evolução de Cargas por Exercício:** Gráfico temporal exibindo a carga máxima ou 1RM estimada em exercícios compostos principais (ex: Supino Reto, Agachamento, Levantamento Terra, Puxada).
- **RF08.3 — Volume de Treinamento Acumulado:** Cálculo matemático consistente de tonelagem semanal (Séries x Reps x Carga em kg) por grupo muscular.
- **RF08.4 — Registro de Medidas Corporais:** Histórico de peso corporal e circunferências básicas (cintura, braço, coxa, tórax).

### MÓDULO 9: Notificações Internas (RF09)
- **RF09.1 — Eventos do Sistema:**
  - Notificação ao aluno: "Novo programa publicado pelo treinador", "Lembrete do treino de hoje".
  - Notificação ao treinador: "Aluno [Nome] concluiu o Treino A", "Aluno [Nome] atingiu novo Recorde Pessoal (PR)".
- **RF09.2 — Central In-App:** Ícone de sino com contador de não-lidas e dropdown com ações contextuais.

---

## 4. Requisitos Não Funcionais (RNFs)

- **RNF01 — Isolamento Multi-Tenant Estrito:** Todas as operações de leitura, gravação, alteração e deleção no banco de dados devem ser filtradas obrigatoriamente por `tenant_id` validado no servidor. Tentativas de acesso horizontal entre tenants devem ser bloqueadas com código HTTP 403/404 e registradas em log de auditoria.
- **RNF02 — Performance e Core Web Vitals:** Tempo de carregamento inicial (LCP) inferior a 1.5s em redes 4G; First Input Delay (FID) < 100ms; Cumulative Layout Shift (CLS) < 0.1.
- **RNF03 — Segurança e Criptografia:** Senhas armazenadas com salt e hash bcrypt (mínimo 12 rounds); todas as transmissões de dados via HTTPS com TLS 1.3; tokens de convite e recuperação com entropia criptográfica e expiração temporal; proteção ativa contra CSRF, XSS e SQL Injection.
- **RNF04 — Privacidade e LGPD:** Tratamento de dados pessoais restrito às finalidades do serviço; ausência de dados sensíveis médicos desnecessários; suporte à exportação de dados do titular e anonimização/exclusão mediante requisição.
- **RNF05 — Usabilidade Mobile-First no Portal do Aluno:** Alvos de toque com tamanho mínimo de 48x48px; suporte a gestos simples; contraste visual WCAG AA para visualização sob luz forte de academias.
- **RNF06 — Resiliência Operacional:** A aplicação do aluno não pode perder séries digitadas devido a variações intermitentes de conexão Wi-Fi/4G.
- **RNF07 — Manutenibilidade e TypeScript:** Cobertura 100% TypeScript com modo `strict: true`, schemas de validação Zod compartilhados entre cliente e servidor, e ausência de tipagem `any` permissiva.
- **RNF08 — Testabilidade:** Arquitetura desacoplada que permita execução de testes unitários de lógica de negócio e testes automatizados de ponta a ponta com Playwright.
