import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { RestChronometer } from "@/components/ui/rest-chronometer";

describe("RestChronometer Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("renderiza o tempo inicial formatado corretamente", () => {
    render(<RestChronometer initialSeconds={90} autoStart={false} />);
    expect(screen.getByText("01:30")).toBeInTheDocument();
    expect(screen.getByText("pausado")).toBeInTheDocument();
  });

  it("renderiza os botões de ajuste rápido +30s e -15s", () => {
    render(<RestChronometer initialSeconds={60} autoStart={false} />);
    const plus30Btn = screen.getByLabelText("Aumentar 30 segundos");
    const minus15Btn = screen.getByLabelText("Diminuir 15 segundos");

    expect(plus30Btn).toBeInTheDocument();
    expect(minus15Btn).toBeInTheDocument();

    act(() => {
      fireEvent.click(plus30Btn);
    });

    expect(screen.getByText("01:30")).toBeInTheDocument();
  });

  it("permite alternar entre pausar e retomar", () => {
    render(<RestChronometer initialSeconds={60} autoStart={true} />);
    const pauseBtn = screen.getByLabelText("Pausar cronômetro");
    expect(pauseBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(pauseBtn);
    });

    expect(screen.getByLabelText("Iniciar cronômetro")).toBeInTheDocument();
  });

  it("dispara callback onFinish ao atingir zero", () => {
    const onFinish = vi.fn();
    render(<RestChronometer initialSeconds={2} autoStart={true} onFinish={onFinish} />);

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(onFinish).toHaveBeenCalled();
    expect(screen.getByText("VAI!")).toBeInTheDocument();
  });
});
