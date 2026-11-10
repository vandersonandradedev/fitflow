import type { EquipmentType, ExperienceLevel, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/db";

export interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  orderIndex: number;
}

export const INITIAL_CATEGORIES: SeedCategory[] = [
  { name: "Peito", slug: "peito", description: "Exercícios de empurrar horizontal e aduções escapuloumerais.", orderIndex: 1 },
  { name: "Costas", slug: "costas", description: "Tracionamentos verticais e remadas horizontais para dorsais e romboides.", orderIndex: 2 },
  { name: "Ombros", slug: "ombros", description: "Desenvolvimentos e abduções para deltoide anterior, lateral e posterior.", orderIndex: 3 },
  { name: "Bíceps", slug: "biceps", description: "Flexões de cotovelo para bíceps braquial, braquial e braquiorradial.", orderIndex: 4 },
  { name: "Tríceps", slug: "triceps", description: "Extensões de cotovelo para as cabeças longa, lateral e medial do tríceps.", orderIndex: 5 },
  { name: "Abdômen", slug: "abdomen", description: "Estabilização de core, flexão de tronco e anti-rotação.", orderIndex: 6 },
  { name: "Quadríceps", slug: "quadriceps", description: "Agachamentos, leg press e extensões de joelho.", orderIndex: 7 },
  { name: "Posterior de coxa", slug: "posterior-de-coxa", description: "Dobradiças de quadril (stiff/terra) e flexões de joelho.", orderIndex: 8 },
  { name: "Glúteos", slug: "gluteos", description: "Extensões e abduções de quadril para glúteo máximo e médio.", orderIndex: 9 },
  { name: "Panturrilhas", slug: "panturrilhas", description: "Flexões plantares para gastrocnêmio e sóleo.", orderIndex: 10 },
  { name: "Cardio", slug: "cardio", description: "Condicionamento cardiorrespiratório contínuo e intervalado.", orderIndex: 11 },
  { name: "Mobilidade", slug: "mobilidade", description: "Mobilidade articular de tornozelo, quadril, coluna torácica e ombros.", orderIndex: 12 },
];

interface SeedGlobalExercise {
  categorySlug: string;
  name: string;
  description: string;
  primaryMuscleGroup: string;
  secondaryMuscleGroups: string[];
  equipment: EquipmentType;
  difficulty: ExperienceLevel;
  imageUrl: string;
  instructions: Array<{ instruction: string; safetyTip?: string }>;
}

export const INITIAL_GLOBAL_EXERCISES: SeedGlobalExercise[] = [
  {
    categorySlug: "peito",
    name: "Supino Reto com Barra",
    description: "Exercício multiarticular clássico de empurrar horizontal para desenvolvimento global do peitoral.",
    primaryMuscleGroup: "Peitoral Maior",
    secondaryMuscleGroups: ["Tríceps Braquial", "Deltoide Anterior"],
    equipment: "BARBELL",
    difficulty: "INTERMEDIATE",
    imageUrl: "/images/exercises/push.svg",
    instructions: [
      {
        instruction: "Deite-se no banco plano com os pés firmes no solo e retraia as escápulas.",
        safetyTip: "Mantenha os punhos alinhados aos antebraços durante todo o percurso.",
      },
      {
        instruction: "Desça a barra de forma controlada até tocar suavemente a linha inferior do esterno.",
        safetyTip: "Não deixe a barra quicar no tórax.",
      },
      {
        instruction: "Empurre a barra de volta à posição inicial mantendo as escápulas estabilizadas no banco.",
      },
    ],
  },
  {
    categorySlug: "peito",
    name: "Supino Inclinado com Halteres",
    description: "Variação em banco inclinado (30°) com maior ênfase na porção clavicular do peitoral e amplitude livre.",
    primaryMuscleGroup: "Peitoral Superior",
    secondaryMuscleGroups: ["Deltoide Anterior", "Tríceps Braquial"],
    equipment: "DUMBBELL",
    difficulty: "BEGINNER",
    imageUrl: "/images/exercises/push.svg",
    instructions: [
      {
        instruction: "Ajuste o banco em aproximadamente 30 graus e posicione os halteres na linha dos ombros.",
      },
      {
        instruction: "Desça os halteres com cotovelos levemente fletidos abaixo da linha dos ombros (cerca de 45°).",
        safetyTip: "Evite abrir os cotovelos a 90° para proteger a articulação glenoumeral.",
      },
    ],
  },
  {
    categorySlug: "costas",
    name: "Puxada Frontal na Polia Alta",
    description: "Tracionamento vertical focado no grande dorsal e controle escapular.",
    primaryMuscleGroup: "Grande Dorsal",
    secondaryMuscleGroups: ["Bíceps Braquial", "Redondo Maior", "Romboides"],
    equipment: "CABLE",
    difficulty: "BEGINNER",
    imageUrl: "/images/exercises/pull.svg",
    instructions: [
      {
        instruction: "Segure a barra em pegada pronada um pouco além da largura dos ombros e fixe as coxas sob o apoio.",
      },
      {
        instruction: "Inicie o movimento deprimindo as escápulas e puxe a barra em direção à parte alta do peito.",
        safetyTip: "Evite jogar o tronco excessivamente para trás para roubar o movimento.",
      },
    ],
  },
  {
    categorySlug: "costas",
    name: "Remada Curvada com Barra",
    description: "Remada livre para espessura dorsal e fortalecimento isométrico dos eretores da espinha.",
    primaryMuscleGroup: "Dorsais e Romboides",
    secondaryMuscleGroups: ["Trapézio Médio", "Bíceps Braquial", "Eretores da Espinha"],
    equipment: "BARBELL",
    difficulty: "INTERMEDIATE",
    imageUrl: "/images/exercises/pull.svg",
    instructions: [
      {
        instruction: "Incline o tronco à frente mantendo a coluna neutra e joelhos semiflexionados.",
        safetyTip: "Mantenha o abdômen contraído para proteger a coluna lombar.",
      },
      {
        instruction: "Puxe a barra em direção à linha umbilical aproximando as escápulas no topo.",
      },
    ],
  },
  {
    categorySlug: "ombros",
    name: "Desenvolvimento com Halteres",
    description: "Empurrar vertical para fortalecimento de deltoides e estabilidade escapular.",
    primaryMuscleGroup: "Deltoide Anterior e Lateral",
    secondaryMuscleGroups: ["Tríceps Braquial", "Trapézio Superior"],
    equipment: "DUMBBELL",
    difficulty: "BEGINNER",
    imageUrl: "/images/exercises/push.svg",
    instructions: [
      {
        instruction: "Sentado com apoio dorsal firme, posicione os halteres na altura do queixo no plano escapular.",
      },
      {
        instruction: "Empurre os halteres acima da cabeça sem bater um no outro no topo.",
        safetyTip: "Não hiperestenda a região lombar durante a subida.",
      },
    ],
  },
  {
    categorySlug: "biceps",
    name: "Rosca Direta com Halteres",
    description: "Flexão de cotovelo com supinação para trabalho isolado dos flexores do braço.",
    primaryMuscleGroup: "Bíceps Braquial",
    secondaryMuscleGroups: ["Braquial", "Braquiorradial"],
    equipment: "DUMBBELL",
    difficulty: "BEGINNER",
    imageUrl: "/images/exercises/pull.svg",
    instructions: [
      {
        instruction: "Em pé, mantenha os cotovelos próximos ao tronco e flexione os antebraços supinando os punhos.",
        safetyTip: "Evite balançar o quadril para impulsionar a carga.",
      },
    ],
  },
  {
    categorySlug: "triceps",
    name: "Tríceps Corda na Polia Alta",
    description: "Extensão de cotovelos na polia para isolamento das três cabeças do tríceps.",
    primaryMuscleGroup: "Tríceps Braquial",
    secondaryMuscleGroups: ["Ancôneo"],
    equipment: "CABLE",
    difficulty: "BEGINNER",
    imageUrl: "/images/exercises/push.svg",
    instructions: [
      {
        instruction: "Mantenha os cotovelos fixos ao lado do tronco e estenda completamente os antebraços.",
        safetyTip: "Não deixe os cotovelos subirem na fase excêntrica.",
      },
    ],
  },
  {
    categorySlug: "abdomen",
    name: "Prancha Isométrica Ventral",
    description: "Estabilização isométrica do core e controle lombo-pélvico.",
    primaryMuscleGroup: "Reto Abdominal e Transverso",
    secondaryMuscleGroups: ["Oblíquos", "Glúteos"],
    equipment: "BODYWEIGHT",
    difficulty: "BEGINNER",
    imageUrl: "/images/exercises/core-cardio.svg",
    instructions: [
      {
        instruction: "Apoie antebraços e pontas dos pés no solo, alinhando cabeça, tronco e quadril.",
        safetyTip: "Não deixe o quadril cair em hiperlordose lombar.",
      },
    ],
  },
  {
    categorySlug: "quadriceps",
    name: "Agachamento Livre com Barra",
    description: "Exercício fundamental de membros inferiores para força e hipertrofia de quadríceps e glúteos.",
    primaryMuscleGroup: "Quadríceps",
    secondaryMuscleGroups: ["Glúteo Máximo", "Adutores", "Eretores da Espinha"],
    equipment: "BARBELL",
    difficulty: "INTERMEDIATE",
    imageUrl: "/images/exercises/lower.svg",
    instructions: [
      {
        instruction: "Apoie a barra sobre o trapézio, pés na largura dos ombros e inicie a descida flexionando quadril e joelhos.",
        safetyTip: "Mantenha os joelhos alinhados com a direção da ponta dos pés (evite valgo dinâmico).",
      },
      {
        instruction: "Suba empurrando o solo com toda a planta do pé mantendo o tronco firme.",
      },
    ],
  },
  {
    categorySlug: "posterior-de-coxa",
    name: "Stiff com Barra",
    description: "Padrão de dobradiça de quadril (hip hinge) focado no alongamento sob carga dos isquiotibiais.",
    primaryMuscleGroup: "Isquiotibiais",
    secondaryMuscleGroups: ["Glúteo Máximo", "Eretores da Espinha"],
    equipment: "BARBELL",
    difficulty: "INTERMEDIATE",
    imageUrl: "/images/exercises/lower.svg",
    instructions: [
      {
        instruction: "Com joelhos destravados e coluna neutra, projete o quadril para trás deslizando a barra próxima às coxas.",
        safetyTip: "Interrompa a descida assim que o quadril parar de recuar para não arredondar a lombar.",
      },
    ],
  },
  {
    categorySlug: "gluteos",
    name: "Elevação Pélvica com Barra",
    description: "Extensão de quadril com pico de contração em extensão completa para glúteo máximo.",
    primaryMuscleGroup: "Glúteo Máximo",
    secondaryMuscleGroups: ["Isquiotibiais", "Quadríceps"],
    equipment: "BARBELL",
    difficulty: "INTERMEDIATE",
    imageUrl: "/images/exercises/lower.svg",
    instructions: [
      {
        instruction: "Apoie a região inferior das escápulas no banco e posicione a barra acolchoada sobre o quadril.",
      },
      {
        instruction: "Estenda o quadril até alinhar coxas e tronco, mantendo o queixo levemente recolhido.",
        safetyTip: "Faça a extensão pelo quadril, não arqueando a lombar.",
      },
    ],
  },
  {
    categorySlug: "panturrilhas",
    name: "Panturrilha em Pé na Máquina",
    description: "Flexão plantar com joelhos estendidos para ênfase no gastrocnêmio.",
    primaryMuscleGroup: "Gastrocnêmio",
    secondaryMuscleGroups: ["Sóleo"],
    equipment: "MACHINE",
    difficulty: "BEGINNER",
    imageUrl: "/images/exercises/lower.svg",
    instructions: [
      {
        instruction: "Apoie o antepé na plataforma, desça em amplitude completa e suba até a contração máxima.",
        safetyTip: "Faça 1 segundo de pausa no pico e na base para evitar efeito elástico do tendão calcâneo.",
      },
    ],
  },
  {
    categorySlug: "cardio",
    name: "Bicicleta Ergométrica Intervalada",
    description: "Estímulo cardiorrespiratório de baixo impacto articular.",
    primaryMuscleGroup: "Sistema Cardiorrespiratório",
    secondaryMuscleGroups: ["Quadríceps", "Panturrilhas"],
    equipment: "MACHINE",
    difficulty: "BEGINNER",
    imageUrl: "/images/exercises/core-cardio.svg",
    instructions: [
      {
        instruction: "Ajuste a altura do selim na linha da crista ilíaca e alterne blocos fortes com recuperação ativa.",
      },
    ],
  },
  {
    categorySlug: "mobilidade",
    name: "Mobilidade Torácica em 4 Apoios",
    description: "Rotação de coluna torácica para ganho de amplitude e preparação para treinos superiores.",
    primaryMuscleGroup: "Coluna Torácica e Ombros",
    secondaryMuscleGroups: ["Core"],
    equipment: "BODYWEIGHT",
    difficulty: "BEGINNER",
    imageUrl: "/images/exercises/core-cardio.svg",
    instructions: [
      {
        instruction: "Em quatro apoios, apoie uma mão atrás da nuca e gire o cotovelo em direção ao teto acompanhando com o olhar.",
        safetyTip: "Mantenha o quadril estável para que a rotação ocorra na região torácica e não na lombar.",
      },
    ],
  },
];

/**
 * Popula as 12 categorias anatômicas e os exercícios globais iniciais de forma idempotente.
 */
export async function seedExerciseCatalog(db: PrismaClient = defaultPrisma): Promise<void> {
  const categoryMap = new Map<string, string>();

  for (const cat of INITIAL_CATEGORIES) {
    const record = await db.exerciseCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        orderIndex: cat.orderIndex,
      },
      create: cat,
      select: { id: true, slug: true },
    });
    categoryMap.set(record.slug, record.id);
  }

  for (const ex of INITIAL_GLOBAL_EXERCISES) {
    const categoryId = categoryMap.get(ex.categorySlug);
    if (!categoryId) continue;

    const existing = await db.exercise.findFirst({
      where: { isGlobal: true, tenantId: null, name: ex.name },
      select: { id: true },
    });
    if (existing) continue;

    await db.exercise.create({
      data: {
        tenantId: null,
        isGlobal: true,
        categoryId,
        name: ex.name,
        description: ex.description,
        primaryMuscleGroup: ex.primaryMuscleGroup,
        secondaryMuscleGroups: ex.secondaryMuscleGroups,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        instructions: {
          create: ex.instructions.map((step, index) => ({
            stepNumber: index + 1,
            instruction: step.instruction,
            safetyTip: step.safetyTip,
          })),
        },
        media: {
          create: [
            {
              mediaType: "IMAGE",
              url: ex.imageUrl,
              storageProvider: "EXTERNAL",
              orderIndex: 0,
            },
          ],
        },
      },
    });
  }
}
