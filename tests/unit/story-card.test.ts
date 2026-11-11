import { describe, expect, it, vi } from "vitest";
import { drawStoryCard, StoryCardData } from "@/lib/story-card-generator";

function createMockContext(): CanvasRenderingContext2D {
  const gradientMock = {
    addColorStop: vi.fn(),
  };

  return {
    createLinearGradient: vi.fn(() => gradientMock),
    createRadialGradient: vi.fn(() => gradientMock),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    arcTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    lineTo: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("Gerador de Cards para Instagram Stories (1080x1920)", () => {
  it("inicializa as dimensões corretas do canvas (1080x1920) e desenha todos os elementos", () => {
    const canvas = document.createElement("canvas");
    const mockCtx = createMockContext();
    vi.spyOn(canvas, "getContext").mockReturnValue(mockCtx);

    const data: StoryCardData = {
      workoutName: "Treino A — Peito e Tríceps",
      studentName: "Rodrigo Aluno",
      coachName: "Coach Rafael",
      tenantName: "Academia Performance",
      dateStr: "quarta-feira, 11 de nov",
      totalVolumeKg: 3450,
      durationMinutes: 52,
      completedSetsCount: 16,
      totalSetsCount: 16,
      rpe: 9,
      isRecordVolume: true,
    };

    drawStoryCard(canvas, data);

    expect(canvas.width).toBe(1080);
    expect(canvas.height).toBe(1920);
    expect(mockCtx.fillText).toHaveBeenCalled();
    expect(mockCtx.createLinearGradient).toHaveBeenCalled();
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  it("renderiza corretamente mesmo sem dados opcionais e sem RPE", () => {
    const canvas = document.createElement("canvas");
    const mockCtx = createMockContext();
    vi.spyOn(canvas, "getContext").mockReturnValue(mockCtx);

    const data: StoryCardData = {
      workoutName: "Treino Livre",
      studentName: "Aluno Anônimo",
      dateStr: "11/11/2026",
      totalVolumeKg: 1200,
      durationMinutes: 40,
      completedSetsCount: 10,
      totalSetsCount: 12,
    };

    drawStoryCard(canvas, data);

    expect(canvas.width).toBe(1080);
    expect(canvas.height).toBe(1920);
    expect(mockCtx.fillText).toHaveBeenCalled();
  });
});
