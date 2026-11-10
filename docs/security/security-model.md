# Modelo de Segurança e Conformidade LGPD — FitFlow

## 1. Princípios de Segurança e Filosofia

O FitFlow adota a abordagem **Security by Design** e o modelo de **Defesa em Profundidade (Defense-in-Depth)**, em conformidade com as diretrizes da skill `security-and-hardening` e os padrões **OWASP Top 10**.

### Princípios Inegociáveis:
1. **Zero Confiança no Cliente:** Qualquer dado recebido do navegador (incluindo IDs, headers, formulários e cookies de terceiros) é tratado como não confiável até validação completa no servidor.
2. **Contexto de Tenant Imutável e Derivado:** O identificador de inquilino (`tenant_id`) é resolvido exclusivamente a partir da sessão criptografada decodificada pelo servidor, nunca a partir de payloads enviados pelo cliente.
3. **Mínimo Privilégio:** Usuários só possuem acesso aos recursos e ações estritamente necessários para sua função (`COACH` vs `STUDENT`).
4. **Privacidade e Minimização LGPD:** O sistema não coleta dados de saúde desnecessários, limita campos biomédicos ao mínimo estritamente indispensável para a prescrição esportiva e protege a confidencialidade das anotações do treinador.

---

## 2. Modelagem de Ameaças (STRIDE por Fronteira de Confiança)

| Fronteira de Confiança | Elemento STRIDE | Cenário de Ameaça Identificado | Mitigação Arquitetural Implementada no FitFlow |
|---|---|---|---|
| **Rotas de Autenticação & Login** | **S**poofing (Falsificação) | Atacante tenta adivinhar credenciais por força bruta ou utilizar senhas vazadas. | Rate limiting por IP/E-mail (Upstash/Redis ou Vercel Edge limit), hash de senha com bcrypt (salt de 12 rounds) e bloqueio temporal após falhas sucessivas. |
| **Parâmetros de URL e APIs (IDOR)** | **E**levation of Privilege / **I**nformation Disclosure | Personal A altera o `student_id` na URL para acessar treinos e dados pessoais de alunos do Personal B. | O DAL (Data Access Layer) e os serviços exigem `tenant_id` validado em 100% das queries. Se o registro não pertencer ao tenant da sessão, retorna `404 Not Found` (impedindo enumeração de IDs existentes). |
| **Formulários e Inputs de Texto** | **T**ampering / Injection | Injeção de scripts maliciosos (XSS) em campos de nome de treino ou injeção de SQL via strings concatenadas. | Prisma ORM utiliza prepared statements parametrizados nativos; auto-escaping do React/JSX ativado; sanitização estrita com esquemas Zod na borda de entrada. |
| **Convites e Ativação de Conta** | **S**poofing / **T**ampering | Interceptação ou falsificação de link de convite para assumir o perfil de aluno de outra pessoa. | Tokens de convite gerados com `crypto.randomBytes(32)`, armazenados com hash SHA-256 no banco de dados, expiração estrita de 48 horas e invalidação imediata após o primeiro uso (`single-use`). |
| **Sessão e Cookies HTTP** | **T**ampering / **I**nformation Disclosure | Sequestro de sessão (Session Hijacking) ou Cross-Site Request Forgery (CSRF). | Cookies de sessão gerados pelo Auth.js com flags `HttpOnly`, `Secure` (em produção), `SameSite=Lax` e criptografia JWE baseada no segredo `AUTH_SECRET`. |
| **Upload de Mídia e Vídeos** | **T**ampering / **D**enial of Service | Envio de arquivos executáveis disfarçados de imagem (.php, .exe, .sh) ou vídeos gigantescos para esgotar o storage. | Upload direto para o Cloudflare R2 via Pre-Signed URLs assinadas no backend. Validação rigorosa de extensão, magic bytes e tamanho máximo (100MB para vídeo, 5MB para imagem). Nenhuma execução direta no servidor de aplicação. |
| **Auditoria e Ações Sensíveis** | **R**epudiation (Repúdio) | Treinador exclui dados ou acessa informações sem registro rastreável. | Entidade imutável `audit_logs` que registra `user_id`, `tenant_id`, `action`, `resource_id`, timestamp e IP para qualquer ação crítica. |

---

## 3. Matriz de Controles do Sistema (Três Níveis de Fronteira)

Em alinhamento direto com o checklist de `security-and-hardening`:

### 3.1. Práticas Obrigatórias Contínuas (Always Do)
- **Validação de Entrada:** Validação de 100% dos formulários e requisições via Zod antes de qualquer processamento de negócio.
- **Parametrização Total:** Nenhuma instrução SQL é montada por concatenação de strings (`prisma.$queryRawUnsafe` é terminantemente proibido).
- **Escape de Saída:** Nenhum componente React utiliza `dangerouslySetInnerHTML` com entradas vindas de usuários ou parâmetros externos.
- **Cabeçalhos de Segurança:** Configurados no `next.config.js` e Edge Middleware:
  - `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; ...`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **Gestão de Segredos:** Variáveis secretas (`AUTH_SECRET`, `DATABASE_URL`, `R2_SECRET_ACCESS_KEY`) nunca são expostas com prefixo `NEXT_PUBLIC_` e residem exclusivamente no `.env` seguro.

### 3.2. Ações que Exigem Aprovação e Revisão Estrutural (Ask First)
- Alterações no modelo de papéis de usuários (`OWNER`, `COACH`, `STUDENT`).
- Liberação de novos domínios externos em políticas de CORS ou CSP.
- Inclusão de novas categorias de dados pessoais sensíveis no formulário do aluno.

### 3.3. Práticas Terminantemente Proibidas (Never Do)
- **Nunca comitar segredos:** Chaves de API, tokens e senhas no repositório git.
- **Nunca confiar em validação exclusiva de frontend:** Todo schema de formulário possui validação correspondente no Server Action / Route Handler.
- **Nunca salvar senhas em texto puro:** Proibido uso de MD5 ou SHA1; apenas bcrypt/argon2 com salt.
- **Nunca armazenar tokens de sessão em `localStorage`:** Proibido para autenticação central, prevenindo roubo via XSS.
- **Nunca vazar stack traces em produção:** Respostas de erro ao cliente sempre utilizam mensagens genéricas e amigáveis, com log detalhado confinado ao servidor.

---

## 4. Prevenção de Acesso Horizontal e IDOR (Insecure Direct Object Reference)

### 4.1. O Padrão de Serviço Protegido
Para garantir que nenhum desenvolvedor se esqueça de validar o inquilino, o acesso aos dados é envelopado por serviços de domínio.

```typescript
// Exemplo de implementação padrão em /src/modules/students/services/student.service.ts
export async function getStudentById(studentId: string, currentTenantId: string) {
  // A consulta exige AMBOS os parâmetros:
  const student = await prisma.studentProfile.findFirst({
    where: {
      id: studentId,
      tenantId: currentTenantId, // Trava de segurança multi-tenant
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!student) {
    // Retorna Not Found tanto se o aluno não existir quanto se pertencer a outro tenant
    throw new NotFoundError("Aluno não encontrado ou acesso não autorizado.");
  }

  return student;
}
```

---

## 5. Conformidade com a Lei Geral de Proteção de Dados (LGPD)

O FitFlow trata dados de cidadãos brasileiros e enquadra-se como Operador ou Controlador nos termos da Lei 13.709/2018 (LGPD):

### 5.1. Minimização de Dados (Art. 6º, III)
- Coleta restrita ao necessário para a execução do serviço: Nome, E-mail, Data de Nascimento e Objetivo de Treino.
- O preenchimento de histórico de lesões ou restrições de saúde é **estritamente opcional**, com consentimento explícito e aviso de que a plataforma não realiza diagnóstico clínico ou médico.

### 5.2. Direitos do Titular (Art. 18)
- **Direito de Acesso e Portabilidade:** O aluno poderá solicitar a exportação de seu histórico de treinos e medidas em formato estruturado (JSON/CSV).
- **Direito de Revogação e Exclusão:** Mediante solicitação, os dados de identificação pessoal do aluno são anonimizados ou excluídos (*soft delete* com expurgo programado), mantendo apenas registros estatísticos anônimos necessários para cumprimento de obrigações contábeis e fiscais do personal trainer.

### 5.3. Segurança e Registro de Consentimento
- Termos de Uso e Política de Privacidade exibidos no primeiro login do treinador e na ativação da conta do aluno, registrando versão dos termos aceitos e timestamp no banco de dados.
