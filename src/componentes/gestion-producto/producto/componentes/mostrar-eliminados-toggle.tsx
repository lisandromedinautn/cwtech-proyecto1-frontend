interface Props {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function MostrarEliminadosToggle({ checked, onChange }: Props) {
  return (
    <label htmlFor="mostrar-eliminados" className="flex items-center gap-2 text-sm">
      <input
        id="mostrar-eliminados"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      Mostrar eliminados
    </label>
  );
}
