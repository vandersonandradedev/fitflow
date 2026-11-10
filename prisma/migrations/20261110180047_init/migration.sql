-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TenantRole" AS ENUM ('OWNER', 'COACH', 'STUDENT');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FitnessGoal" AS ENUM ('HYPERTROPHY', 'WEIGHT_LOSS', 'STRENGTH', 'HEALTH', 'REHABILITATION');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE', 'BODYWEIGHT', 'KETTLEBELL', 'BAND', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('VIDEO', 'IMAGE', 'GIF');

-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('R2', 'YOUTUBE', 'VIMEO', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "ProgramVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY', 'ANY');

-- CreateEnum
CREATE TYPE "WorkoutSectionType" AS ENUM ('WARMUP', 'MAIN', 'COOLDOWN');

-- CreateEnum
CREATE TYPE "WorkoutSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WORKOUT_ASSIGNED', 'WORKOUT_COMPLETED', 'PR_ACHIEVED', 'INVITE', 'SYSTEM');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "email_verified" TIMESTAMP(3),
    "password_hash" VARCHAR(255),
    "image" VARCHAR(500),
    "session_version" INTEGER NOT NULL DEFAULT 0,
    "terms_version" VARCHAR(20),
    "terms_accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "TenantRole" NOT NULL DEFAULT 'STUDENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "phone" VARCHAR(30),
    "birth_date" DATE,
    "fitness_goal" "FitnessGoal" NOT NULL DEFAULT 'HYPERTROPHY',
    "experience_level" "ExperienceLevel" NOT NULL DEFAULT 'BEGINNER',
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "trainer_notes" TEXT,
    "health_conditions" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_invites" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invited_by_user_id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(30),
    "fitness_goal" "FitnessGoal" NOT NULL DEFAULT 'HYPERTROPHY',
    "experience_level" "ExperienceLevel" NOT NULL DEFAULT 'BEGINNER',
    "token_hash" VARCHAR(255) NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" VARCHAR(255) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "exercise_categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon_name" VARCHAR(50),
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "category_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "primary_muscle_group" VARCHAR(100) NOT NULL,
    "secondary_muscle_groups" TEXT[],
    "equipment" "EquipmentType" NOT NULL DEFAULT 'BODYWEIGHT',
    "difficulty" "ExperienceLevel" NOT NULL DEFAULT 'BEGINNER',
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_media" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "media_type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "url" VARCHAR(500) NOT NULL,
    "storage_provider" "StorageProvider" NOT NULL DEFAULT 'EXTERNAL',
    "thumbnail_url" VARCHAR(500),
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "exercise_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_instructions" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "safety_tip" TEXT,

    CONSTRAINT "exercise_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_programs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_profile_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "goal" VARCHAR(100),
    "start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_program_versions" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "status" "ProgramVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_program_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_days" (
    "id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL DEFAULT 'ANY',
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "training_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_exercises" (
    "id" TEXT NOT NULL,
    "training_day_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "superset_group_id" VARCHAR(50),
    "section_type" "WorkoutSectionType" NOT NULL DEFAULT 'MAIN',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "coach_notes" TEXT,

    CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sets_prescribed" (
    "id" TEXT NOT NULL,
    "workout_exercise_id" TEXT NOT NULL,
    "set_number" INTEGER NOT NULL,
    "reps_target" VARCHAR(50) NOT NULL,
    "suggested_load_kg" DECIMAL(6,2),
    "rest_seconds" INTEGER NOT NULL DEFAULT 60,
    "tempo" VARCHAR(20),
    "target_rpe" DECIMAL(3,1),

    CONSTRAINT "workout_sets_prescribed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100),
    "template_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_profile_id" TEXT NOT NULL,
    "program_version_id" TEXT NOT NULL,
    "training_day_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "status" "WorkoutSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "perceived_exertion_rpe" INTEGER,
    "student_feedback" TEXT,
    "total_duration_seconds" INTEGER,
    "total_volume_kg" DECIMAL(10,2),

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_logs" (
    "id" TEXT NOT NULL,
    "workout_session_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "workout_exercise_id" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "exercise_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "set_logs" (
    "id" TEXT NOT NULL,
    "exercise_log_id" TEXT NOT NULL,
    "set_number" INTEGER NOT NULL,
    "prescribed_load_kg" DECIMAL(6,2),
    "actual_load_kg" DECIMAL(6,2) NOT NULL,
    "prescribed_reps" VARCHAR(50),
    "actual_reps" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "rest_taken_seconds" INTEGER,
    "rpe" DECIMAL(3,1),
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "set_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_assessments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_profile_id" TEXT NOT NULL,
    "evaluator_user_id" TEXT NOT NULL,
    "assessment_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight_kg" DECIMAL(5,2) NOT NULL,
    "height_cm" DECIMAL(5,2),
    "body_fat_percentage" DECIMAL(4,2),
    "muscle_mass_percentage" DECIMAL(4,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "physical_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_measurements" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "chest_cm" DECIMAL(5,2),
    "waist_cm" DECIMAL(5,2),
    "abdomen_cm" DECIMAL(5,2),
    "hips_cm" DECIMAL(5,2),
    "right_arm_cm" DECIMAL(5,2),
    "left_arm_cm" DECIMAL(5,2),
    "right_thigh_cm" DECIMAL(5,2),
    "left_thigh_cm" DECIMAL(5,2),
    "right_calf_cm" DECIMAL(5,2),
    "left_calf_cm" DECIMAL(5,2),

    CONSTRAINT "body_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "link" VARCHAR(500),
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "user_id" TEXT,
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "resource_id" VARCHAR(100),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "tenant_members_tenant_id_role_idx" ON "tenant_members"("tenant_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_members_user_id_key" ON "tenant_members"("user_id");

-- CreateIndex
CREATE INDEX "student_profiles_tenant_id_status_idx" ON "student_profiles"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "student_profiles_tenant_id_user_id_idx" ON "student_profiles"("tenant_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_invites_token_hash_key" ON "student_invites"("token_hash");

-- CreateIndex
CREATE INDEX "student_invites_tenant_id_email_idx" ON "student_invites"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "student_invites_token_hash_idx" ON "student_invites"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_email_idx" ON "password_reset_tokens"("email");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_categories_slug_key" ON "exercise_categories"("slug");

-- CreateIndex
CREATE INDEX "exercises_tenant_id_is_global_idx" ON "exercises"("tenant_id", "is_global");

-- CreateIndex
CREATE INDEX "exercises_category_id_name_idx" ON "exercises"("category_id", "name");

-- CreateIndex
CREATE INDEX "exercise_media_exercise_id_order_index_idx" ON "exercise_media"("exercise_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_instructions_exercise_id_step_number_key" ON "exercise_instructions"("exercise_id", "step_number");

-- CreateIndex
CREATE INDEX "training_programs_tenant_id_student_profile_id_is_active_idx" ON "training_programs"("tenant_id", "student_profile_id", "is_active");

-- CreateIndex
CREATE INDEX "training_program_versions_program_id_status_idx" ON "training_program_versions"("program_id", "status");

-- CreateIndex
CREATE INDEX "training_days_version_id_order_index_idx" ON "training_days"("version_id", "order_index");

-- CreateIndex
CREATE INDEX "workout_exercises_training_day_id_order_index_idx" ON "workout_exercises"("training_day_id", "order_index");

-- CreateIndex
CREATE INDEX "workout_sets_prescribed_workout_exercise_id_set_number_idx" ON "workout_sets_prescribed"("workout_exercise_id", "set_number");

-- CreateIndex
CREATE INDEX "workout_templates_tenant_id_category_idx" ON "workout_templates"("tenant_id", "category");

-- CreateIndex
CREATE INDEX "workout_sessions_tenant_id_student_profile_id_completed_at_idx" ON "workout_sessions"("tenant_id", "student_profile_id", "completed_at");

-- CreateIndex
CREATE INDEX "workout_sessions_status_started_at_idx" ON "workout_sessions"("status", "started_at");

-- CreateIndex
CREATE INDEX "exercise_logs_workout_session_id_order_index_idx" ON "exercise_logs"("workout_session_id", "order_index");

-- CreateIndex
CREATE INDEX "set_logs_exercise_log_id_set_number_idx" ON "set_logs"("exercise_log_id", "set_number");

-- CreateIndex
CREATE INDEX "physical_assessments_tenant_id_student_profile_id_assessmen_idx" ON "physical_assessments"("tenant_id", "student_profile_id", "assessment_date");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_created_at_idx" ON "notifications"("user_id", "read", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_action_created_at_idx" ON "audit_logs"("tenant_id", "action", "created_at");

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_invites" ADD CONSTRAINT "student_invites_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_invites" ADD CONSTRAINT "student_invites_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "exercise_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_media" ADD CONSTRAINT "exercise_media_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_instructions" ADD CONSTRAINT "exercise_instructions_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_programs" ADD CONSTRAINT "training_programs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_programs" ADD CONSTRAINT "training_programs_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_program_versions" ADD CONSTRAINT "training_program_versions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "training_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_days" ADD CONSTRAINT "training_days_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "training_program_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_training_day_id_fkey" FOREIGN KEY ("training_day_id") REFERENCES "training_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets_prescribed" ADD CONSTRAINT "workout_sets_prescribed_workout_exercise_id_fkey" FOREIGN KEY ("workout_exercise_id") REFERENCES "workout_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_templates" ADD CONSTRAINT "workout_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_program_version_id_fkey" FOREIGN KEY ("program_version_id") REFERENCES "training_program_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_training_day_id_fkey" FOREIGN KEY ("training_day_id") REFERENCES "training_days"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_workout_session_id_fkey" FOREIGN KEY ("workout_session_id") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_workout_exercise_id_fkey" FOREIGN KEY ("workout_exercise_id") REFERENCES "workout_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_exercise_log_id_fkey" FOREIGN KEY ("exercise_log_id") REFERENCES "exercise_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_assessments" ADD CONSTRAINT "physical_assessments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_assessments" ADD CONSTRAINT "physical_assessments_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_assessments" ADD CONSTRAINT "physical_assessments_evaluator_user_id_fkey" FOREIGN KEY ("evaluator_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "physical_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
