import { useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { CardContent, CardFooter } from "../../../ui/Card";
import { Button } from "../../../ui/Button";
import FormInput from "../../../herramientas/formateo-de-campos/form-input";
import React from "react";
import { Card } from "../../../ui/Card";
import ProductoService from "../services/producto-service";
import PriceInput from "../../../herramientas/formateo-de-campos/price-input";
import CantidadesInput from "../../../herramientas/formateo-de-campos/cantidades-input";
import { Producto, SelectPresentacion } from "../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { SelectMarca } from "../../../../interfaces/gestion-producto/marca/interfaces-marca";
import { Linea, SelectLinea } from "../../../../interfaces/gestion-producto/linea/interfaces-linea";
import { AlicuotaIva, ResponsePost } from "../../../../interfaces/generales/interfaces-generales";
import Select from "react-select";
import { useEnterFocus } from "../../../herramientas/formateo-de-campos/movimiento-campos";
import { useConfiguracionSistema } from "../../../sistema/ConfiguracionSistemaContext";
import { applyApiErrorToForm, normalizeApiError } from "../../../../utils/errores";
import { Layers } from "lucide-react";
import RegistrarActualizarMarcaForm from "../../marca/utils/registrar-actualizar-marca";
import { ItemProveedor } from "../../../../interfaces/gestion-producto/producto/interfaces-item-proveedor";
import { SelectSublinea } from "../../../../interfaces/gestion-producto/sublinea/interfaces-sublinea";
import { ItemsProveedorEnPayload } from "../interfaces/interfaces-validaciones-item-proveedor";
import { armarPayloadProducto, FormValues, schema, transformData, transformarItemsProdAlternativo } from "../interfaces/interfaces-validaciones-producto";
import LineasSelector from "../componentes/configuracion/lineas-selector";
import EncabezadoFormularios from "../../../ui/encabezadoFormularios";
import MarcasSelector from "../componentes/configuracion/marcas-selector";
import { getUsuarioId } from "../../../../utils/auth";
import RegistrarActualizarLineaForm from "../../linea/utils/registrar-actualizar-linea";
import PorcentajeInput from "../../../herramientas/formateo-de-campos/porcentaje-input";
import { calcularPrecioEstimado, MARGEN_GENERAL } from "./politica-precio";
import PresentacionProducto from "../componentes/configuracion/presentacion-producto";
import EnvasePresentacionService from "../../envase-presentacion/services/envase-presentacion-service";
import RegistrarActualizarEnvasePresentacionForm from "../../envase-presentacion/utils/registrar-actualizar-envase-presentacion";
import type { SelectEnvasePresentacion } from "../../../../interfaces/gestion-producto/envase-presentacion/interfaces-envase-presentacion";
import { presentacionDesdeProducto } from "../domain/presentacion-producto";
import { vistaPreviaDenominacion } from "../domain/denominacion-producto";

export default function RegistrarActualizarProductoForm({
  producto,
  onClose,
  onSuccess,
  onNotify,
  onRefresh,
}: {
  producto?: Producto;
  onClose: () => void;
  onSuccess: (mensajeAlerta: string) => void;
  onNotify?: (alert: { type: "error" | "warning"; title: string; message: string }) => void;
  onRefresh?: () => Promise<void> | void;
}) {
  //===================== CONSTANTES VARIAS ============================================
  const usuarioId = getUsuarioId();

  const { configuracion } = useConfiguracionSistema();
  const [rStockCritico, setStockCritico] = useState(false);
  const [pack, setPack] = useState(false);
  const [usaOferta, setUsaOferta] = useState(false);
  const [lineaSeleccionada, setLineaSeleccionada] = useState<Linea>({} as Linea);
  // PA-023 §5: obligatoria en el alta y si el producto ya tiene una.
  const presentacionObligatoria = !producto || !!producto.presentacion;

  console.log("Configuración del sistema:", configuracion);

  const methods = useForm<FormValues>({
    resolver: yupResolver(schema(rStockCritico, pack, usaOferta, presentacionObligatoria)),
    defaultValues: producto
      ? transformData(producto)
      : {
          alicuotaIva: AlicuotaIva.ALICUOTA_21,
          margen: MARGEN_GENERAL,
          // CR-005: en el alta, la denominación se genera por defecto.
          generarDenominacionAutomatica: true,
        },
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = methods;

  console.log("estos son los errores", errors);

  console.log("Producto que llega al formulario", producto);

  console.log("linea seleccionada", lineaSeleccionada);

  const [marcas, setMarcas] = React.useState<SelectMarca[]>([]);
  const [lineas, setLineas] = React.useState<SelectLinea[]>([]);
  
  const [denominacionMarca, setDenominacionMarca] = useState(" ");
  const [denominacionLinea, setDenominacionLinea] = useState(" ");
  const [selectedLinea, setSelectedLinea] = React.useState<SelectLinea>();
  const [selectedMarca, setSelectedMarca] = React.useState<SelectMarca>();
  const [mostrarFormularioLinea, setMostrarFormularioLinea] = useState(false);
  const [mostrarFormularioMarca, setMostrarFormularioMarca] = useState(false);
  const [envases, setEnvases] = useState<SelectEnvasePresentacion[]>([]);
  const [denominacionEnvase, setDenominacionEnvase] = useState(" ");
  const [selectedEnvase, setSelectedEnvase] = useState<SelectEnvasePresentacion | null>(
    producto?.presentacion?.envase ?? null,
  );
  const [mostrarFormularioEnvase, setMostrarFormularioEnvase] = useState(false);
  const [itemProdAlternativoSinAgregar, setItemProdAlternativoSinAgregar] = useState(false);

  const stock = watch(`stock`);
  const stockMinimo = watch("stockMinimo");
  const cantidadPorPack = watch("cantidadPorPack");
  const utilizaStockMinimo = watch("utilizaStockMinimo");
  const utilizaPack = watch("utilizaPack");
  const costo = watch("costo") ?? 0;
  const margen = watch("margen");
  const precioEstimado = calcularPrecioEstimado(costo, margen);

  // CR-005: solo es una vista previa; el backend arma la denominación final.
  const generarDenominacionAutomatica = !producto && watch("generarDenominacionAutomatica") === true;
  const denominacionVistaPrevia = vistaPreviaDenominacion({
    marca: selectedMarca?.denominacion,
    linea: selectedLinea?.denominacion,
    envase: selectedEnvase?.denominacion,
    cantidad: watch("presentacion.cantidad"),
    unidad: watch("presentacion.unidad"),
  });


  //=============================== CONSTANTES PARA MOVIMIENTO ENTRE CAMPOS ==================================
  const denominacionProductoRef = useRef<HTMLInputElement>(null);
  useEnterFocus(denominacionProductoRef);
  const observacionRef = useRef<HTMLInputElement>(null);
  const ubicacionRef = useRef<HTMLInputElement>(null);
  const selectTipoProductoRef = useRef<HTMLDivElement>(null);
  const selectAlicuotaIvaRef = useRef<HTMLDivElement>(null);
  const precioOfertaRef = useRef<HTMLInputElement>(null);
  const denominacionLineaRef = useRef<HTMLInputElement>(null);
  const selectLineaRef = useRef<HTMLDivElement>(null);
  const denominacionMarcaRef = useRef<HTMLInputElement>(null);
  const selectMarcaRef = useRef<HTMLDivElement>(null);
  const denominacionEnvaseRef = useRef<HTMLInputElement>(null);
  const selectEnvaseRef = useRef<HTMLDivElement>(null);

  const enterToObservacion = useEnterFocus(observacionRef);
  const enterToPrecioOferta = useEnterFocus(precioOfertaRef);
  const enterToDenominacionMarca = useEnterFocus(denominacionMarcaRef);

  //=============================== FUNCIONALIDAD ==================================

  useEffect(() => {
    if (!utilizaStockMinimo) {
      setValue("stockMinimo", 0);
    }
    if (!utilizaPack) {
      setValue("cantidadPorPack", 0);
    }
    
  }, [utilizaStockMinimo, utilizaPack, false, setValue]);

  useEffect(() => {
    setValue("stockMinimo", lineaSeleccionada.stockMinimo || 0);
    setValue("utilizaStockMinimo", lineaSeleccionada.utilizaStockMinimo || false);
  }, [lineaSeleccionada]);

  useEffect(() => {
    setPack(utilizaPack || false);
    setStockCritico(utilizaStockMinimo || false);
    setUsaOferta(false);
  }, [utilizaPack, utilizaStockMinimo, false]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (producto) {
          setValue("lineaId", producto.linea.id || 0);
          setSelectedLinea(producto.linea);

          setValue("marcaId", producto.marca.id || 0);
          setSelectedMarca(producto.marca);

          
          setValue("denominacion", producto.denominacion || "");
          setValue("observacion", producto.observacion || null);
          setValue("stock", producto.stock || 0);
          setValue("costo", producto.costo || 0);
          setValue("margen", producto.margen ?? null);
          
          //setValue("oferta", producto.oferta || false);
          setValue("alicuotaIva", producto.alicuotaIva || 0);

          setValue("stockMinimo", producto.stockMinimo || 0);
          setValue("utilizaStockMinimo", producto.utilizaStockMinimo || false);
          setValue("cantidadPorPack", producto.cantidadPorPack || 0);
          setValue("utilizaPack", producto.utilizaPack || false);
          setValue("presentacion", presentacionDesdeProducto(producto.presentacion));
          setSelectedEnvase(producto.presentacion?.envase ?? null);
        
          console.error("llega aca", producto);
        
        }
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    fetchData();
  }, [producto]);

  const onSubmit = async (formData: FormValues) => {
    let response: ResponsePost;

    try {
      // ⚠️ Validar si hay ítems sin agregar
      if (itemProdAlternativoSinAgregar) {
        const mensaje = [
          itemProdAlternativoSinAgregar ? "- Hay un producto alternativo sin agregar." : "",
          "",
          "¿Estás seguro de que querés registrar sin agregarlos?",
        ]
          .filter(Boolean)
          .join("\n");

        const confirmar = window.confirm(mensaje);

        if (!confirmar) return; // el usuario canceló
      }

      if (producto) {
        const payload = {
          ...armarPayloadProducto(formData),
          usuarioUpdatedId: usuarioId,
        };

        response = await ProductoService.actualizar(producto.id, payload);
      } else {
        const payload = {
          ...sinCamposPrecioDerivados(formData),
          ...(formData.stock != null ? { stock: formData.stock } : {}),
          usuarioCreatedId: usuarioId,
        };

        response = await ProductoService.nuevo(payload);
      }

      await onSuccess(response.mensaje);
      onClose();
    } catch (error) {
      // Las reglas de la presentación las valida el backend: su mensaje se
      // muestra junto a los campos de la presentación.
      const { code, message, statusCode } = normalizeApiError(error);
      if (code === "PRESENTACION_INVALIDA" || code === "PRESENTACION_REQUERIDA") {
        setError("presentacion", { type: "server", message });
        return;
      }
      // Se muestra el mensaje del backend: el texto genérico de CONFLICTO
      // ("El recurso fue modificado por otra operación.") no explica una
      // denominación repetida. Con la automática, la salida es escribirla a mano.
      if (statusCode === 409) {
        const sugerencia = formData.generarDenominacionAutomatica
          ? " Podés editar la denominación manualmente."
          : "";
        setError("root", { type: "server", message: `${message.replace(/\.?$/, ".")}${sugerencia}` });
        return;
      }
      const apiError = applyApiErrorToForm(error, setError, onNotify ?? (() => {}));
      if (apiError.statusCode === 404) await onRefresh?.();
    }
  };

  // CR-005: el usuario puede reemplazar la denominación generada. Arranca con
  // la vista previa, y desde ahí los cambios de marca, línea o presentación ya
  // no la tocan. Al cambiar de modo se limpia el error del último intento
  // (por ejemplo, un 409 por la denominación generada).
  const editarDenominacionManualmente = () => {
    setValue("denominacion", denominacionVistaPrevia ?? "");
    setValue("generarDenominacionAutomatica", false);
    clearErrors("root");
    setTimeout(() => denominacionProductoRef.current?.focus(), 0);
  };

  const volverADenominacionAutomatica = () => {
    setValue("denominacion", "");
    setValue("generarDenominacionAutomatica", true);
    clearErrors("denominacion");
    clearErrors("root");
  };

  const handleBuscarPorDenominacion = async (select: string) => {
    try {
      if (select === "LINEA") {
        const lineas = await ProductoService.obtenerTotales({ denominacion: denominacionLinea }, "lineas");
        if (lineas) {
          console.log("Lineas encontradas:", lineas);
          setLineas(lineas.data);
        } else {
          console.log("No se encontró una linea con la denominación ingresada.");
        }
      }
      if (select === "ENVASE") {
        const envases = await EnvasePresentacionService.obtenerSelect(denominacionEnvase);
        setEnvases(envases?.data ?? []);
      }
      if (select === "MARCA") {
        const marcas = await ProductoService.obtenerTotales({ denominacion: denominacionMarca }, "marcas");
        if (marcas) {
          console.log("Marcas encontradas:", marcas);
          setMarcas(marcas.data);
        } else {
          console.log("No se encontró una marca con la denominación ingresada.");
        }
      }
      
    } catch (error) {
      console.error("Error al buscar por código:", error);
    }
  };

  const handleEnterEnSelect = async (e: React.KeyboardEvent<HTMLInputElement>, select: string) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (select === "LINEA") {
        handleBuscarPorDenominacion("LINEA");
      }

      if (select === "MARCA") {
        handleBuscarPorDenominacion("MARCA");
      }

      if (select === "ENVASE") {
        handleBuscarPorDenominacion("ENVASE");
      }

      // Esperar un poco (opcional, si el botón hace una búsqueda antes)
      setTimeout(() => {
        let selectDiv: HTMLDivElement | null = null;

        if (select === "MARCA") {
          selectDiv = selectMarcaRef.current;
        }

        if (select === "LINEA") {
          selectDiv = selectLineaRef.current;
        }

        if (select === "ENVASE") {
          selectDiv = selectEnvaseRef.current;
        }

        if (select === "TIPO-PRODUCTO") {
          selectDiv = selectTipoProductoRef.current;
        }

        if (select === "ALICUOTA-IVA") {
          selectDiv = selectAlicuotaIvaRef.current;
        }

        if (selectDiv) {
          const input = selectDiv.querySelector("input");
          if (input) {
            input.focus();
            input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
          }
        }
      }, 300); // Ajustá este delay según el tiempo de búsqueda, si es necesario
    }
  };



  return (
    <div className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-50 z-50 overflow-y-auto py-5">
      <Card className="w-full max-w-7xl bg-white mx-auto shadow-lg rounded-2xl overflow-hidden relative mt-10 mb-12">
        <EncabezadoFormularios
          title={producto ? "Producto" : "Registrar Producto"}
          subtitle={
            producto
              ? "Ingrese los datos"
            : "Ingresa los datos."
          }
          icon={<Layers className="form-icon" />}
          onClose={onClose}
        />  

        {/* Formulario */}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 px-6 py-4">
              {/* Primera fila */}
              <div className="flex flex-col w-full gap-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 col-span-full">
                  <div className="col-span-full flex flex-col gap-1">
                    {generarDenominacionAutomatica ? (
                      <div className="space-y-1 sm:space-y-2">
                        <label className="label-base" htmlFor="denominacion-automatica">Denominación</label>
                        <output
                          id="denominacion-automatica"
                          className={`block w-full p-2 border border-gray-300 bg-gray-100 rounded-md ${
                            denominacionVistaPrevia ? "text-black" : "text-gray-500 italic"
                          }`}
                        >
                          {denominacionVistaPrevia ?? "Se genera al elegir la marca, la línea y la presentación."}
                        </output>
                        <small className="block text-gray-500">
                          Vista previa: se genera automáticamente con Marca + Línea + Presentación y el sistema
                          define el nombre final al registrar (por ejemplo, 1000 ml se guarda como 1 L).
                        </small>
                        {errors.denominacion?.message && (
                          <small className="block text-red-500">{errors.denominacion.message}</small>
                        )}
                      </div>
                    ) : (
                      <FormInput
                        name="denominacion"
                        label="Denominación"
                        placeholder="Ingresa la denominación"
                        disabled={producto && producto.sistema > 0 ? true : false}
                        onKeyDown={enterToObservacion}
                        inputRef={denominacionProductoRef}
                      />
                    )}

                    {!producto && (
                      <label className="flex items-center gap-2 text-sm text-gray-500">
                        <input
                          type="checkbox"
                          checked={generarDenominacionAutomatica}
                          onChange={(e) =>
                            e.target.checked ? volverADenominacionAutomatica() : editarDenominacionManualmente()
                          }
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        Denominación automática
                      </label>
                    )}
                  </div>

                  {/* <FormInput
                    name="costo"
                    label="Costo"
                    placeholder="Ingresa el costo"
                  />

                  <FormInput
                    name="precio"
                    label="Precio"
                    placeholder="Ingresa el precio"
                  />

                  <FormInput
                    name="porcentaje"
                    label="Porcentaje"
                    placeholder="Ingresa el porcentaje"
                  /> */}

                  <PriceInput
                    name="costo"
                    label="Costo"
                    value={watch("costo") || 0}
                    onChange={(value) => setValue("costo", value, { shouldValidate: true })}
                    maxDigits={9}
                    disabled={producto && producto.sistema > 0 ? true : false}
                  />
                  <PorcentajeInput
                    name="margen"
                    label="Margen particular"
                    value={margen ?? MARGEN_GENERAL}
                    onChange={(value) => setValue("margen", value, { shouldValidate: true })}
                    disabled={producto && producto.sistema > 0 ? true : false}
                  />

                  <div className="space-y-1 sm:space-y-2">
                    <label className="label-base" htmlFor="precio-estimado">Precio de venta estimado</label>
                    <output
                      id="precio-estimado"
                      className="block w-full text-right p-2 border border-gray-300 bg-gray-100 rounded-md text-black"
                    >
                      ${precioEstimado.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                    </output>
                    <small className="text-gray-500">Valor calculado en función del costo y margen.</small>
                  </div>

                  


                  <FormInput
                    name="ubicacion"
                    label="Ubicación"
                    placeholder="Ingresa una ubicación (opcional)"
                    onKeyDown={(e) => handleEnterEnSelect(e, "TIPO-PRODUCTO")}
                    inputRef={ubicacionRef}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Alicuota IVA</label>
                    <div ref={selectAlicuotaIvaRef} className="w-full">
                      <Select
                        value={
                          Object.entries(AlicuotaIva)
                            .map(([key, value]) => ({
                              id: value,
                              denominacion: key === "ALICUOTA_105" ? "10.5" : key.replace("ALICUOTA_", ""),
                            }))
                            .find((option) => option.id === watch("alicuotaIva")) || null
                        }
                        options={Object.entries(AlicuotaIva).map(([key, value]) => ({
                          id: value,
                          denominacion: key === "ALICUOTA_105" ? "10.5" : key.replace("ALICUOTA_", ""),
                        }))}
                        onKeyDown={enterToPrecioOferta}
                        getOptionLabel={(option) => option.denominacion}
                        getOptionValue={(option) => String(option.id)}
                        isDisabled={producto && producto.sistema > 0 ? true : false}
                        onChange={(selectedOption) => {
                          methods.setValue(`alicuotaIva`, selectedOption?.id || 0);
                        }}
                        className="text-black"
                        menuPortalTarget={document.body}
                        styles={{
                          control: (base) => ({
                            ...base,
                            color: "black",
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: "black",
                          }),
                          option: (base, { isSelected, isFocused }) => ({
                            ...base,
                            color: isSelected ? "white" : "black",
                            backgroundColor: isSelected ? "#3b82f6" : isFocused ? "#93c5fd" : "white",
                          }),
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                      />
                      {errors.alicuotaIva && (
                        <small className="text-red-500">{errors.alicuotaIva?.message as string}</small>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-[120px]">
                    <CantidadesInput
                      name={`stock`}
                      label={producto ? "Stock" : "Stock inicial"}
                      value={stock || 0}
                      onChange={(value) => setValue(`stock`, Number(value))}
                      disabled={producto ? true : false}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 w-full">
                  <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                    <div className="col-span-full flex flex-wrap gap-4 mt-8">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...methods.register("utilizaStockMinimo")}
                          className={` w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500`}
                          disabled={producto && producto.sistema > 0 ? true : false}
                        />
                      </label>
                    </div>

                    <CantidadesInput
                      name={`stockMinimo`}
                      label="Stock Crítico"
                      value={stockMinimo || 0}
                      onChange={(value) => setValue(`stockMinimo`, Number(value))}
                      disabled={utilizaStockMinimo ? false : true}
                    />
                  </div>

                  

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 min-w-[140px]">
                    <div className="col-span-full flex flex-wrap gap-4 mt-8">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...methods.register("utilizaPack")}
                          className={`w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500`}
                          disabled={producto && producto.sistema > 0 ? true : false}
                        />
                      </label>
                    </div>

                    <CantidadesInput
                      name={`cantidadPorPack`}
                      label="Cantidad Pack"
                      value={cantidadPorPack || 0}
                      onChange={(value) => setValue(`cantidadPorPack`, Number(value))}
                      disabled={utilizaPack ? false : true}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col w-full gap-2">

              <LineasSelector
                denominacionLinea={denominacionLinea}
                setDenominacionLinea={setDenominacionLinea}
                denominacionLineaRef={denominacionLineaRef}
                selectLineaRef={selectLineaRef}
                lineas={lineas}
                selectedLinea={selectedLinea}
                lineaId={watch("lineaId")}
                disabled={producto && producto.sistema > 0}
                errors={errors}
                onEnterLinea={(e) => handleEnterEnSelect(e, "LINEA")}
                onEnterDenominacion={enterToDenominacionMarca}
                onLineaChange={(linea) => {
                  methods.setValue("lineaId", linea?.id || 0);
                  setLineaSeleccionada(linea as any);
                  setSelectedLinea(linea ?? undefined);
                }}
                onAgregarLinea={() => setMostrarFormularioLinea(true)}
              />

              <MarcasSelector
                denominacionMarca={denominacionMarca}
                setDenominacionMarca={setDenominacionMarca}
                denominacionMarcaRef={denominacionMarcaRef}
                selectMarcaRef={selectMarcaRef}
                marcas={marcas}
                selectedMarca={selectedMarca}
                marcaId={watch("marcaId")}
                disabled={producto && producto.sistema > 0}
                error={errors.marcaId?.message}
                onEnterMarca={(e) => handleEnterEnSelect(e, "MARCA")}
                onChangeMarca={(marca) => {
                  methods.setValue("marcaId", marca?.id || 0);
                  setSelectedMarca(marca ?? undefined);
                }}
                onAgregarMarca={() => setMostrarFormularioMarca(true)}
              />

              <PresentacionProducto
                obligatoria={presentacionObligatoria}
                envases={envases}
                envaseSeleccionado={selectedEnvase}
                denominacionEnvase={denominacionEnvase}
                setDenominacionEnvase={setDenominacionEnvase}
                denominacionEnvaseRef={denominacionEnvaseRef}
                selectEnvaseRef={selectEnvaseRef}
                disabled={producto && producto.sistema > 0}
                onEnterEnvase={(e) => handleEnterEnSelect(e as React.KeyboardEvent<HTMLInputElement>, "ENVASE")}
                onChangeEnvase={(envase) => {
                  setSelectedEnvase(envase);
                  setValue("presentacion.envaseId", envase?.id ?? null, { shouldValidate: methods.formState.isSubmitted });
                }}
                onAgregarEnvase={() => setMostrarFormularioEnvase(true)}
              />

              </div>

              {/* Segunda fila */}


              <hr className="col-span-full my-2 border-gray-300" />

              
              
            </CardContent>

            {errors.root?.message && <div className="text-red-600 text-center mb-4">{String(errors.root.message)}</div>}

            {/* Botón de submit */}
            <CardFooter className="flex justify-center">
              <Button type="submit" disabled={isSubmitting} className="btn btn-dark">
                {isSubmitting
                  ? producto
                    ? "Actualizando..."
                    : "Registrando..."
                  : producto
                  ? "Actualizar"
                  : "Registrar"}
              </Button>
            </CardFooter>
          </form>
        </FormProvider>

        {mostrarFormularioLinea && (
          <RegistrarActualizarLineaForm
            onClose={() => setMostrarFormularioLinea(false)}
            onSuccess={() => {
              setMostrarFormularioLinea(false);
              handleBuscarPorDenominacion("LINEA")
            }}
          />
        )}


        {mostrarFormularioEnvase && (
          <RegistrarActualizarEnvasePresentacionForm
            onClose={() => setMostrarFormularioEnvase(false)}
            onSuccess={() => {
              setMostrarFormularioEnvase(false);
              handleBuscarPorDenominacion("ENVASE");
            }}
          />
        )}

        {mostrarFormularioMarca && (
          <RegistrarActualizarMarcaForm
            onClose={() => setMostrarFormularioMarca(false)}
            onSuccess={() => {
              setMostrarFormularioMarca(false);
              handleBuscarPorDenominacion("MARCA")
            }}
          />
        )}

       
      </Card>
    </div>
  );
}
