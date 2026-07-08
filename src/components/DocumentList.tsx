/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { DocumentRecord } from "../types";
import { Clock, CheckCircle2, XCircle, AlertCircle, Trash, Search, User, ChevronDown, ChevronUp } from "lucide-react";

interface DocumentListProps {
  documents: DocumentRecord[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onDeleteTramite: (tramiteId: string) => void;
}

interface TramiteGroup {
  tramiteId: string;
  clientName: string;
  docs: DocumentRecord[];
  scannedAt: string;
  syncSummary: "success" | "pending" | "failed" | "mixed";
}

function getClientName(docs: DocumentRecord[]): string {
  const cedula = docs.find((d) => d.documentType === "cedula");
  if (cedula?.extractedData?.nombreCompleto) return cedula.extractedData.nombreCompleto;
  const factura = docs.find((d) => d.documentType === "factura");
  if (factura?.extractedData?.compradorNombre) return factura.extractedData.compradorNombre;
  const poder = docs.find((d) => d.documentType === "poder");
  if (poder?.extractedData?.otorganteNombre) return poder.extractedData.otorganteNombre;
  const runt = docs.find((d) => d.documentType === "runt");
  if (runt?.extractedData?.propietarioNombre) return runt.extractedData.propietarioNombre;
  return docs[0]?.fileName || "Trámite sin nombre";
}

function getSyncSummary(docs: DocumentRecord[]): TramiteGroup["syncSummary"] {
  const statuses = docs.map((d) => d.syncStatus);
  if (statuses.every((s) => s === "success")) return "success";
  if (statuses.every((s) => s === "pending")) return "pending";
  if (statuses.some((s) => s === "failed")) return "failed";
  return "mixed";
}

const TYPE_LABELS: Record<string, string> = {
  cedula: "CC",
  factura: "FAC",
  runt: "RUNT",
  gases: "GAS",
  poder: "POD",
  desconocido: "???",
};

const TYPE_COLORS: Record<string, string> = {
  cedula: "bg-indigo-100 text-indigo-700",
  factura: "bg-emerald-100 text-emerald-700",
  runt: "bg-blue-100 text-blue-700",
  gases: "bg-teal-100 text-teal-700",
  poder: "bg-purple-100 text-purple-700",
  desconocido: "bg-slate-100 text-slate-600",
};

export default function DocumentList({ documents, activeId, onSelect, onDelete, onDeleteTramite }: DocumentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const hasActiveFilters = searchTerm || selectedType || selectedStatus;

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return (
        date.toLocaleDateString("es-CO", { day: "numeric", month: "short" }) +
        " · " +
        date.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" })
      );
    } catch {
      return "Fecha desconocida";
    }
  };

  const toggleGroup = (tramiteId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(tramiteId) ? next.delete(tramiteId) : next.add(tramiteId);
      return next;
    });
  };

  // Filtered flat list (used when filters are active)
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
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
  }, [documents, searchTerm, selectedType, selectedStatus]);

  // Grouped view (used when no filters active)
  const groups = useMemo<TramiteGroup[]>(() => {
    const map = new Map<string, DocumentRecord[]>();
    documents.forEach((doc) => {
      const key = doc.tramiteId || doc.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(doc);
    });
    return Array.from(map.entries())
      .map(([tramiteId, docs]) => ({
        tramiteId,
        clientName: getClientName(docs),
        docs,
        scannedAt: docs[0].scannedAt,
        syncSummary: getSyncSummary(docs),
      }))
      .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
  }, [documents]);

  const getSyncBadge = (status: string, small = false) => {
    const base = small ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5";
    if (status === "success")
      return <span className={`${base} font-semibold bg-emerald-50 text-emerald-700 rounded border border-emerald-100 flex items-center gap-1`}><CheckCircle2 className="w-3 h-3" />Sincronizado</span>;
    if (status === "failed")
      return <span className={`${base} font-semibold bg-rose-50 text-rose-700 rounded border border-rose-100 flex items-center gap-1`}><XCircle className="w-3 h-3" />Fallo</span>;
    if (status === "mixed")
      return <span className={`${base} font-semibold bg-amber-50 text-amber-700 rounded border border-amber-100 flex items-center gap-1`}><AlertCircle className="w-3 h-3" />Parcial</span>;
    return <span className={`${base} font-semibold bg-amber-50 text-amber-700 rounded border border-amber-100 flex items-center gap-1`}><AlertCircle className="w-3 h-3" />Pendiente</span>;
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4">
      {/* Buscador y Filtros */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, tipo o resumen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer">
            <option value="">Tipo: Todos</option>
            <option value="cedula">Cédula</option>
            <option value="factura">Factura</option>
            <option value="runt">RUNT</option>
            <option value="gases">Gases</option>
            <option value="poder">Poder</option>
          </select>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer">
            <option value="">Sincronización: Todas</option>
            <option value="pending">Pendientes</option>
            <option value="success">Sincronizados</option>
            <option value="failed">Fallo API</option>
          </select>
        </div>
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 border border-slate-200/50 rounded-lg font-semibold">
            <span>{filteredDocs.length} resultado(s)</span>
            <button onClick={() => { setSearchTerm(""); setSelectedType(""); setSelectedStatus(""); }}
              className="text-blue-600 hover:underline font-bold uppercase text-[9px] cursor-pointer">
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Vista con filtros activos — lista plana */}
      {hasActiveFilters ? (
        filteredDocs.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
            <p className="text-xs text-slate-400">Ningún documento coincide con los filtros.</p>
            <button onClick={() => { setSearchTerm(""); setSelectedType(""); setSelectedStatus(""); }}
              className="mt-2 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer">
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {filteredDocs.map((doc) => (
              <FlatDocRow key={doc.id} doc={doc} isActive={doc.id === activeId} onSelect={onSelect} onDelete={onDelete} getSyncBadge={getSyncBadge} />
            ))}
          </div>
        )
      ) : (
        /* Vista agrupada por trámite */
        groups.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-600 rounded-xl">
            <p className="text-xs text-slate-400">No hay documentos registrados en esta sesión.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {groups.map((group) => {
              const isExpanded = expandedGroups.has(group.tramiteId);
              const hasActive = group.docs.some((d) => d.id === activeId);
              return (
                <div key={group.tramiteId} className={`rounded-xl border transition-all ${hasActive ? "border-blue-300 dark:border-blue-600" : "border-slate-200 dark:border-slate-700"}`}>
                  {/* Cabecera del grupo */}
                  <div className="flex items-center">
                    <button
                      onClick={() => { toggleGroup(group.tramiteId); if (!isExpanded) onSelect(group.docs[0].id); }}
                      className="flex-1 flex items-center justify-between px-3 py-2.5 rounded-tl-xl rounded-bl-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="bg-blue-100 dark:bg-blue-900/40 p-1.5 rounded-lg shrink-0">
                          <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{group.clientName}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{formatDate(group.scannedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {getSyncBadge(group.syncSummary, true)}
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          {group.docs.length}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteTramite(group.tramiteId); }}
                      className="px-2.5 py-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-tr-xl rounded-br-xl transition-colors shrink-0"
                      title="Eliminar trámite completo"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Documentos del grupo (expandidos) */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-50 dark:divide-slate-700/50">
                      {group.docs.map((doc) => (
                        <FlatDocRow key={doc.id} doc={doc} isActive={doc.id === activeId} onSelect={onSelect} onDelete={onDelete} getSyncBadge={getSyncBadge} compact />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

function FlatDocRow({ doc, isActive, onSelect, onDelete, getSyncBadge, compact = false }: {
  doc: DocumentRecord; isActive: boolean; onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  getSyncBadge: (status: string, small?: boolean) => React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      onClick={() => onSelect(doc.id)}
      className={`flex items-center justify-between ${compact ? "px-3 py-2" : "p-3 rounded-xl border"} transition-all cursor-pointer ${
        isActive
          ? compact ? "bg-blue-50 dark:bg-slate-700" : "bg-blue-50 dark:bg-slate-700 border-blue-400"
          : compact ? "hover:bg-slate-50 dark:hover:bg-slate-700/50" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${TYPE_COLORS[doc.documentType] || TYPE_COLORS.desconocido}`}>
          {TYPE_LABELS[doc.documentType] || "???"}
        </span>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">{doc.summary || doc.fileName}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {getSyncBadge(doc.syncStatus, true)}
        <button
          onClick={(e) => onDelete(doc.id, e)}
          className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          title="Eliminar"
        >
          <Trash className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
