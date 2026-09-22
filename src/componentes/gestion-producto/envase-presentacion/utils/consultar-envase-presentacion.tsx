import { useEffect, useState } from "react";
import EnvasePresentacionService from "../services/envase-presentacion-service";
import type { EnvasePresentacion } from "../../../../interfaces/gestion-producto/envase-presentacion/interfaces-envase-presentacion";
import Paginacion from "../../../herramientas/reutilizables/paginacion";
import { Card, CardContent, CardHeader } from "../../../ui/Card";
import { useFiltrosContext } from "../../../../context/filtros-contesxt";
import { Alertas, TipoAlerta, TituloAlerta, useAlerts } from "../../../herramientas/alertas/alertas";
import {
  TipoAlertaConfirmacion,
  TituloAlertaConfirmacion,
  useConfirmation,
} from "../../../herramientas/alertas/alertas-confirmacion";
import { Auditoria, ResponsePost } from "../../../../interfaces/generales/interfaces-generales";
import { useEnvasePresentacionModal } from "../hooks/use-envase-presentacion-modal";
import { EnvasePresentacionModal } from "../modales/envase-presentacion-modal";
import { DatosTabla } from "../componentes/datos-tabla";
import { DatosCards } from "../componentes/datos-card";
import { Header } from "../componentes/header";
import { HeaderLg } from "../componentes/header-lg";
import {
  FiltrosEnvasePresentacion,
  FiltrosEnvasePresentacionValues,
} from "../componentes/filtros-envase-presentacion";
import { getUsuarioId } from "../../../../utils/auth";
import { normalizeApiError } from "../../../../utils/errores";

const NOMBRE_COMPONENTE = "consultar-envase-presentacion";

// ABM de los envases de la presentación de un producto (CR-002).
export default function ConsultarEnvasesPresentacion() {
  // ===========================
  // ESTADOS PRINCIPALES
  // ===========================
  const [envases, setEnvases] = useState<EnvasePresentacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { alerts, addAlert, removeAlert } = useAlerts();
  const { showConfirmation, AlertasConfirmacion } = useConfirmation();

  const modal = useEnvasePresentacionModal();
  const usuarioId = getUsuarioId();

  // ===========================
  // FILTROS LOCALES
  // ===========================
  const [filtrosEnvase, setFiltrosEnvase] = useState<FiltrosEnvasePresentacionValues>({
    denominacion: "",
  });

  // ===========================
  // PAGINACIÓN
  // ===========================
  const [paginaActual, setPaginaActual] = useState(1);
  const [entidadesTotales, setEntidadesTotales] = useState(0);
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(10);

  // ===========================
  // FILTROS CONTEXTO
  // ===========================
  const [filtrosInicializados, setFiltrosInicializados] = useState(false);
  const { setFiltrosNecesarios, limpiarFiltros, buscar, setBuscar } = useFiltrosContext();

  useEffect(() => {
    limpiarFiltros();
    setBuscar({ cont: 0, componente: NOMBRE_COMPONENTE });
    setFiltrosNecesarios({ denominacion: true });
    setFiltrosInicializados(true);
  }, []);

  useEffect(() => {
    if (buscar.cont > 0 && buscar.componente === NOMBRE_COMPONENTE) {
      handleBuscarEnvases(true);
    }
  }, [buscar]);

  // ===========================
  // CRUD / ACCIONES
  // ===========================
  const mostrarError = (err: unknown) => {
    addAlert({
      type: TipoAlerta.ERROR,
      title: TituloAlerta.ERROR,
      message: normalizeApiError(err).message,
      autoClose: true,
    });
  };

  const handleAbrirEdicion = async (id: number) => {
    try {
      const envase = await EnvasePresentacionService.obtenerId(id);
      modal.abrirEdicion(envase);
    } catch (err) {
      mostrarError(err);
    }
  };

  const handleMostrarInfo = async (id: number) => {
    try {
      const auditoria = await EnvasePresentacionService.obtenerAuditoria(id);
      modal.abrirAuditoria(auditoria);
    } catch (err) {
      mostrarError(err);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirmation({
      type: TipoAlertaConfirmacion.DESTRUCTIVE,
      title: TituloAlertaConfirmacion.DESTRUCTIVE,
      message: "¿Estás seguro de que quieres eliminar este envase?",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onConfirm: () => {},
    });

    if (!confirmed) return;

    try {
      const response: ResponsePost = await EnvasePresentacionService.eliminar(id, usuarioId);
      setEnvases((prev) => prev.filter((e) => e.id !== id));

      addAlert({
        type: TipoAlerta.SUCCESS,
        title: TituloAlerta.SUCCESS,
        message: response.mensaje,
        autoClose: true,
      });
    } catch (err) {
      // El backend responde 409 si el envase lo usa algún producto activo.
      mostrarError(err);
    }
  };

  // ===========================
  // BÚSQUEDA
  // ===========================
  const handleBuscarEnvases = async (botonBuscar?: boolean) => {
    if (botonBuscar) {
      setSkip(0);
      setPaginaActual(1);
    }

    setLoading(true);
    setError(null);

    const filtrosConPaginacion = {
      denominacion: filtrosEnvase.denominacion,
      ...(filtrosEnvase.incluirEliminados ? { incluirEliminados: true } : {}),
      skip,
      take,
    };

    try {
      const response = await EnvasePresentacionService.obtener(filtrosConPaginacion);
      setEnvases(response.data);
      setEntidadesTotales(response.total);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filtrosInicializados) {
      handleBuscarEnvases();
    }
  }, [paginaActual, filtrosInicializados]);

  useEffect(() => {
    if (filtrosInicializados) {
      handleBuscarEnvases(true);
    }
  }, [filtrosEnvase]);

  const handlePageChange = (skip: number, take: number, paginaActual: number) => {
    setSkip(skip);
    setTake(take);
    setPaginaActual(paginaActual);
  };

  // ===========================
  // SUCCESS MODAL
  // ===========================
  const handleSuccess = async (mensajeAlerta: string) => {
    modal.cerrar();

    addAlert({
      type: TipoAlerta.SUCCESS,
      title: TituloAlerta.SUCCESS,
      message: mensajeAlerta,
      autoClose: true,
    });

    await handleBuscarEnvases();
  };

  // ===========================
  // RENDER
  // ===========================
  if (error) {
    return (
      <div className="w-full p-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <>
        <Card>
          <CardHeader className="flex justify-between">
            <div className="hidden lg:block">
              <Header
                entidadesTotales={entidadesTotales}
                datosLength={envases.length}
                openModal={modal.abrirAlta}
              />
            </div>

            <div className="lg:hidden">
              <HeaderLg
                entidadesTotales={entidadesTotales}
                datosLength={envases.length}
                openModal={modal.abrirAlta}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <FiltrosEnvasePresentacion onBuscar={setFiltrosEnvase} mostrarIncluirEliminados />

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
                <p className="text-gray-600 text-lg">Cargando envases...</p>
              </div>
            ) : envases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 text-lg">No se encontraron envases.</p>
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden lg:block">
                  <DatosTabla
                    envases={envases}
                    onEditar={handleAbrirEdicion}
                    onInfo={handleMostrarInfo}
                    onDelete={handleDelete}
                  />
                </div>

                {/* Mobile */}
                <div className="lg:hidden space-y-4 p-4">
                  {envases.map((envase) => (
                    <DatosCards
                      key={envase.id}
                      envase={envase}
                      onEditar={handleAbrirEdicion}
                      onInfo={handleMostrarInfo}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-6">
          <Paginacion
            entidadesTotales={entidadesTotales}
            take={take}
            paginaActual={paginaActual}
            onChange={handlePageChange}
          />
        </div>

        <Alertas alerts={alerts} onRemove={removeAlert} />
        <AlertasConfirmacion />
      </>

      {/* MODAL ÚNICO */}
      <EnvasePresentacionModal
        open={modal.tipo !== null}
        tipo={modal.tipo}
        envase={modal.envase}
        auditoria={modal.auditoria as Auditoria | null}
        onClose={modal.cerrar}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
