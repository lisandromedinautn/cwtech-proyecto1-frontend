import { Button } from "../../../ui/Button";
import InformacionAuditoria from "../../../herramientas/reutilizables/informacion-auditoria";
import { EnvasePresentacion } from "../../../../interfaces/gestion-producto/envase-presentacion/interfaces-envase-presentacion";
import { Auditoria } from "../../../../interfaces/generales/interfaces-generales";
import { EnvasePresentacionModalTipo } from "../hooks/use-envase-presentacion-modal";
import RegistrarActualizarEnvasePresentacionForm from "../utils/registrar-actualizar-envase-presentacion";

interface Props {
  open: boolean;
  tipo: EnvasePresentacionModalTipo;
  envase?: EnvasePresentacion | null;
  auditoria?: Auditoria | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function EnvasePresentacionModal({
  open,
  tipo,
  envase,
  auditoria,
  onClose,
  onSuccess,
}: Props) {
  if (!open || !tipo) return null;

  return (
    <>
      {tipo === "alta" && (
        <RegistrarActualizarEnvasePresentacionForm
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}

      {tipo === "edicion" && envase && (
        <RegistrarActualizarEnvasePresentacionForm
          envase={envase}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}

      {tipo === "auditoria" && auditoria && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <InformacionAuditoria auditoria={auditoria} onClose={onClose} />
            <div className="mt-6 pt-4 border-t">
              <Button onClick={onClose}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
