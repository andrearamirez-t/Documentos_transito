/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { DocumentRecord } from "../types";
import { ListFilter, Clock, CheckCircle2, XCircle, AlertCircle, Trash, Eye, Search } from "lucide-react";

interface DocumentListProps {
  documents: DocumentRecord[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export default function DocumentList({
  documents,
  activeId,
  onSelect,
  onDelete,
}: DocumentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const getSyncStatusBadge = (status: "pending" | "success" | "failed") => {
    switch (status) {
      case "success":
        return (
          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Sincronizado
          </span>
        );
      case "failed":
        return (
          <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-500" />
            Fallo API
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded border border-amber-100 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-500 " />
            Pendiente
          </span>
        );
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" }) + " (" + date.toLocaleDateString("es-CO", { day: "numeric", month: "short" }) + ")";
    } catch (e) {
      return "Hace poco";
    }
  };

  // Filter logic
  const filteredDocuments = documents.filter((doc) => {
    // Search in fileName, summary, or documentType content
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      doc.fileName.toLowerCase().includes(searchLower) ||
      (doc.summary && doc.summary.toLowerCase().includes(searchLower)) ||
      doc.documentType.toLowerCase().includes(searchLower);

    const matchesType = !selectedType || doc.documentType === selectedType;
    const matchesStatus = !selectedStatus || doc.syncStatus === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const hasActiveFilters = searchTerm || selectedType || selectedStatus;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm [content-visibility:auto]">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <h3 className="text-sm font-bold uppercase tracking-tight text-slate-700 flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-slate-500" />
          Historial de Documentos
          {hasActiveFilters ? (
            <span className="text-xs text-blue-600 font-medium normal-case">
              ({filteredDocuments.length} de {documents.length})
            </span>
          ) : (
            <span className="text-xs text-slate-400 font-medium normal-case">
              ({documents.length})
            </span>
          )}
        </h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Últimos escaneados
        </span>
      </div>

      {/* Buscador y Filtros Interactivos */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, tipo o resumen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">Tipo: Todos</option>
            <option value="cedula">Cédula de Ciudadanía</option>
            <option value="factura">Factura de Venta</option>
            <option value="runt">Formulario RUNT</option>
            <option value="gases">Revisión de Gases</option>
            <option value="poder">Poder de Trámite</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">Sincronización: Todas</option>
            <option value="pending">Pendientes</option>
            <option value="success">Sincronizados</option>
            <option value="failed">Fallo API</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 px-2.5 py-1 border border-slate-200/50 rounded-lg font-semibold">
            <span>Resultados de búsqueda: {filteredDocuments.length} encontrado(s)</span>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedType("");
                setSelectedStatus("");
              }}
              className="text-blue-600 hover:text-blue-500 font-bold uppercase tracking-wider text-[9px] hover:underline cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-100 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">
            {hasActiveFilters 
              ? "Ningún documento de la sesión coincide con los filtros." 
              : "No hay documentos registrados para escanear en esta sesión."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedType("");
                setSelectedStatus("");
              }}
              className="mt-2 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Restablecer filtros de búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {filteredDocuments.map((doc) => {
            const isActive = doc.id === activeId;
            return (
              <div
                key={doc.id}
                onClick={() => onSelect(doc.id)}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-50 border-blue-400 shadow-xs"
                    : "bg-white border-slate-150 hover:border-slate-300 hover:scale-[1.005]"
                }`}
                id={`document-list-item-${doc.id}`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                      doc.documentType === 'cedula' ? 'bg-amber-100 text-amber-800' :
                      doc.documentType === 'factura' ? 'bg-emerald-100 text-emerald-800' :
                      doc.documentType === 'runt' ? 'bg-blue-100 text-blue-800' :
                      doc.documentType === 'gases' ? 'bg-teal-100 text-teal-800' :
                      doc.documentType === 'poder' ? 'bg-purple-100 text-purple-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {doc.documentType}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 truncate block group-hover:text-blue-600 transition-colors">
                      {doc.fileName}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-slate-500 line-clamp-1 mb-1 font-medium">
                    {doc.summary}
                  </p>

                  <div className="flex items-center gap-2.5 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-300" />
                      {formatDate(doc.scannedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {getSyncStatusBadge(doc.syncStatus)}
                  <button
                    onClick={(e) => onDelete(doc.id, e)}
                    className="p-1 px-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors ml-1.5 cursor-pointer"
                    title="Eliminar registro"
                    id={`btn-delete-doc-${doc.id}`}
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
