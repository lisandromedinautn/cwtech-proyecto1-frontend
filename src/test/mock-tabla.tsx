import type { ReactElement } from "react";

interface ColumnaMock {
  header: string;
  accessor: string;
  formatFunction?: (params: { value: unknown; row: Record<string, unknown> }) => ReactElement;
}

interface TablaMockProps {
  columns: ColumnaMock[];
  data: Record<string, unknown>[];
  actions?: (row: Record<string, unknown>, index: number) => ReactElement;
  getRowClass?: (params: { data: Record<string, unknown> }) => string | string[] | undefined;
}

// Reemplaza a TablaAGGrid en los tests: AG Grid no pinta celdas en jsdom.
export function TablaAGGridMock({ columns, data, actions, getRowClass }: TablaMockProps) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.header}>{c.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={String(row.id ?? i)} data-class={String(getRowClass?.({ data: row }) ?? "")}>
            {columns.map((c) => (
              <td key={c.header}>
                {c.formatFunction
                  ? c.formatFunction({ value: row[c.accessor], row })
                  : String(row[c.accessor] ?? "")}
              </td>
            ))}
            <td>{actions?.(row, i)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
