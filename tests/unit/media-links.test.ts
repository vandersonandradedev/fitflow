import { describe, expect, it } from "vitest";
import {
  extractYouTubeId,
  extractVimeoId,
  parseMediaUrl,
} from "@/modules/media/links";

describe("Media Links & Zero-Storage Parsing", () => {
  it("extrai ID do YouTube de URLs padrão, encurtadas e shorts", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ?t=10")).toBe(
      "dQw4w9WgXcQ"
    );
    expect(extractYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
    expect(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("extrai ID do Vimeo corretamente", () => {
    expect(extractVimeoId("https://vimeo.com/76979871")).toBe("76979871");
    expect(extractVimeoId("https://player.vimeo.com/video/76979871")).toBe(
      "76979871"
    );
  });

  it("gera thumbnail do YouTube via CDN oficial sem tocar no servidor", () => {
    const parsed = parseMediaUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(parsed.provider).toBe("YOUTUBE");
    expect(parsed.mediaType).toBe("VIDEO");
    expect(parsed.thumbnailUrl).toBe(
      "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    );
    expect(parsed.embedUrl).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("identifica links Cloudflare R2 e Unsplash como links externos otimizados", () => {
    const r2Video = parseMediaUrl(
      "https://media.fitflow.app/tenants/t1/exercises/demo.mp4"
    );
    expect(r2Video.provider).toBe("R2");
    expect(r2Video.mediaType).toBe("VIDEO");

    const r2Img = parseMediaUrl(
      "https://media.fitflow.app/tenants/t1/exercises/supino.webp"
    );
    expect(r2Img.provider).toBe("R2");
    expect(r2Img.mediaType).toBe("IMAGE");

    const unsplash = parseMediaUrl(
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd"
    );
    expect(unsplash.provider).toBe("UNSPLASH");
    expect(unsplash.mediaType).toBe("IMAGE");
  });
});
