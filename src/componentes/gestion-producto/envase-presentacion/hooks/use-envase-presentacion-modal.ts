import { useState } from "react";
import { EnvasePresentacion } from "../../../../interfaces/gestion-producto/envase-presentacion/interfaces-envase-presentacion";
import { Auditoria } from "../../../../interfaces/generales/interfaces-generales";

export type EnvasePresentacionModalTipo = "alta" | "edicion" | "auditoria" | null;

export function useEnvasePresentacionModal() {
  const [tipo, setTipo] = useState<EnvasePresentacionModalTipo>(null);
  const [envase, setEnvase] = useState<EnvasePresentacion | null>(null);
  const [auditoria, setAuditoria] = useState<Auditoria | null>(null);

  const abrirAlta = () => {
    setEnvase(null);
    setAuditoria(null);
    setTipo("alta");
  };

  const abrirEdicion = (envase: EnvasePresentacion) => {
    setEnvase(envase);
    setAuditoria(null);
    setTipo("edicion");
  };

  const abrirAuditoria = (auditoria: Auditoria) => {
    setAuditoria(auditoria);
    setEnvase(null);
    setTipo("auditoria");
  };

  const cerrar = () => {
    setTipo(null);
    setEnvase(null);
    setAuditoria(null);
  };

  return {
    tipo,
    envase,
    auditoria,
    abrirAlta,
    abrirEdicion,
    abrirAuditoria,
    cerrar,
  };
}
