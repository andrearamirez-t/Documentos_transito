/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DocumentRecord, DocumentType } from "../types";
import { 
  FileText, Check, AlertCircle, Save, RefreshCw, Smartphone, 
  Mail, MapPin, User, Hash, Calendar, DollarSign, PenTool, Award, ShieldAlert
} from "lucide-react";

interface ActiveDocumentDetailProps {
  document: DocumentRecord | null;
  onUpdateDocumentData: (id: string, updatedData: any) => void;
  onSyncDocument: (id: string) => void;
  isSyncing: boolean;
  apiUrl: string;
}

export default function ActiveDocumentDetail({
  document,
  onUpdateDocumentData,
  onSyncDocument,
  isSyncing,
  apiUrl,
}: ActiveDocumentDetailProps) {
  const [editedData, setEditedData] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (document) {
      setEditedData(JSON.parse(JSON.stringify(document.extractedData)));
      setSuccessMsg("");
    } else {
      setEditedData(null);
    }
  }, [document]);

  if (!document) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm h-full flex flex-col items-center justify-center min-h-[400px]">
        <FileText className="w-12 h-12 text-slate-200 mb-3" />
        <h3 className="text-sm font-semibold text-slate-700">Ningún documento seleccionado</h3>
        <p className="text-xs text-slate-400 max-w-[280px] mt-1.5">
          Suba un archivo o seleccione una muestra de la izquierda para extraer su información y validar los datos.
        </p>
      </div>
    );
  }

  const handleFieldChange = (key: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNestedFieldChange = (parentKey: string, childKey: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] || {}),
        [childKey]: value,
      },
    }));
  };

  const handleSave = () => {
    onUpdateDocumentData(document.id, editedData);
    setSuccessMsg("¡Cambios locales guardados con éxito!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.9) return { text: "Excelente", color: "text-green-600 bg-green-50", bar: "bg-green-500" };
    if (confidence >= 0.75) return { text: "Buena", color: "text-amber-600 bg-amber-50", bar: "bg-amber-500" };
    return { text: "Baja / Revisar", color: "text-rose-600 bg-rose-50", bar: "bg-rose-500" };
  };

  const confInfo = getConfidenceLevel(document.confidence);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full [content-visibility:auto]">
      {/* Cabecera del Documento Activo */}
      <div className="mb-5 border-b border-slate-150 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded ${
              document.documentType === 'cedula' ? 'bg-amber-100 text-amber-800' :
              document.documentType === 'factura' ? 'bg-emerald-100 text-emerald-800' :
              document.documentType === 'runt' ? 'bg-blue-100 text-blue-800' :
              document.documentType === 'gases' ? 'bg-teal-100 text-teal-800' :
              document.documentType === 'poder' ? 'bg-purple-100 text-purple-800' :
              'bg-slate-100 text-slate-800'
            }`}>
              {document.documentType.toUpperCase()}
            </span>
            <h3 className="text-sm font-bold uppercase tracking-tight text-slate-700 truncate max-w-[200px]" title={document.fileName}>
              {document.fileName}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded ${confInfo.color}`}>
              Confianza: {confInfo.text} ({(document.confidence * 100).toFixed(0)}%)
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 italic">
          "{document.summary}"
        </p>
      </div>

      {/* Editor del Formulario de Datos */}
      <div className="flex-1 overflow-y-auto space-y-4 max-h-[460px] pr-1.5 custom-scrollbar mb-5">
        {editedData && (
          <div className="space-y-4">
            
            {/* 1. CAMPOS PARA CEDULA */}
            {document.documentType === "cedula" && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Información de Identidad
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      value={editedData.nombreCompleto || ""}
                      onChange={(e) => handleFieldChange("nombreCompleto", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Número de Cédula</label>
                    <input
                      type="text"
                      value={editedData.numeroDocumento || ""}
                      onChange={(e) => handleFieldChange("numeroDocumento", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nacimiento</label>
                    <input
                      type="text"
                      value={editedData.fechaNacimiento || ""}
                      onChange={(e) => handleFieldChange("fechaNacimiento", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Sexo</label>
                    <select
                      value={editedData.sexo || ""}
                      onChange={(e) => handleFieldChange("sexo", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                    >
                      <option value="">-</option>
                      <option value="M">Masculino (M)</option>
                      <option value="F">Femenino (F)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">RH</label>
                    <input
                      type="text"
                      value={editedData.rh || ""}
                      onChange={(e) => handleFieldChange("rh", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-center focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Estatura</label>
                    <input
                      type="text"
                      value={editedData.estatura || ""}
                      onChange={(e) => handleFieldChange("estatura", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-center focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <PenTool className="w-3.5 h-3.5" /> Información de Contacto (Manuscrita / Extraída)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-slate-400" /> Teléfono Celular
                      </label>
                      <input
                        type="text"
                        value={editedData.contacto?.celular || ""}
                        onChange={(e) => handleNestedFieldChange("contacto", "celular", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> Correo Electrónico
                      </label>
                      <input
                        type="text"
                        value={editedData.contacto?.correo || ""}
                        onChange={(e) => handleNestedFieldChange("contacto", "correo", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all font-mono text-indigo-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> Dirección de Residencia
                    </label>
                    <input
                      type="text"
                      value={editedData.contacto?.direccion || ""}
                      onChange={(e) => handleNestedFieldChange("contacto", "direccion", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. CAMPOS PARA FACTURA */}
            {document.documentType === "factura" && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" /> Detalles de Facturación
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">No. Factura</label>
                    <input
                      type="text"
                      value={editedData.numeroFactura || ""}
                      onChange={(e) => handleFieldChange("numeroFactura", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Fecha Emisión</label>
                    <input
                      type="text"
                      value={editedData.fecha || ""}
                      onChange={(e) => handleFieldChange("fecha", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Comprador Electrónico</label>
                    <input
                      type="text"
                      value={editedData.compradorNombre || ""}
                      onChange={(e) => handleFieldChange("compradorNombre", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Identificación del Comprador</label>
                    <input
                      type="text"
                      value={editedData.compradorIdentificacion || ""}
                      onChange={(e) => handleFieldChange("compradorIdentificacion", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-3 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Propiedades Técnicas del Vehículo
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Marca</label>
                    <input
                      type="text"
                      value={editedData.vehiculoMarca || ""}
                      onChange={(e) => handleFieldChange("vehiculoMarca", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Línea/Referencia</label>
                    <input
                      type="text"
                      value={editedData.vehiculoLinea || ""}
                      onChange={(e) => handleFieldChange("vehiculoLinea", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Modelo (Año)</label>
                    <input
                      type="text"
                      value={editedData.vehiculoModelo || ""}
                      onChange={(e) => handleFieldChange("vehiculoModelo", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">No. Motor</label>
                    <input
                      type="text"
                      value={editedData.vehiculoMotor || ""}
                      onChange={(e) => handleFieldChange("vehiculoMotor", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">No. Chasis / VIN</label>
                    <input
                      type="text"
                      value={editedData.vehiculoChasis || ""}
                      onChange={(e) => handleFieldChange("vehiculoChasis", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cilindrada (CC)</label>
                    <input
                      type="text"
                      value={editedData.vehiculoCilindrada || ""}
                      onChange={(e) => handleFieldChange("vehiculoCilindrada", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Color Vehículo</label>
                    <input
                      type="text"
                      value={editedData.vehiculoColor || ""}
                      onChange={(e) => handleFieldChange("vehiculoColor", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-center"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between mt-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Transacción</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 text-base">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <input
                      type="number"
                      value={editedData.valorTotal || 0}
                      onChange={(e) => handleFieldChange("valorTotal", parseFloat(e.target.value) || 0)}
                      className="w-28 text-right bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-indigo-500 py-0.5 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. CAMPOS PARA FORMULARIO RUNT */}
            {document.documentType === "runt" && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Solicitud RUNT Oficial
                </h4>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Trámite Solicitado</label>
                  <input
                    type="text"
                    value={editedData.tramiteSolicitado || ""}
                    onChange={(e) => handleFieldChange("tramiteSolicitado", e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all uppercase font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Propietario / Comprador</label>
                    <input
                      type="text"
                      value={editedData.propietarioNombre || ""}
                      onChange={(e) => handleFieldChange("propietarioNombre", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">No. Documento C.C / NIT</label>
                    <input
                      type="text"
                      value={editedData.propietarioIdentificacion || ""}
                      onChange={(e) => handleFieldChange("propietarioIdentificacion", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-3">Especificaciones RUNT Vehículo</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Marca v.</label>
                    <input
                      type="text"
                      value={editedData.vehiculoMarca || ""}
                      onChange={(e) => handleFieldChange("vehiculoMarca", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Línea v.</label>
                    <input
                      type="text"
                      value={editedData.vehiculoLinea || ""}
                      onChange={(e) => handleFieldChange("vehiculoLinea", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cilindrada</label>
                    <input
                      type="text"
                      value={editedData.vehiculoCilindrada || ""}
                      onChange={(e) => handleFieldChange("vehiculoCilindrada", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Modelo</label>
                    <input
                      type="text"
                      value={editedData.vehiculoModelo || ""}
                      onChange={(e) => handleFieldChange("vehiculoModelo", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-center font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Serial Chasis</label>
                    <input
                      type="text"
                      value={editedData.vehiculoChasis || ""}
                      onChange={(e) => handleFieldChange("vehiculoChasis", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Serial Motor</label>
                    <input
                      type="text"
                      value={editedData.vehiculoMotor || ""}
                      onChange={(e) => handleFieldChange("vehiculoMotor", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. CAMPOS PARA GASES / EMPADRONAMIENTO */}
            {document.documentType === "gases" && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Certificados Técnicos y Ambientales
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tipo de Certificado</label>
                    <input
                      type="text"
                      value={editedData.tipoCertificado || ""}
                      onChange={(e) => handleFieldChange("tipoCertificado", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Fecha Certificación</label>
                    <input
                      type="text"
                      value={editedData.fechaCertificado || ""}
                      onChange={(e) => handleFieldChange("fechaCertificado", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Marca</label>
                    <input
                      type="text"
                      value={editedData.vehiculoMarca || ""}
                      onChange={(e) => handleFieldChange("vehiculoMarca", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Línea</label>
                    <input
                      type="text"
                      value={editedData.vehiculoLinea || ""}
                      onChange={(e) => handleFieldChange("vehiculoLinea", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cilindrada</label>
                    <input
                      type="text"
                      value={editedData.vehiculoCilindrada || ""}
                      onChange={(e) => handleFieldChange("vehiculoCilindrada", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Modelo</label>
                    <input
                      type="text"
                      value={editedData.vehiculoModelo || ""}
                      onChange={(e) => handleFieldChange("vehiculoModelo", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-center font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">No. Motor</label>
                    <input
                      type="text"
                      value={editedData.vehiculoMotor || ""}
                      onChange={(e) => handleFieldChange("vehiculoMotor", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">No. Chasis / VIN</label>
                    <input
                      type="text"
                      value={editedData.vehiculoChasis || ""}
                      onChange={(e) => handleFieldChange("vehiculoChasis", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. CAMPOS PARA PODER */}
            {document.documentType === "poder" && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <PenTool className="w-3.5 h-3.5" /> Poder Especial Otorgado
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Otorgante (Firma)</label>
                    <input
                      type="text"
                      value={editedData.otorganteNombre || ""}
                      onChange={(e) => handleFieldChange("otorganteNombre", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Identificación Otorgante</label>
                    <input
                      type="text"
                      value={editedData.otorganteIdentificacion || ""}
                      onChange={(e) => handleFieldChange("otorganteIdentificacion", e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Apoderado designado</label>
                  <input
                    type="text"
                    value={editedData.apoderadoNombre || ""}
                    onChange={(e) => handleFieldChange("apoderadoNombre", e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Trámites Autorizados en Formulario</label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(editedData.tramitesAutorizados || []).map((t: string, i: number) => (
                      <span key={i} className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg">
                        {t}
                      </span>
                    ))}
                    {(editedData.tramitesAutorizados || []).length === 0 && (
                      <span className="text-xs text-slate-400 italic">Ninguno especificado o detectado</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 6. OTROS DOCUMENTOS O DESCONOCIDO */}
            {!["cedula", "factura", "runt", "gases", "poder"].includes(document.documentType) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl mb-2 text-xs">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                  <span>No logramos reconocer una categoría de trámite estándar colombiana de forma directa. Visualice o actualice como JSON.</span>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Campos de Texto Genéricos (JSON)</label>
                  <textarea
                    rows={6}
                    value={JSON.stringify(editedData, null, 2)}
                    onChange={(e) => {
                      try {
                        setEditedData(JSON.parse(e.target.value));
                      } catch (err) {}
                    }}
                    className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="border-t border-slate-150 pt-4 space-y-3 mt-auto">
        {successMsg && (
          <div className="text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fadeIn">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-3 border border-slate-200 hover:border-slate-300 text-slate-600 font-bold uppercase tracking-wider text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer bg-white"
            id="btn-save-extracted"
          >
            <Save className="w-3.5 h-3.5" />
            Guardar Cambios Locales
          </button>
          
          <button
            onClick={() => onSyncDocument(document.id)}
            disabled={isSyncing}
            className={`flex-[1.5] py-3 px-4 text-white font-bold uppercase tracking-wider text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
              document.syncStatus === "success"
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-100"
                : "bg-blue-600 hover:bg-blue-500 shadow-blue-100"
            } disabled:opacity-50`}
            id="btn-sync-document"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Sincronizando por API...
              </>
            ) : document.syncStatus === "success" ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Sincronizado (Re-enviar)
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Sincronizar vía API
              </>
            )}
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400">
          Usa la API destino: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">{apiUrl.length > 25 ? apiUrl.substring(0, 25) + "..." : apiUrl}</code>
        </p>
      </div>
    </div>
  );
}
