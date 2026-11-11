import { prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";
import { EquipmentType, ExperienceLevel, DayOfWeek, WorkoutSectionType } from "@prisma/client";

const CDN_BASE = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main/";

interface ExerciseSeedDef {
  key: string;
  name: string;
  categorySlug: string;
  equipment: EquipmentType;
  difficulty: ExperienceLevel;
  primaryMuscleGroup: string;
  secondaryMuscleGroups: string[];
  description: string;
  gifPath: string;
}

const EXERCISE_DEFINITIONS: Record<string, ExerciseSeedDef> = {
  alongamento_peitoral: {
    key: "alongamento_peitoral",
    name: "Alongamento de Peitoral Espaldar",
    categorySlug: "mobilidade",
    equipment: EquipmentType.BODYWEIGHT,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Peitoral Maior",
    secondaryMuscleGroups: ["Deltoide Anterior"],
    description: "Alongamento estático/dinâmico de peitoral no espaldar ou anteparo.",
    gifPath: "calves/calf-stretch-with-hands-against-wall.gif",
  },
  mobilidade_ombro_vii: {
    key: "mobilidade_ombro_vii",
    name: "Mobilidade de Ombro VII",
    categorySlug: "mobilidade",
    equipment: EquipmentType.BODYWEIGHT,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Manguito Rotador",
    secondaryMuscleGroups: ["Deltoides", "Cintura Escapular"],
    description: "Exercício de mobilidade e circundução de ombros para aquecimento articular.",
    gifPath: "traps/scapular-pull-up.gif",
  },
  supino_inclinado_halteres: {
    key: "supino_inclinado_halteres",
    name: "Supino inclinado com halteres",
    categorySlug: "peito",
    equipment: EquipmentType.DUMBBELL,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Peitoral Superior",
    secondaryMuscleGroups: ["Deltoide Anterior", "Tríceps Braquial"],
    description: "Supino em banco a 30-45° com halteres. Controle na descida e 2s em alongamento.",
    gifPath: "pectorals/dumbbell-incline-bench-press.gif",
  },
  voador_fly: {
    key: "voador_fly",
    name: "Voador - FLY",
    categorySlug: "peito",
    equipment: EquipmentType.MACHINE,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Peitoral Maior",
    secondaryMuscleGroups: ["Deltoide Anterior"],
    description: "Crucifixo na máquina Pec Deck com 1s no pico de contração.",
    gifPath: "pectorals/lever-seated-fly.gif",
  },
  supino_reto_barra: {
    key: "supino_reto_barra",
    name: "Supino reto com barra reta",
    categorySlug: "peito",
    equipment: EquipmentType.BARBELL,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Peitoral Maior",
    secondaryMuscleGroups: ["Tríceps Braquial", "Deltoide Anterior"],
    description: "Supino plano com barra reta. Aplicação de Cluster Set na última série.",
    gifPath: "pectorals/barbell-bench-press.gif",
  },
  elevacao_lateral_halteres: {
    key: "elevacao_lateral_halteres",
    name: "Elevação lateral com halteres",
    categorySlug: "ombros",
    equipment: EquipmentType.DUMBBELL,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Deltoide Lateral",
    secondaryMuscleGroups: ["Trapézio"],
    description: "Abdução de ombros com halteres, abdômen firme e cotovelos alinhados.",
    gifPath: "delts/dumbbell-lateral-raise.gif",
  },
  triceps_corda: {
    key: "triceps_corda",
    name: "Tríceps corda",
    categorySlug: "triceps",
    equipment: EquipmentType.CABLE,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Tríceps Braquial",
    secondaryMuscleGroups: ["Ancôneo"],
    description: "Extensão de tríceps na polia alta com corda e cotovelos travados junto às axilas.",
    gifPath: "triceps/cable-pushdown-with-rope-attachment.gif",
  },
  triceps_testa_halteres: {
    key: "triceps_testa_halteres",
    name: "Tríceps testa com halteres",
    categorySlug: "triceps",
    equipment: EquipmentType.DUMBBELL,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Tríceps Braquial",
    secondaryMuscleGroups: ["Cabeça Longa"],
    description: "Extensão de cotovelos deitado com halteres com descida até as têmporas.",
    gifPath: "triceps/barbell-lying-triceps-extension-skull-crusher.gif",
  },
  alongamento_dorsal_espaldar: {
    key: "alongamento_dorsal_espaldar",
    name: "Alongamento grande dorsal - espaldar",
    categorySlug: "mobilidade",
    equipment: EquipmentType.BODYWEIGHT,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Grande Dorsal",
    secondaryMuscleGroups: ["Redondo Maior"],
    description: "Alongamento de grande dorsal no espaldar ou sustentação em barra fixa.",
    gifPath: "lats/seated-lower-back-stretch.gif",
  },
  wall_hall_slid: {
    key: "wall_hall_slid",
    name: "Wall Hall slid na parede",
    categorySlug: "mobilidade",
    equipment: EquipmentType.BODYWEIGHT,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Mobilidade Escapular",
    secondaryMuscleGroups: ["Deltoides", "Trapézio Inferior"],
    description: "Deslizamento de braços na parede mantendo costas e cotovelos alinhados.",
    gifPath: "calves/calf-stretch-with-hands-against-wall.gif",
  },
  barra_fixa_neutra: {
    key: "barra_fixa_neutra",
    name: "Barra fixa pegada neutra",
    categorySlug: "costas",
    equipment: EquipmentType.BODYWEIGHT,
    difficulty: ExperienceLevel.ADVANCED,
    primaryMuscleGroup: "Grande Dorsal",
    secondaryMuscleGroups: ["Bíceps Braquial", "Braquiorradial"],
    description: "Tração vertical em pegada neutra paralela focando em depressão escapular.",
    gifPath: "lats/pull-up-neutral-grip.gif",
  },
  puxada_alta_pronada: {
    key: "puxada_alta_pronada",
    name: "Puxada alta pegada pronada",
    categorySlug: "costas",
    equipment: EquipmentType.CABLE,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Grande Dorsal",
    secondaryMuscleGroups: ["Bíceps Braquial", "Romboides"],
    description: "Puxada frontal na polia alta com pegada pronada aberta.",
    gifPath: "lats/cable-lat-pulldown-full-range-of-motion.gif",
  },
  remada_unilateral_serrote: {
    key: "remada_unilateral_serrote",
    name: "Remada curvada unilateral serrote",
    categorySlug: "costas",
    equipment: EquipmentType.DUMBBELL,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Grande Dorsal",
    secondaryMuscleGroups: ["Romboides", "Bíceps Braquial"],
    description: "Remada unilateral com halteres no banco puxando em direção ao quadril.",
    gifPath: "upper-back/dumbbell-bent-over-row.gif",
  },
  remada_cavalinho_maquina: {
    key: "remada_cavalinho_maquina",
    name: "Remada cavalinho máquina",
    categorySlug: "costas",
    equipment: EquipmentType.MACHINE,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Dorsais e Romboides",
    secondaryMuscleGroups: ["Trapézio Médio", "Bíceps Braquial"],
    description: "Remada T-Bar ou máquina com apoio torácico e tração controlada.",
    gifPath: "upper-back/lever-t-bar-reverse-grip-row.gif",
  },
  crucifixo_inverso_maquina: {
    key: "crucifixo_inverso_maquina",
    name: "Crucifixo inverso máquina",
    categorySlug: "ombros",
    equipment: EquipmentType.MACHINE,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Deltoide Posterior",
    secondaryMuscleGroups: ["Romboides", "Trapézio"],
    description: "Abdução horizontal de ombro no Pec Deck inverso.",
    gifPath: "delts/lever-seated-reverse-fly.gif",
  },
  rosca_direta_barra: {
    key: "rosca_direta_barra",
    name: "Rosca direta com barra",
    categorySlug: "biceps",
    equipment: EquipmentType.BARBELL,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Bíceps Braquial",
    secondaryMuscleGroups: ["Braquial", "Braquiorradial"],
    description: "Rosca direta com barra reta e cotovelos alinhados ao tronco.",
    gifPath: "biceps/barbell-biceps-curl-with-arm-blaster.gif",
  },
  rosca_scott_pulley: {
    key: "rosca_scott_pulley",
    name: "Rosca Scott pulley",
    categorySlug: "biceps",
    equipment: EquipmentType.CABLE,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Bíceps Braquial",
    secondaryMuscleGroups: ["Braquial"],
    description: "Flexão de cotovelos no banco Scott com cabo na polia baixa.",
    gifPath: "biceps/cable-one-arm-preacher-curl.gif",
  },
  alongamento_isquiotibiais_deitado: {
    key: "alongamento_isquiotibiais_deitado",
    name: "Alongamento de isquiotibiais deitado",
    categorySlug: "mobilidade",
    equipment: EquipmentType.BODYWEIGHT,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Isquiotibiais",
    secondaryMuscleGroups: ["Glúteos"],
    description: "Alongamento de posteriores da coxa deitado puxando a perna sem flexionar o joelho.",
    gifPath: "hamstrings/hamstring-stretch.gif",
  },
  mobilidade_quadril_borboleta: {
    key: "mobilidade_quadril_borboleta",
    name: "Mobilidade de quadril - borboleta",
    categorySlug: "mobilidade",
    equipment: EquipmentType.BODYWEIGHT,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Adutores de Quadril",
    secondaryMuscleGroups: ["Fascia Pélvica"],
    description: "Posição de borboleta sentado projetando os joelhos para o chão.",
    gifPath: "adductors/butterfly-yoga-pose.gif",
  },
  mobilidade_tornozelo: {
    key: "mobilidade_tornozelo",
    name: "Mobilidade de tornozelo",
    categorySlug: "mobilidade",
    equipment: EquipmentType.BODYWEIGHT,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Tornozelo",
    secondaryMuscleGroups: ["Gastrocnêmio", "Sóleo"],
    description: "Projeção de joelhos para frente e rotação articular sem desencostar calcanhar.",
    gifPath: "calves/ankle-circles.gif",
  },
  cadeira_abdutora: {
    key: "cadeira_abdutora",
    name: "Cadeira abdutora 90°",
    categorySlug: "gluteos",
    equipment: EquipmentType.MACHINE,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Glúteo Médio",
    secondaryMuscleGroups: ["Glúteo Mínimo", "TFL"],
    description: "Abdução de quadril na máquina com tronco ereto a 90°.",
    gifPath: "abductors/lever-seated-hip-abduction.gif",
  },
  agachamento_sumo_maquina: {
    key: "agachamento_sumo_maquina",
    name: "Agachamento sumô máquina",
    categorySlug: "quadriceps",
    equipment: EquipmentType.MACHINE,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Quadríceps e Glúteos",
    secondaryMuscleGroups: ["Adutores"],
    description: "Agachamento sumô guiado na máquina com pés afastados em rotação externa.",
    gifPath: "glutes/smith-sumo-squat.gif",
  },
  leg_press_45: {
    key: "leg_press_45",
    name: "Leg press 45",
    categorySlug: "quadriceps",
    equipment: EquipmentType.MACHINE,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Quadríceps",
    secondaryMuscleGroups: ["Glúteo Máximo", "Isquiotibiais"],
    description: "Pressão de pernas no Leg Press 45 com controle na flexão.",
    gifPath: "glutes/sled-45-leg-press.gif",
  },
  cadeira_extensora: {
    key: "cadeira_extensora",
    name: "Cadeira extensora",
    categorySlug: "quadriceps",
    equipment: EquipmentType.MACHINE,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Quadríceps",
    secondaryMuscleGroups: ["Reto Femoral"],
    description: "Extensão de joelhos com 1s no pico de contração.",
    gifPath: "quads/lever-leg-extension.gif",
  },
  mesa_flexora: {
    key: "mesa_flexora",
    name: "Mesa flexora",
    categorySlug: "posterior-de-coxa",
    equipment: EquipmentType.MACHINE,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Isquiotibiais",
    secondaryMuscleGroups: ["Gastrocnêmio"],
    description: "Flexão de joelhos na mesa flexora com quadril estabilizado.",
    gifPath: "hamstrings/lever-lying-leg-curl.gif",
  },
  panturrilha_em_pe: {
    key: "panturrilha_em_pe",
    name: "Panturrilha em pé",
    categorySlug: "panturrilhas",
    equipment: EquipmentType.MACHINE,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Gastrocnêmio",
    secondaryMuscleGroups: ["Sóleo"],
    description: "Flexão plantar em pé com descida controlada em 3s e 1s de pico.",
    gifPath: "calves/lever-standing-calf-raise.gif",
  },
  crucifixo_crossover_inferior: {
    key: "crucifixo_crossover_inferior",
    name: "Crucifixo crossover peito inferior",
    categorySlug: "peito",
    equipment: EquipmentType.CABLE,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Peitoral Inferior",
    secondaryMuscleGroups: ["Deltoide Anterior"],
    description: "Crossover com polias altas e fechamento descendente.",
    gifPath: "pectorals/cable-standing-up-straight-crossovers.gif",
  },
  supino_reto_halteres: {
    key: "supino_reto_halteres",
    name: "Supino reto com halteres",
    categorySlug: "peito",
    equipment: EquipmentType.DUMBBELL,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Peitoral Maior",
    secondaryMuscleGroups: ["Tríceps Braquial", "Deltoide Anterior"],
    description: "Supino plano com halteres livres com descida controlada.",
    gifPath: "pectorals/dumbbell-bench-press.gif",
  },
  triceps_paralelas_graviton: {
    key: "triceps_paralelas_graviton",
    name: "Tríceps Paralelas Gráviton",
    categorySlug: "triceps",
    equipment: EquipmentType.MACHINE,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Tríceps Braquial",
    secondaryMuscleGroups: ["Peitoral", "Deltoide Anterior"],
    description: "Mergulho em paralelas com assistência do Gráviton mantendo o tronco ereto.",
    gifPath: "pectorals/assisted-chest-dip-kneeling.gif",
  },
  crossover_polia_alta: {
    key: "crossover_polia_alta",
    name: "Crossover Polia Alta",
    categorySlug: "peito",
    equipment: EquipmentType.CABLE,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Peitoral Maior",
    secondaryMuscleGroups: ["Deltoide Anterior"],
    description: "Crucifixo na polia alta com contração no centro do tórax.",
    gifPath: "pectorals/cable-upper-chest-crossovers.gif",
  },
  triceps_frances_polia: {
    key: "triceps_frances_polia",
    name: "Tríceps francês polia",
    categorySlug: "triceps",
    equipment: EquipmentType.CABLE,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Tríceps Cabeça Longa",
    secondaryMuscleGroups: ["Tríceps Lateral"],
    description: "Extensão de tríceps sobre a cabeça na polia alta com corda.",
    gifPath: "triceps/cable-high-pulley-overhead-tricep-extension.gif",
  },
  triceps_pulley_pronada: {
    key: "triceps_pulley_pronada",
    name: "Tríceps pulley pronada",
    categorySlug: "triceps",
    equipment: EquipmentType.CABLE,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Tríceps Braquial",
    secondaryMuscleGroups: ["Ancôneo"],
    description: "Extensão de tríceps na polia alta com pegada pronada na barra reta.",
    gifPath: "triceps/cable-pushdown.gif",
  },
  puxada_unilateral_neutra: {
    key: "puxada_unilateral_neutra",
    name: "Puxada unilateral pegada neutra",
    categorySlug: "costas",
    equipment: EquipmentType.CABLE,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Grande Dorsal",
    secondaryMuscleGroups: ["Bíceps Braquial"],
    description: "Puxada vertical unilateral com pegador estribo em pegada neutra.",
    gifPath: "lats/cable-one-arm-pulldown.gif",
  },
  remada_baixa_pronada: {
    key: "remada_baixa_pronada",
    name: "Remada baixa pronada",
    categorySlug: "costas",
    equipment: EquipmentType.CABLE,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Dorsais e Romboides",
    secondaryMuscleGroups: ["Trapézio Médio", "Bíceps"],
    description: "Remada sentada na polia baixa com barra e pegada pronada.",
    gifPath: "upper-back/cable-seated-row.gif",
  },
  rosca_banco_135: {
    key: "rosca_banco_135",
    name: "Rosca banco 135°",
    categorySlug: "biceps",
    equipment: EquipmentType.DUMBBELL,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Bíceps Braquial",
    secondaryMuscleGroups: ["Braquial"],
    description: "Rosca com halteres em banco inclinado a 45/135° gerando estiramento da cabeça longa.",
    gifPath: "biceps/dumbbell-incline-biceps-curl.gif",
  },
  rosca_direta_halteres_sentado: {
    key: "rosca_direta_halteres_sentado",
    name: "Rosca direta halteres sentado",
    categorySlug: "biceps",
    equipment: EquipmentType.DUMBBELL,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Bíceps Braquial",
    secondaryMuscleGroups: ["Braquial"],
    description: "Rosca simultânea sentado com halteres isolando os braços.",
    gifPath: "biceps/dumbbell-seated-biceps-curl-to-shoulder-press.gif",
  },
  rosca_martelo_halteres: {
    key: "rosca_martelo_halteres",
    name: "Rosca martelo halteres",
    categorySlug: "biceps",
    equipment: EquipmentType.DUMBBELL,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Braquiorradial",
    secondaryMuscleGroups: ["Braquial", "Bíceps Braquial"],
    description: "Rosca martelo com pegada neutra para desenvolvimento de antebraço e braquial.",
    gifPath: "biceps/dumbbell-alternate-seated-hammer-curl.gif",
  },
  alongamento_posterior_pe: {
    key: "alongamento_posterior_pe",
    name: "Alongamento posterior em pé",
    categorySlug: "mobilidade",
    equipment: EquipmentType.BODYWEIGHT,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Isquiotibiais",
    secondaryMuscleGroups: ["Lombar", "Gastrocnêmio"],
    description: "Alongamento em pé com pés unidos tocando as mãos ao solo.",
    gifPath: "hamstrings/hamstring-stretch.gif",
  },
  elevacao_pelvica_maquina: {
    key: "elevacao_pelvica_maquina",
    name: "Elevação pélvica máquina",
    categorySlug: "gluteos",
    equipment: EquipmentType.MACHINE,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Glúteo Máximo",
    secondaryMuscleGroups: ["Isquiotibiais"],
    description: "Elevação pélvica na máquina ou com barra sobre o quadril.",
    gifPath: "glutes/barbell-glute-bridge.gif",
  },
  levantamento_terra_sumo: {
    key: "levantamento_terra_sumo",
    name: "Levantamento terra sumô",
    categorySlug: "posterior-de-coxa",
    equipment: EquipmentType.BARBELL,
    difficulty: ExperienceLevel.ADVANCED,
    primaryMuscleGroup: "Glúteos e Isquiotibiais",
    secondaryMuscleGroups: ["Adutores", "Eretores"],
    description: "Terra sumô com barra colada às tíbias e tronco firme.",
    gifPath: "glutes/barbell-sumo-deadlift.gif",
  },
  stiff_barra_livre: {
    key: "stiff_barra_livre",
    name: "Stiff pés afastados Barra Livre",
    categorySlug: "posterior-de-coxa",
    equipment: EquipmentType.BARBELL,
    difficulty: ExperienceLevel.INTERMEDIATE,
    primaryMuscleGroup: "Isquiotibiais",
    secondaryMuscleGroups: ["Glúteo Máximo", "Eretores da Espinha"],
    description: "Stiff com base ligeiramente afastada e barra raspando nas pernas sem flexão de joelhos.",
    gifPath: "glutes/barbell-romanian-deadlift.gif",
  },
  cadeira_flexora: {
    key: "cadeira_flexora",
    name: "Cadeira flexora",
    categorySlug: "posterior-de-coxa",
    equipment: EquipmentType.MACHINE,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Isquiotibiais",
    secondaryMuscleGroups: ["Gastrocnêmio"],
    description: "Flexão de pernas sentado com pausa isométrica de 1s e drop set na última.",
    gifPath: "hamstrings/lever-seated-leg-curl.gif",
  },
  alongamento_adutor_espaldar: {
    key: "alongamento_adutor_espaldar",
    name: "Alongamento Adutor Espaldar",
    categorySlug: "mobilidade",
    equipment: EquipmentType.BODYWEIGHT,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Adutores",
    secondaryMuscleGroups: ["Quadril"],
    description: "Alongamento sentado sobre uma caixa ou no espaldar para proteger o quadril.",
    gifPath: "adductors/butterfly-yoga-pose.gif",
  },
  alongamento_adutores_coluna: {
    key: "alongamento_adutores_coluna",
    name: "Alongamento de Adutores e Coluna",
    categorySlug: "mobilidade",
    equipment: EquipmentType.BODYWEIGHT,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Adutores e Coluna",
    secondaryMuscleGroups: ["Paravertebrais"],
    description: "Alongamento dinâmico e respiratório combinando coluna e adutores.",
    gifPath: "spine/spine-stretch.gif",
  },
  alongamento_coluna_i: {
    key: "alongamento_coluna_i",
    name: "Alongamento de Coluna I",
    categorySlug: "mobilidade",
    equipment: EquipmentType.BODYWEIGHT,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Coluna Torácica e Lombar",
    secondaryMuscleGroups: ["Eretores da Espinha"],
    description: "Mobilização de um lado para o outro com 2s de pausa em cada extremidade.",
    gifPath: "spine/spine-stretch.gif",
  },
  flexao_extensao_coluna: {
    key: "flexao_extensao_coluna",
    name: "Flexão e extensão de coluna",
    categorySlug: "mobilidade",
    equipment: EquipmentType.BODYWEIGHT,
    difficulty: ExperienceLevel.BEGINNER,
    primaryMuscleGroup: "Coluna Paravertebral",
    secondaryMuscleGroups: ["Core"],
    description: "Mobilidade em 4 apoios flexionando e estendendo a coluna (Gato-Camelo).",
    gifPath: "spine/upward-facing-dog.gif",
  },
};

interface PrescribedSetItem {
  setNumber: number;
  repsTarget: string;
  restSeconds: number;
}

interface PrescribedExerciseItem {
  exerciseKey: string;
  sectionType: WorkoutSectionType;
  coachNotes?: string;
  sets: PrescribedSetItem[];
}

interface RoutineDayItem {
  name: string;
  dayOfWeek: DayOfWeek;
  description: string;
  exercises: PrescribedExerciseItem[];
}

// PROGRAMA 1: Rotina: Treino- Adaptação - GARROSTEAM (6 dias)
const ROUTINE_GARROS_DAYS: RoutineDayItem[] = [
  {
    name: "Dia 1: Peito, estímulo em ombro e tríceps",
    dayOfWeek: DayOfWeek.MONDAY,
    description: "Ênfase em peitoral, deltoide anterior e extensão de tríceps.",
    exercises: [
      {
        exerciseKey: "alongamento_peitoral",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes: "A intenção aqui é alongar o peitoral.",
        sets: [
          { setNumber: 1, repsTarget: "30s", restSeconds: 20 },
          { setNumber: 2, repsTarget: "30s", restSeconds: 20 },
        ],
      },
      {
        exerciseKey: "mobilidade_ombro_vii",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes: "Mobilidade e aquecimento para a cintura escapular.",
        sets: [
          { setNumber: 1, repsTarget: "15", restSeconds: 30 },
          { setNumber: 2, repsTarget: "15", restSeconds: 30 },
        ],
      },
      {
        exerciseKey: "supino_inclinado_halteres",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes:
          "Mantenha o controle da descida durante a fase excêntrica, segure 2 segundos em alongamento. Repita em todas as repetições. Feeder: série sem atingir a falha. Pesadas: carga máxima para a quantidade proposta.",
        sets: [
          { setNumber: 1, repsTarget: "15 (Aquecimento)", restSeconds: 60 },
          { setNumber: 2, repsTarget: "15 (Aquecimento)", restSeconds: 60 },
          { setNumber: 3, repsTarget: "12 (Feeder)", restSeconds: 90 },
          { setNumber: 4, repsTarget: "10 a 12 (Pesada)", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "voador_fly",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes:
          "A cada repetição segure 1 segundo no pico de contração e controle a volta do peso. As 2 primeiras são de aquecimento. A última série busque atingir a falha e logo reduza 20% do peso em drop set.",
        sets: [
          { setNumber: 1, repsTarget: "15 (Moderada)", restSeconds: 60 },
          { setNumber: 2, repsTarget: "15 (Moderada)", restSeconds: 60 },
          { setNumber: 3, repsTarget: "12 (Moderada-alta)", restSeconds: 90 },
          { setNumber: 4, repsTarget: "12 (Moderada-alta)", restSeconds: 90 },
          { setNumber: 5, repsTarget: "7-9 + 1 drop set (Pesada)", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "supino_reto_barra",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes:
          "Nas duas primeiras séries deixe 2-3 reps na reserva. Na terceira série busque a falha. Ao final descanse 40s e faça 3 reps, descanse 10s e faça 3 reps (Cluster Set de 4 blocos).",
        sets: [
          { setNumber: 1, repsTarget: "12 (Moderada)", restSeconds: 90 },
          { setNumber: 2, repsTarget: "12 (Moderada)", restSeconds: 90 },
          { setNumber: 3, repsTarget: "8 a 10 (Cluster Set 4x3 reps)", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "elevacao_lateral_halteres",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes:
          "Mantenha abdômen contraído e foque em elevar apenas o ombro com cotovelos esticados. A última série reduza 30% da carga e faça o máximo de repetições até a falha.",
        sets: [
          { setNumber: 1, repsTarget: "20 (Aquecimento)", restSeconds: 60 },
          { setNumber: 2, repsTarget: "15 (Moderada)", restSeconds: 60 },
          { setNumber: 3, repsTarget: "8 a 12 + 1 drop (30% - peso)", restSeconds: 60 },
        ],
      },
      {
        exerciseKey: "triceps_corda",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes:
          "Aperte os cotovelos contra as axilas a fim de manter maior estabilização do ombro. Busque a falha nas duas últimas séries e reduza 20% do peso para drop set.",
        sets: [
          { setNumber: 1, repsTarget: "15", restSeconds: 60 },
          { setNumber: 2, repsTarget: "15", restSeconds: 60 },
          { setNumber: 3, repsTarget: "8 a 12 + 1 drop", restSeconds: 60 },
        ],
      },
      {
        exerciseKey: "triceps_testa_halteres",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Controle a descida até as têmporas e estenda mantendo os cotovelos fechados.",
        sets: [
          { setNumber: 1, repsTarget: "20 (Aquecimento)", restSeconds: 60 },
          { setNumber: 2, repsTarget: "12 a 15", restSeconds: 60 },
          { setNumber: 3, repsTarget: "12 a 15", restSeconds: 60 },
        ],
      },
    ],
  },
  {
    name: "Dia 2: Costa , estímulo em posterior de ombro e bíceps",
    dayOfWeek: DayOfWeek.TUESDAY,
    description: "Tracionamentos verticais, horizontais, posterior de ombro e flexores de cotovelo.",
    exercises: [
      {
        exerciseKey: "alongamento_dorsal_espaldar",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes: "Caso na sua academia não tenha espaldar, pendure-se na barra fixa pelo tempo proposto.",
        sets: [
          { setNumber: 1, repsTarget: "20s", restSeconds: 20 },
          { setNumber: 2, repsTarget: "20s", restSeconds: 20 },
        ],
      },
      {
        exerciseKey: "wall_hall_slid",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes: "Deslize as escápulas e braços colados na parede de forma contínua.",
        sets: [
          { setNumber: 1, repsTarget: "15", restSeconds: 30 },
          { setNumber: 2, repsTarget: "15", restSeconds: 30 },
        ],
      },
      {
        exerciseKey: "barra_fixa_neutra",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Puxe com pegada neutra focando em dorsais, sem balançar o corpo.",
        sets: [
          { setNumber: 1, repsTarget: "8 a 10", restSeconds: 90 },
          { setNumber: 2, repsTarget: "8 a 10", restSeconds: 90 },
          { setNumber: 3, repsTarget: "6 a 8 ou até a falha", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "puxada_alta_pronada",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Deprima as escápulas antes de puxar, trazendo a barra no peito superior.",
        sets: [
          { setNumber: 1, repsTarget: "15 (Aquecimento)", restSeconds: 60 },
          { setNumber: 2, repsTarget: "12 (Moderada)", restSeconds: 90 },
          { setNumber: 3, repsTarget: "8 a 10 (Moderada-pesada)", restSeconds: 90 },
          { setNumber: 4, repsTarget: "8 a 10 (Pesada)", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "remada_unilateral_serrote",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Apoie joelho e mão no banco com coluna neutra, puxe em direção ao quadril.",
        sets: [
          { setNumber: 1, repsTarget: "12 cada lado", restSeconds: 60 },
          { setNumber: 2, repsTarget: "10 cada lado", restSeconds: 90 },
          { setNumber: 3, repsTarget: "8 a 10 cada lado", restSeconds: 90 },
          { setNumber: 4, repsTarget: "8 a 10 cada lado", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "remada_cavalinho_maquina",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Apoie o peito ou firme o tronco, trazendo cotovelos colados ao corpo.",
        sets: [
          { setNumber: 1, repsTarget: "12", restSeconds: 90 },
          { setNumber: 2, repsTarget: "10", restSeconds: 90 },
          { setNumber: 3, repsTarget: "8 a 10", restSeconds: 90 },
          { setNumber: 4, repsTarget: "8 a 10", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "crucifixo_inverso_maquina",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Foque na contração do deltoide posterior sem hiperestender a cervical.",
        sets: [
          { setNumber: 1, repsTarget: "15 (Moderada)", restSeconds: 60 },
          { setNumber: 2, repsTarget: "12 (Moderada-alta)", restSeconds: 60 },
          { setNumber: 3, repsTarget: "10 a 12 (Pesada)", restSeconds: 60 },
          { setNumber: 4, repsTarget: "10 a 12 + 1 drop", restSeconds: 60 },
        ],
      },
      {
        exerciseKey: "rosca_direta_barra",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Cotovelos fixos ao lado do tronco, sem balanço.",
        sets: [
          { setNumber: 1, repsTarget: "15 (Aquecimento)", restSeconds: 60 },
          { setNumber: 2, repsTarget: "10 a 12", restSeconds: 60 },
          { setNumber: 3, repsTarget: "8 a 10", restSeconds: 90 },
          { setNumber: 4, repsTarget: "8 a 10", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "rosca_scott_pulley",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Apoie bem os braços no banco Scott mantendo tensão contínua.",
        sets: [
          { setNumber: 1, repsTarget: "12", restSeconds: 60 },
          { setNumber: 2, repsTarget: "10", restSeconds: 60 },
          { setNumber: 3, repsTarget: "8 a 10 + 1 drop set", restSeconds: 90 },
        ],
      },
    ],
  },
  {
    name: "Dia 3: Quadríceps, estímulo em glúteo e posterior",
    dayOfWeek: DayOfWeek.WEDNESDAY,
    description: "Trabalho completo de membros inferiores com foco em quadríceps e cadeia posterior.",
    exercises: [
      {
        exerciseKey: "alongamento_isquiotibiais_deitado",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes: "Alongue posteriores da coxa deitado.",
        sets: [
          { setNumber: 1, repsTarget: "30s", restSeconds: 20 },
          { setNumber: 2, repsTarget: "30s", restSeconds: 20 },
        ],
      },
      {
        exerciseKey: "mobilidade_quadril_borboleta",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes: "Abra os joelhos tentando encostá-los no chão.",
        sets: [
          { setNumber: 1, repsTarget: "20 a 30s", restSeconds: 10 },
          { setNumber: 2, repsTarget: "20 a 30s", restSeconds: 10 },
        ],
      },
      {
        exerciseKey: "mobilidade_tornozelo",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes: "Projete os joelhos sem tirar o calcanhar do chão.",
        sets: [
          { setNumber: 1, repsTarget: "10 cada lado", restSeconds: 30 },
          { setNumber: 2, repsTarget: "10 cada lado", restSeconds: 30 },
        ],
      },
      {
        exerciseKey: "cadeira_abdutora",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Abdução a 90° com contração no glúteo médio.",
        sets: [
          { setNumber: 1, repsTarget: "15", restSeconds: 60 },
          { setNumber: 2, repsTarget: "12", restSeconds: 60 },
          { setNumber: 3, repsTarget: "10 a 12", restSeconds: 60 },
          { setNumber: 4, repsTarget: "10 a 12 + 1 drop", restSeconds: 60 },
        ],
      },
      {
        exerciseKey: "agachamento_sumo_maquina",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Base sumô afastada com pés a 45°.",
        sets: [
          { setNumber: 1, repsTarget: "12 (Leve)", restSeconds: 90 },
          { setNumber: 2, repsTarget: "10 (Moderada)", restSeconds: 90 },
          { setNumber: 3, repsTarget: "8 a 10 (Pesada)", restSeconds: 90 },
          { setNumber: 4, repsTarget: "8 a 10 (Pesada)", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "leg_press_45",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Desça com amplitude profunda sem descolar a lombar do encosto.",
        sets: [
          { setNumber: 1, repsTarget: "15 (Aquecimento)", restSeconds: 90 },
          { setNumber: 2, repsTarget: "12 (Moderada)", restSeconds: 90 },
          { setNumber: 3, repsTarget: "10 (Moderada-pesada)", restSeconds: 90 },
          { setNumber: 4, repsTarget: "8 a 10 (Pesada)", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "cadeira_extensora",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Pausa isométrica de 1s no topo em cada repetição.",
        sets: [
          { setNumber: 1, repsTarget: "15", restSeconds: 60 },
          { setNumber: 2, repsTarget: "12", restSeconds: 60 },
          { setNumber: 3, repsTarget: "10 a 12", restSeconds: 60 },
          { setNumber: 4, repsTarget: "8 a 10 + 1 drop set", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "mesa_flexora",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Mantenha o quadril pressionado contra a mesa e controle a descida.",
        sets: [
          { setNumber: 1, repsTarget: "12 (Moderada)", restSeconds: 60 },
          { setNumber: 2, repsTarget: "10 (Moderada-pesada)", restSeconds: 60 },
          { setNumber: 3, repsTarget: "8 a 10 + 1 drop (Pesada)", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "panturrilha_em_pe",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Controle a descida em 3s e segure 1s no topo.",
        sets: [
          { setNumber: 1, repsTarget: "15", restSeconds: 60 },
          { setNumber: 2, repsTarget: "15", restSeconds: 60 },
          { setNumber: 3, repsTarget: "12 a 15", restSeconds: 60 },
          { setNumber: 4, repsTarget: "12 a 15", restSeconds: 60 },
          { setNumber: 5, repsTarget: "12 a 15", restSeconds: 60 },
        ],
      },
    ],
  },
  {
    name: "Dia 4: Peito, ombro e tríceps",
    dayOfWeek: DayOfWeek.THURSDAY,
    description: "Variação B de peito, ombros e tríceps com ênfase em polias e paralelas.",
    exercises: [
      {
        exerciseKey: "alongamento_peitoral",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes: "Alongamento no espaldar.",
        sets: [
          { setNumber: 1, repsTarget: "30s", restSeconds: 20 },
          { setNumber: 2, repsTarget: "30s", restSeconds: 20 },
        ],
      },
      {
        exerciseKey: "mobilidade_ombro_vii",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes: "Mobilidade articular de ombros.",
        sets: [
          { setNumber: 1, repsTarget: "15", restSeconds: 30 },
          { setNumber: 2, repsTarget: "15", restSeconds: 30 },
        ],
      },
      {
        exerciseKey: "crucifixo_crossover_inferior",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Feche as mãos na linha do abdômen inferior contraindo o peito.",
        sets: [
          { setNumber: 1, repsTarget: "12", restSeconds: 60 },
          { setNumber: 2, repsTarget: "12", restSeconds: 60 },
          { setNumber: 3, repsTarget: "10 a 12", restSeconds: 60 },
          { setNumber: 4, repsTarget: "10 a 12", restSeconds: 60 },
        ],
      },
      {
        exerciseKey: "supino_reto_halteres",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Supino plano com halteres livres.",
        sets: [
          { setNumber: 1, repsTarget: "15 (Aquecimento)", restSeconds: 60 },
          { setNumber: 2, repsTarget: "12 (Feeder)", restSeconds: 90 },
          { setNumber: 3, repsTarget: "8 a 10 (Pesada)", restSeconds: 90 },
          { setNumber: 4, repsTarget: "8 a 10 (Pesada)", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "triceps_paralelas_graviton",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Mergulho em paralelas focando na extensão do cotovelo.",
        sets: [
          { setNumber: 1, repsTarget: "8 a 10", restSeconds: 90 },
          { setNumber: 2, repsTarget: "8 a 10", restSeconds: 90 },
          { setNumber: 3, repsTarget: "8 a 10", restSeconds: 90 },
          { setNumber: 4, repsTarget: "8 a 10", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "crossover_polia_alta",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Crucifixo na polia alta com pico de contração no centro.",
        sets: [
          { setNumber: 1, repsTarget: "12", restSeconds: 60 },
          { setNumber: 2, repsTarget: "12", restSeconds: 60 },
          { setNumber: 3, repsTarget: "10 a 12", restSeconds: 60 },
          { setNumber: 4, repsTarget: "10 a 12", restSeconds: 60 },
        ],
      },
      {
        exerciseKey: "elevacao_lateral_halteres",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Última série com drop set de 30% da carga.",
        sets: [
          { setNumber: 1, repsTarget: "20 (Aquecimento)", restSeconds: 60 },
          { setNumber: 2, repsTarget: "15 (Moderada)", restSeconds: 60 },
          { setNumber: 3, repsTarget: "10 a 12 + 1 drop", restSeconds: 60 },
          { setNumber: 4, repsTarget: "10 a 12 + 1 drop", restSeconds: 60 },
        ],
      },
      {
        exerciseKey: "triceps_frances_polia",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Extensão acima da cabeça mantendo cotovelos apontados para frente.",
        sets: [
          { setNumber: 1, repsTarget: "12", restSeconds: 60 },
          { setNumber: 2, repsTarget: "10 a 12", restSeconds: 60 },
          { setNumber: 3, repsTarget: "10 a 12", restSeconds: 60 },
          { setNumber: 4, repsTarget: "10 a 12", restSeconds: 60 },
        ],
      },
      {
        exerciseKey: "triceps_pulley_pronada",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Extensão com pegada pronada na barra reta até o bloqueio.",
        sets: [
          { setNumber: 1, repsTarget: "12", restSeconds: 60 },
          { setNumber: 2, repsTarget: "10 a 12", restSeconds: 60 },
          { setNumber: 3, repsTarget: "10 a 12", restSeconds: 60 },
          { setNumber: 4, repsTarget: "10 a 12", restSeconds: 60 },
        ],
      },
    ],
  },
  {
    name: "Dia 5: Costa, posterior de ombro e bíceps",
    dayOfWeek: DayOfWeek.FRIDAY,
    description: "Variação B de costas com remada baixa, puxada unilateral e roscas diversas.",
    exercises: [
      {
        exerciseKey: "alongamento_dorsal_espaldar",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes: "Alongamento dorsal no espaldar.",
        sets: [
          { setNumber: 1, repsTarget: "20s", restSeconds: 20 },
          { setNumber: 2, repsTarget: "20s", restSeconds: 20 },
        ],
      },
      {
        exerciseKey: "alongamento_peitoral",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes: "Alongamento peitoral no espaldar.",
        sets: [
          { setNumber: 1, repsTarget: "20s", restSeconds: 20 },
          { setNumber: 2, repsTarget: "20s", restSeconds: 20 },
        ],
      },
      {
        exerciseKey: "mobilidade_ombro_vii",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes: "Mobilidade escapular e de ombros.",
        sets: [
          { setNumber: 1, repsTarget: "15", restSeconds: 30 },
          { setNumber: 2, repsTarget: "15", restSeconds: 30 },
        ],
      },
      {
        exerciseKey: "puxada_unilateral_neutra",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Puxada unilateral focando em contração máxima de cada lado.",
        sets: [
          { setNumber: 1, repsTarget: "10 cada lado", restSeconds: 60 },
          { setNumber: 2, repsTarget: "8 a 10 cada lado", restSeconds: 60 },
          { setNumber: 3, repsTarget: "8 a 10 cada lado", restSeconds: 60 },
          { setNumber: 4, repsTarget: "8 a 10 cada lado", restSeconds: 60 },
        ],
      },
      {
        exerciseKey: "puxada_alta_pronada",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Puxada com pegada pronada na barra aberta.",
        sets: [
          { setNumber: 1, repsTarget: "12", restSeconds: 90 },
          { setNumber: 2, repsTarget: "10", restSeconds: 90 },
          { setNumber: 3, repsTarget: "8 a 10", restSeconds: 90 },
          { setNumber: 4, repsTarget: "8 a 10", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "remada_baixa_pronada",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Remada sentada com barra reta pegada pronada.",
        sets: [
          { setNumber: 1, repsTarget: "12", restSeconds: 90 },
          { setNumber: 2, repsTarget: "10", restSeconds: 90 },
          { setNumber: 3, repsTarget: "8 a 10", restSeconds: 90 },
          { setNumber: 4, repsTarget: "8 a 10", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "crucifixo_inverso_maquina",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Contração de deltoide posterior na máquina.",
        sets: [
          { setNumber: 1, repsTarget: "12", restSeconds: 60 },
          { setNumber: 2, repsTarget: "10 a 12", restSeconds: 60 },
          { setNumber: 3, repsTarget: "10 a 12", restSeconds: 60 },
          { setNumber: 4, repsTarget: "10 a 12", restSeconds: 60 },
        ],
      },
      {
        exerciseKey: "rosca_banco_135",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Banco inclinado a 135° permitindo estiramento completo do bíceps.",
        sets: [
          { setNumber: 1, repsTarget: "10", restSeconds: 60 },
          { setNumber: 2, repsTarget: "8 a 10", restSeconds: 60 },
          { setNumber: 3, repsTarget: "8 a 10", restSeconds: 60 },
          { setNumber: 4, repsTarget: "8 a 10", restSeconds: 60 },
        ],
      },
      {
        exerciseKey: "rosca_direta_halteres_sentado",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Rosca direta sentado sem impulso.",
        sets: [
          { setNumber: 1, repsTarget: "10", restSeconds: 60 },
          { setNumber: 2, repsTarget: "8 a 10", restSeconds: 60 },
          { setNumber: 3, repsTarget: "8 a 10", restSeconds: 60 },
          { setNumber: 4, repsTarget: "8 a 10", restSeconds: 60 },
        ],
      },
      {
        exerciseKey: "rosca_martelo_halteres",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Pegada neutra para foco em braquiorradial e braquial.",
        sets: [
          { setNumber: 1, repsTarget: "12", restSeconds: 60 },
          { setNumber: 2, repsTarget: "10 a 12", restSeconds: 60 },
          { setNumber: 3, repsTarget: "10 a 12", restSeconds: 60 },
          { setNumber: 4, repsTarget: "10 a 12", restSeconds: 60 },
        ],
      },
    ],
  },
  {
    name: "Dia 6: Glúteo máximo , posterior de coxa e panturrilha",
    dayOfWeek: DayOfWeek.SATURDAY,
    description: "Foco intenso em cadeia posterior, elevação pélvica, terra sumô e panturrilha.",
    exercises: [
      {
        exerciseKey: "alongamento_posterior_pe",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes: "Alongamento de posteriores em pé.",
        sets: [
          { setNumber: 1, repsTarget: "30s", restSeconds: 20 },
          { setNumber: 2, repsTarget: "30s", restSeconds: 20 },
        ],
      },
      {
        exerciseKey: "mobilidade_quadril_borboleta",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes: "Posição de borboleta para soltar adutores.",
        sets: [
          { setNumber: 1, repsTarget: "20 a 30s", restSeconds: 10 },
          { setNumber: 2, repsTarget: "20 a 30s", restSeconds: 10 },
        ],
      },
      {
        exerciseKey: "mobilidade_tornozelo",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes: "Mobilidade de dorsiflexão.",
        sets: [
          { setNumber: 1, repsTarget: "10 cada lado", restSeconds: 30 },
          { setNumber: 2, repsTarget: "10 cada lado", restSeconds: 30 },
        ],
      },
      {
        exerciseKey: "elevacao_pelvica_maquina",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "A cada série aumente os pesos. Próximo da falha nas séries 2 e 3; falha total na 4ª.",
        sets: [
          { setNumber: 1, repsTarget: "12 (Moderada)", restSeconds: 90 },
          { setNumber: 2, repsTarget: "12 (Moderada)", restSeconds: 90 },
          { setNumber: 3, repsTarget: "12 (Moderada-pesada)", restSeconds: 90 },
          { setNumber: 4, repsTarget: "8 a 12 (PESADA)", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "levantamento_terra_sumo",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Mantenha a barra colada nas pernas e contraia forte o glúteo ao subir.",
        sets: [
          { setNumber: 1, repsTarget: "10 (Leve / Aquecimento)", restSeconds: 90 },
          { setNumber: 2, repsTarget: "10 (Leve / 3 reps reserva)", restSeconds: 90 },
          { setNumber: 3, repsTarget: "8 (Moderada-pesada)", restSeconds: 90 },
          { setNumber: 4, repsTarget: "8 (Pesada)", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "stiff_barra_livre",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Projete o quadril para trás, barra raspando nas pernas sem dobrar joelhos excessivamente.",
        sets: [
          { setNumber: 1, repsTarget: "12 (Moderada)", restSeconds: 90 },
          { setNumber: 2, repsTarget: "12 (Moderada)", restSeconds: 90 },
          { setNumber: 3, repsTarget: "10 (Moderada-pesada)", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "cadeira_flexora",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Segure 1s no pico de contração. Última série faça 1 drop set após atingir a falha.",
        sets: [
          { setNumber: 1, repsTarget: "12 (Leve-moderada)", restSeconds: 90 },
          { setNumber: 2, repsTarget: "10 (Moderada-pesada)", restSeconds: 90 },
          { setNumber: 3, repsTarget: "8 a 10 (Pesada)", restSeconds: 90 },
          { setNumber: 4, repsTarget: "8 a 10 + 1 drop set (Pesada)", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "mesa_flexora",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Dobre os joelhos contraindo posteriores, segurando 1s no pico e descendo em 3s.",
        sets: [
          { setNumber: 1, repsTarget: "12 (Moderada)", restSeconds: 90 },
          { setNumber: 2, repsTarget: "8 a 10 (Moderada-pesada)", restSeconds: 90 },
          { setNumber: 3, repsTarget: "8 a 10 + 1 drop (Pesada)", restSeconds: 90 },
        ],
      },
      {
        exerciseKey: "panturrilha_em_pe",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Controle a descida do peso em 3s e segure 1s no pico de contração.",
        sets: [
          { setNumber: 1, repsTarget: "12 a 15", restSeconds: 60 },
          { setNumber: 2, repsTarget: "12 a 15", restSeconds: 60 },
          { setNumber: 3, repsTarget: "12 a 15", restSeconds: 60 },
          { setNumber: 4, repsTarget: "12 a 15", restSeconds: 60 },
          { setNumber: 5, repsTarget: "12 a 15", restSeconds: 60 },
        ],
      },
    ],
  },
];

// PROGRAMA 2: Rotina: Alongamento/mobilidade (1 dia)
const ROUTINE_ALONGAMENTO_DAYS: RoutineDayItem[] = [
  {
    name: "Dia 1: Membro inferior/ coluna",
    dayOfWeek: DayOfWeek.SUNDAY,
    description: "Alongamento e descompressão completa para membros inferiores e coluna vertebral.",
    exercises: [
      {
        exerciseKey: "alongamento_isquiotibiais_deitado",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes:
          "A ideia aqui é alongar os posteriores da coxa. Ao puxar os pés, cuidado para não dobrar o joelho.",
        sets: [
          { setNumber: 1, repsTarget: "40s", restSeconds: 20 },
          { setNumber: 2, repsTarget: "40s", restSeconds: 20 },
        ],
      },
      {
        exerciseKey: "alongamento_adutor_espaldar",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes:
          "Procure uma caixa para se sentar em cima e realize o alongamento para evitar retroversão pélvica.",
        sets: [
          { setNumber: 1, repsTarget: "40s", restSeconds: 20 },
          { setNumber: 2, repsTarget: "40s", restSeconds: 20 },
        ],
      },
      {
        exerciseKey: "alongamento_adutores_coluna",
        sectionType: WorkoutSectionType.WARMUP,
        coachNotes: "Alongamento conjunto de adutores e musculatura paravertebral.",
        sets: [
          { setNumber: 1, repsTarget: "20s", restSeconds: 20 },
          { setNumber: 2, repsTarget: "20s", restSeconds: 20 },
        ],
      },
      {
        exerciseKey: "alongamento_coluna_i",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes:
          "Padronize o exercício mobilizando de um lado para o outro. A cada repetição de cada lado segure 2 segundos.",
        sets: [
          { setNumber: 1, repsTarget: "15 reps", restSeconds: 30 },
          { setNumber: 2, repsTarget: "15 reps", restSeconds: 30 },
        ],
      },
      {
        exerciseKey: "flexao_extensao_coluna",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes: "Flexione e estenda a coluna mobilizando a mesma a fim de relaxar os paravertebrais.",
        sets: [
          { setNumber: 1, repsTarget: "15 reps", restSeconds: 30 },
          { setNumber: 2, repsTarget: "15 reps", restSeconds: 30 },
        ],
      },
      {
        exerciseKey: "mobilidade_tornozelo",
        sectionType: WorkoutSectionType.MAIN,
        coachNotes:
          "Mobilize o tornozelo de forma cadenciada sem deixar que o calcanhar saia do solo.",
        sets: [
          { setNumber: 1, repsTarget: "15 reps", restSeconds: 30 },
          { setNumber: 2, repsTarget: "15 reps", restSeconds: 30 },
        ],
      },
    ],
  },
];

async function main() {
  console.log("=== INICIANDO CRIAÇÃO DE USUÁRIO E SEED DE TREINOS GARROSTEAM ===");

  const passwordPlain = "85197726Van@";
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  // 1. Criar ou Obter Tenant GARROSTEAM
  const tenant = await prisma.tenant.upsert({
    where: { slug: "garrosteam" },
    update: {
      name: "GARROSTEAM",
      status: "ACTIVE",
    },
    create: {
      name: "GARROSTEAM",
      slug: "garrosteam",
      status: "ACTIVE",
    },
  });
  console.log("Tenant garantido:", tenant.name, `(${tenant.id})`);

  // 2. Criar Treinador Garros
  const coachEmail = "coach@garrosteam.com";
  let coach = await prisma.user.findUnique({ where: { email: coachEmail } });
  if (!coach) {
    coach = await prisma.user.create({
      data: {
        email: coachEmail,
        name: "Treinador Garros",
        passwordHash,
        emailVerified: new Date(),
        termsVersion: "v1.0",
        termsAcceptedAt: new Date(),
      },
    });
  } else {
    coach = await prisma.user.update({
      where: { id: coach.id },
      data: { passwordHash, emailVerified: new Date() },
    });
  }

  // Tenant Member Coach
  await prisma.tenantMember.upsert({
    where: { userId: coach.id },
    update: { tenantId: tenant.id, role: "OWNER" },
    create: {
      tenantId: tenant.id,
      userId: coach.id,
      role: "OWNER",
    },
  });
  console.log("Coach garantido:", coach.email);

  // 3. Criar Aluno Vanderson Lindozo
  const studentEmail = "vandersonandrade_dev@outlook.com";
  let student = await prisma.user.findUnique({ where: { email: studentEmail } });
  if (!student) {
    student = await prisma.user.create({
      data: {
        email: studentEmail,
        name: "Vanderson Lindozo",
        passwordHash,
        emailVerified: new Date(),
        sessionVersion: 0,
        termsVersion: "v1.0",
        termsAcceptedAt: new Date(),
      },
    });
  } else {
    student = await prisma.user.update({
      where: { id: student.id },
      data: {
        passwordHash,
        name: "Vanderson Lindozo",
        emailVerified: new Date(),
      },
    });
  }

  // Tenant Member Student
  await prisma.tenantMember.upsert({
    where: { userId: student.id },
    update: { tenantId: tenant.id, role: "STUDENT" },
    create: {
      tenantId: tenant.id,
      userId: student.id,
      role: "STUDENT",
    },
  });

  // Student Profile
  let studentProfile = await prisma.studentProfile.findFirst({
    where: { userId: student.id, tenantId: tenant.id },
  });
  if (!studentProfile) {
    studentProfile = await prisma.studentProfile.create({
      data: {
        tenantId: tenant.id,
        userId: student.id,
        fitnessGoal: "HYPERTROPHY",
        experienceLevel: "INTERMEDIATE",
        status: "ACTIVE",
        trainerNotes: "Aluno Vanderson Lindozo - Rotinas de Adaptação GARROSTEAM e Alongamento/Mobilidade.",
      },
    });
  } else {
    studentProfile = await prisma.studentProfile.update({
      where: { id: studentProfile.id },
      data: {
        status: "ACTIVE",
        fitnessGoal: "HYPERTROPHY",
        experienceLevel: "INTERMEDIATE",
        trainerNotes: "Aluno Vanderson Lindozo - Rotinas de Adaptação GARROSTEAM e Alongamento/Mobilidade.",
      },
    });
  }
  console.log("Aluno garantido:", student.email, `(Profile: ${studentProfile.id})`);

  // 4. Mapear categorias de exercício
  const categories = await prisma.exerciseCategory.findMany();
  const categoryMap = new Map<string, string>();
  for (const c of categories) {
    categoryMap.set(c.slug, c.id);
  }

  // 5. Popular e Vincular Todos os Exercícios com GIFs
  const exerciseIdMap = new Map<string, string>();

  for (const [key, def] of Object.entries(EXERCISE_DEFINITIONS)) {
    const categoryId = categoryMap.get(def.categorySlug) || categoryMap.get("mobilidade")!;
    const gifUrl = `${CDN_BASE}${def.gifPath}`;

    // Buscar exercício existente ou criar novo
    let exercise = await prisma.exercise.findFirst({
      where: {
        name: def.name,
        tenantId: tenant.id,
      },
    });

    if (!exercise) {
      exercise = await prisma.exercise.create({
        data: {
          tenantId: tenant.id,
          categoryId,
          name: def.name,
          description: def.description,
          primaryMuscleGroup: def.primaryMuscleGroup,
          secondaryMuscleGroups: def.secondaryMuscleGroups,
          equipment: def.equipment,
          difficulty: def.difficulty,
          isGlobal: false,
        },
      });
    } else {
      exercise = await prisma.exercise.update({
        where: { id: exercise.id },
        data: {
          description: def.description,
          primaryMuscleGroup: def.primaryMuscleGroup,
          secondaryMuscleGroups: def.secondaryMuscleGroups,
          equipment: def.equipment,
          difficulty: def.difficulty,
        },
      });
    }

    exerciseIdMap.set(key, exercise.id);

    // Mídia do exercício (ExerciseMedia)
    const existingMedia = await prisma.exerciseMedia.findFirst({
      where: { exerciseId: exercise.id },
    });

    if (!existingMedia) {
      await prisma.exerciseMedia.create({
        data: {
          exerciseId: exercise.id,
          mediaType: "GIF",
          url: gifUrl,
          storageProvider: "EXTERNAL",
          orderIndex: 0,
        },
      });
    } else {
      await prisma.exerciseMedia.update({
        where: { id: existingMedia.id },
        data: {
          mediaType: "GIF",
          url: gifUrl,
          storageProvider: "EXTERNAL",
        },
      });
    }

    // TenantMedia (Galeria do treinador para busca e reuso fácil)
    const existingTenantMedia = await prisma.tenantMedia.findFirst({
      where: { tenantId: tenant.id, url: gifUrl },
    });
    if (!existingTenantMedia) {
      await prisma.tenantMedia.create({
        data: {
          tenantId: tenant.id,
          title: def.name,
          description: def.description,
          mediaType: "GIF",
          url: gifUrl,
          storageProvider: "EXTERNAL",
          category: def.categorySlug,
          tags: [def.primaryMuscleGroup, def.equipment],
        },
      });
    }
  }

  console.log(`Exercícios e mídias associados: ${exerciseIdMap.size} itens.`);

  // 6. Criar Programas de Treino
  async function seedProgram(
    title: string,
    goal: string,
    days: RoutineDayItem[]
  ) {
    // Verificar se já existe o programa
    let program = await prisma.trainingProgram.findFirst({
      where: {
        studentProfileId: studentProfile!.id,
        title,
      },
    });

    if (!program) {
      program = await prisma.trainingProgram.create({
        data: {
          tenantId: tenant.id,
          studentProfileId: studentProfile!.id,
          title,
          goal,
          isActive: true,
          startDate: new Date(),
        },
      });
    } else {
      program = await prisma.trainingProgram.update({
        where: { id: program.id },
        data: { isActive: true },
      });
    }

    // Criar versão publicada do programa
    let version = await prisma.trainingProgramVersion.findFirst({
      where: {
        programId: program.id,
        versionNumber: 1,
      },
    });

    if (version) {
      // Limpar dias anteriores da versão para re-população limpa e idempotente
      await prisma.trainingDay.deleteMany({
        where: { versionId: version.id },
      });
      version = await prisma.trainingProgramVersion.update({
        where: { id: version.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          notes: "Programa completo sincronizado com base nas prescrições GARROSTEAM.",
        },
      });
    } else {
      version = await prisma.trainingProgramVersion.create({
        data: {
          programId: program.id,
          versionNumber: 1,
          status: "PUBLISHED",
          publishedAt: new Date(),
          notes: "Programa completo sincronizado com base nas prescrições GARROSTEAM.",
        },
      });
    }

    // Inserir os dias de treino e exercícios prescritos
    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const dayData = days[dayIdx];
      const trainingDay = await prisma.trainingDay.create({
        data: {
          versionId: version.id,
          name: dayData.name,
          dayOfWeek: dayData.dayOfWeek,
          description: dayData.description,
          orderIndex: dayIdx,
        },
      });

      for (let exIdx = 0; exIdx < dayData.exercises.length; exIdx++) {
        const exData = dayData.exercises[exIdx];
        const exerciseId = exerciseIdMap.get(exData.exerciseKey);
        if (!exerciseId) {
          console.error(`Exercício não encontrado no mapa: ${exData.exerciseKey}`);
          continue;
        }

        const workoutExercise = await prisma.workoutExercise.create({
          data: {
            trainingDayId: trainingDay.id,
            exerciseId,
            sectionType: exData.sectionType,
            orderIndex: exIdx,
            coachNotes: exData.coachNotes || null,
          },
        });

        for (let setIdx = 0; setIdx < exData.sets.length; setIdx++) {
          const s = exData.sets[setIdx];
          await prisma.workoutSetPrescribed.create({
            data: {
              workoutExerciseId: workoutExercise.id,
              setNumber: s.setNumber,
              repsTarget: s.repsTarget,
              restSeconds: s.restSeconds,
            },
          });
        }
      }
    }

    console.log(`Programa "${title}" criado com sucesso! (${days.length} dias cadastrados).`);
  }

  await seedProgram(
    "Rotina: Treino- Adaptação - GARROSTEAM",
    "Hipertrofia",
    ROUTINE_GARROS_DAYS
  );

  await seedProgram(
    "Rotina: Alongamento/mobilidade",
    "Qualidade de vida / Mobilidade",
    ROUTINE_ALONGAMENTO_DAYS
  );

  console.log("=== SEED CONCLUÍDO COM SUCESSO! ===");
  console.log("Credenciais do Aluno:");
  console.log(`- Email: ${studentEmail}`);
  console.log(`- Senha: ${passwordPlain}`);
  console.log("Credenciais do Treinador:");
  console.log(`- Email: ${coachEmail}`);
  console.log(`- Senha: ${passwordPlain}`);
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
