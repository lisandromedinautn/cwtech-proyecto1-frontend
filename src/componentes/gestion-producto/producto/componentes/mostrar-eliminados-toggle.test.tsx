import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MostrarEliminadosToggle } from "./mostrar-eliminados-toggle";

describe("MostrarEliminadosToggle", () => {
  afterEach(() => {
    cleanup();
  });

  it("arranca apagado y avisa el nuevo valor al tildarlo desde el texto", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<MostrarEliminadosToggle checked={false} onChange={onChange} />);

    const casilla = screen.getByRole("checkbox", { name: "Mostrar eliminados" });
    expect(casilla).not.toBeChecked();

    await user.click(screen.getByText("Mostrar eliminados"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("avisa false al destildarlo", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<MostrarEliminadosToggle checked onChange={onChange} />);

    await user.click(screen.getByRole("checkbox", { name: "Mostrar eliminados" }));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
