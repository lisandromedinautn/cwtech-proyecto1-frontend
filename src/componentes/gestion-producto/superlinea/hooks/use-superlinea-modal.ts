import { useState } from "react";
import { Superlinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";
import { Auditoria } from "../../../../interfaces/generales/interfaces-generales";

export type SuperlineaModalTipo = "alta" | "edicion" | "auditoria" | null;

export function useSuperlineaModal() {
  const [tipo, setTipo] = useState<SuperlineaModalTipo>(null);
  const [superlinea, setSuperlinea] = useState<Superlinea | null>(null);
  const [auditoria, setAuditoria] = useState<Auditoria | null>(null);

  const abrirAlta = () => {
    setSuperlinea(null);
    setAuditoria(null);
    setTipo("alta");
  };

  const abrirEdicion = (superlinea: Superlinea) => {
    setSuperlinea(superlinea);
    setAuditoria(null);
    setTipo("edicion");
  };

  const abrirAuditoria = (auditoria: Auditoria) => {
    setAuditoria(auditoria);
    setSuperlinea(null);
    setTipo("auditoria");
  };

  const cerrar = () => {
    setTipo(null);
    setSuperlinea(null);
    setAuditoria(null);
  };

  return {
    tipo,
    superlinea,
    auditoria,
    abrirAlta,
    abrirEdicion,
    abrirAuditoria,
    cerrar,
  };
}