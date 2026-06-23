/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ExternalRecord } from "../types";
import { Database, Trash2, Check, RefreshCw, Calendar, Eye, Code } from "lucide-react";

interface ExternalDatabaseViewProps {
  records: ExternalRecord[];
  onClear: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function ExternalDatabaseView({
  records,
  onClear,
  isLoading,
  onRefresh,
}: ExternalDatabaseViewProps) {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", second: "2-digit" });
    } catch (e) {
      return "Hace poco";
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl [content-visibility:auto]">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-950/60 text-blue-400 p-2 rounded-xl border border-blue-900/30">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-white">
              SISTEMA DESTINO (PRODUCCIÓN)
            </h3>
            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Base de Datos Conectada vía REST API
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1 disabled:opacity-55"
            id="btn-refresh-ext-db"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
          
          {records.length > 0 && (
            <button
              onClick={onClear}
              className="p-1 px-2.5 bg-slate-800/60 hover:bg-rose-950/80 hover:text-rose-400 text-slate-400 rounded-lg transition-colors text-xs flex items-center gap-1 border border-transparent hover:border-rose-900"
              id="btn-clear-ext-db"
            >
              <Trash2 className="w-3 h-3" />
              Vaciar
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-slate-400 leading-relaxed">
          Esta vista simula las tablas SQL del <span className="text-white font-medium">sistema de destino o base de datos externa</span>.
          Al presionar "Sincronizar", los datos viajan mediante un HTTP POST real al endpoint del servidor y se ingresan en estas tablas estructuradas.
        </p>
      </div>

      {records.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 my-4">
          <Database className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Sin registros sincronizados</p>
          <p className="text-[10px] text-slate-500">Sincronice un documento arriba para verlo reflejado aquí.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {records.map((rec) => {
              const isSelected = selectedRecordId === rec.id;
              return (
                <div
                  key={rec.id}
                  className={`bg-slate-950 border rounded-xl overflow-hidden transition-all ${
                    isSelected ? "border-blue-500" : "border-slate-800 hover:border-slate-700"
                  }`}
                  id={`external-record-${rec.id}`}
                >
                  <div
                    onClick={() => setSelectedRecordId(isSelected ? null : rec.id)}
                    className="p-3.5 flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                          ID: {rec.id}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 rounded uppercase ${
                          rec.documentType === 'cedula' ? 'bg-amber-950/60 text-amber-300' :
                          rec.documentType === 'factura' ? 'bg-emerald-950/60 text-emerald-300' :
                          rec.documentType === 'runt' ? 'bg-blue-950/60 text-blue-300' :
                          rec.documentType === 'gases' ? 'bg-teal-950/60 text-teal-300' :
                          rec.documentType === 'poder' ? 'bg-purple-950/60 text-purple-300' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {rec.documentType}
                        </span>
                        
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold ml-auto flex items-center gap-1 bg-emerald-950/30 px-2 py-0.2 rounded">
                          <Check className="w-2.5 h-2.5" /> API Ok
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-white truncate">
                        Cliente: {rec.clientName}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mt-2 font-mono">
                        <div>
                          <span className="text-slate-500">C.C./Ident:</span> {rec.clientDocId}
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500">Chasis:</span> {rec.vehicleChasis || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="bg-slate-905 border-t border-slate-800 p-3 text-xs font-mono text-slate-300 space-y-2 animate-fadeIn max-h-[220px] overflow-y-auto">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-800 pb-1 mb-1">
                        <span>Recibido: {new Date(rec.receivedAt).toLocaleString("es-CO")}</span>
                        <span className="text-blue-400 flex items-center gap-1">
                          <Code className="w-3 h-3" /> mapper_schema.v1
                        </span>
                      </div>
                      <pre className="text-[10px] text-blue-300 overflow-x-auto whitespace-pre-wrap leading-tight bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        {JSON.stringify(rec.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-500 text-center font-mono">
            Mostrando {records.length} registro(s) persistido(s) en la DB del otro sistema.
          </div>
        </div>
      )}
    </div>
  );
}
