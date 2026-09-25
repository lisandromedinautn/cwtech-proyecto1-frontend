import { createContext, useContext, type ReactNode } from "react";

const Ctx = createContext<{ onValueChange?: (v: string) => void; value?: string; disabled?: boolean }>({});

// Reemplazo simple de los Select de Radix (que no funcionan bien en jsdom).
export const selectUiMock = {
  SelectUI: ({ children, onValueChange, value, disabled }: { children: ReactNode; onValueChange?: (v: string) => void; value?: string; disabled?: boolean }) => (
    <Ctx.Provider value={{ onValueChange, value, disabled }}>
      <div data-testid="select" data-value={value} data-disabled={String(!!disabled)}>{children}</div>
    </Ctx.Provider>
  ),
  SelectTriggerUI: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectValueUI: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContentUI: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItemUI: function Item({ children, value }: { children: ReactNode; value: string }) {
    const { onValueChange } = useContext(Ctx);
    return <button type="button" onClick={() => onValueChange?.(value)}>{children}</button>;
  },
};
