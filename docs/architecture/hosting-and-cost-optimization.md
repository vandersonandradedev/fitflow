# FitFlow — Arquitetura de Otimização de Custos e Hospedagem

Este documento define as diretrizes e mecanismos técnicos implementados no **FitFlow** para garantir **custo mínimo de infraestrutura**, prevenindo sobretaxas de tráfego (egress), processamento serverless desnecessário e consumo excessivo de armazenamento.

---

## 1. Mídia e Imagens: Estratégia de Custo Zero (Link-First & Egress Zero)

### O Problema em Arquiteturas Convencionais
- Armazenar imagens no sistema de arquivos local (`/public/uploads`) falha em ambientes serverless (Vercel) e incha os deploys.
- O componente padrão `next/image` processa imagens remotas através de Edge Functions da Vercel (`/_next/image`), gerando cobranças após a cota inicial (1.000 a 5.000 imagens).
- Fazer uploads de fotos e vídeos passando pela função serverless da Vercel consome memória, tempo de execução e esbarra no limite rígido de payload de 4.5 MB.

### A Solução Implementada no FitFlow

```
┌─────────────────┐      1. Solicita link PUT       ┌──────────────────────┐
│  Browser Aluno/ │ ───────────────────────────────>│ Next.js Serverless   │
│   Treinador     │ <───────────────────────────────│ (valida sessão/MIME) │
└────────┬────────┘      2. Pre-signed URL curta    └──────────────────────┘
         │
         │ 3. Upload direto binário (PUT via fetch)
         ▼
┌─────────────────────────┐
│ Cloudflare R2 Bucket    │ (Zero taxa de egress/tráfego de saída)
└────────┬────────────────┘
         │
         │ 4. Download direto via CDN (Cache-Control nativo)
         ▼
┌─────────────────┐
│ Navegador Final │ (Carrega via tag <img> / SafeImage nativa com lazy-loading)
└─────────────────┘
```

1. **`images.unoptimized: true` no `next.config.ts`**:
   - Desativa a re-compressão de imagens na Vercel.
   - **Zero cobrança** de Vercel Image Transformations.
   - As imagens são requisitadas diretamente do CDN de origem pelo navegador do cliente.

2. **Renderização Otimizada com `SafeImage` e `MediaPreview`**:
   - Atributos nativos de alta performance: `loading="lazy"`, `decoding="async"`, `referrerPolicy="no-referrer"`.
   - Fallback gracioso com ícones SVG vetoriais em linha caso o link externo falhe, evitando requisições extras.

3. **Integração Externa Inteligente (YouTube & Vimeo)**:
   - Em vez de baixar ou gerar thumbnails de vídeos, o módulo [`src/modules/media/links.ts`](file:///c:/dev/fitflow/src/modules/media/links.ts) extrai o ID do vídeo e monta a URL oficial do CDN do Google:
     `https://img.youtube.com/vi/<VIDEO_ID>/hqdefault.jpg`.
   - Custo para o servidor FitFlow: **0 bytes, 0 dólares**.

4. **Uploads Diretos via Cloudflare R2 Pre-signed URLs**:
   - Implementado em [`src/modules/media/r2.ts`](file:///c:/dev/fitflow/src/modules/media/r2.ts).
   - O servidor Next.js apenas autentica e gera a URL pré-assinada (`PutObjectCommand`, expiração em 15 minutos).
   - O binário vai diretamente do browser para o Cloudflare R2 via HTTP `PUT`.
   - O Cloudflare R2 possui **taxa zero de egress** (data transfer out gratuito).

---

## 2. Banco de Dados Neon PostgreSQL: Otimização de Computação e Armazenamento

No Neon Postgres, os custos são determinados por **horas de computação ativa (Compute Units - CU)** e **armazenamento ativo**.

### A. Maximização do Scale-to-Zero
Computes do Neon são configurados para suspensão automática após 5 minutos de inatividade:
- Consultas mal indexadas forçam a CPU a trabalhar por mais tempo e realizam varreduras de tabela inteira (Seq Scan).
- **Índices Adicionados**:
  - `rate_limits(window_start)`: permite limpeza instantânea de janelas expiradas.
  - `verification_tokens(expires)`: busca rápida de tokens válidos e expurgos.
  - `password_reset_tokens(expires_at, used_at)`: expurgo eficiente de tokens consumidos.
  - `sessions(user_id, expires)`: validação rápida e limpeza de sessões órfãs.
  - `exercise_logs(exercise_id)`: cálculo de 1RM e tonelagem sem full table scan.
  - `notifications(tenant_id, created_at)`: paginação e limpeza de notificações antigas.
  - `audit_logs(created_at)`: expurgo da retenção histórica sem travar o banco.

### B. Prevenção de Egress Excessivo (Anti Over-fetching)
- O Prisma ORM é configurado para projetar estritamente as colunas necessárias via `select: { ... }`.
- Nenhum endpoint lista tabelas inteiras ou campos de auditoria em massa sem paginação.

### C. Rotina Automatizada de Housekeeping (`/api/cron/cleanup`)
Implementada em [`src/modules/maintenance/cleanup.ts`](file:///c:/dev/fitflow/src/modules/maintenance/cleanup.ts) e exposta via [`/api/cron/cleanup`](file:///c:/dev/fitflow/src/app/api/cron/cleanup/route.ts):
- Expura contadores de rate limit com mais de 24 horas.
- Expura tokens de verificação com mais de 48 horas.
- Expura tokens de reset de senha já utilizados ou expirados.
- Expura notificações lidas com mais de 60 dias.
- Expura logs de auditoria acima de 90 dias.
- Pode ser acionada diariamente através de Vercel Cron Jobs (`vercel.json`) com cabeçalho `Authorization: Bearer <CRON_SECRET>`.

---

## 3. Otimização de Serverless Bundles e Cold Starts (Vercel)

1. **`experimental.optimizePackageImports`**:
   - Configurado para `["lucide-react", "recharts", "date-fns"]`.
   - Reduz os artefatos de build das funções Serverless em até 60%, diminuindo a memória necessária e os tempos de inicialização a frio (cold start).

2. **Compressão e Cache de Borda**:
   - `compress: true` ativo no Next.js.
   - Headers `Cache-Control: public, max-age=31536000, immutable` para ícones do PWA e assets estáticos.
