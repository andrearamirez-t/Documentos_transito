/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { DocumentRecord } from "../types";
import { X, Globe, ArrowRight, CornerDownRight, Check, ShieldAlert, Code } from "lucide-react";

interface NetworkLogModalProps {
  document: DocumentRecord | null;
  onClose: () => void;
}

export default function NetworkLogModal({
  document,
  onClose,
}: NetworkLogModalProps) {
  if (!document) return null;

  const logs = document.logs || [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 [content-visibility:auto]" id="network-log-modal-overlay">
      <div 
        className="bg-slate-950 text-slate-100 rounded-2xl max-w-2xl w-full border border-slate-800 shadow-2xl flex flex-col max-h-[85vh] animate-fadeIn" 
        onClick={(e) => e.stopPropagation()}
        id="network-log-modal"
      >
        {/* Cabecera del Modal */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-blue-400 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Inspector de Tráfico de Red (API Log)
              </h3>
              <p className="text-[10px] text-slate-400">
                Peticiones HTTP reales emitidas por el servidor con destino a la base de datos externa.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            id="btn-close-log-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido de los Logs */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {logs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500">
              <Globe className="w-8 h-8 text-slate-800 mx-auto mb-2" />
              <p className="text-xs font-semibold mb-1">Ninguna petición emitida todavía</p>
              <p className="text-[10px] text-slate-500">
                Presione el botón "Sincronizar vía API" del documento para disparar el flujo de red.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={index} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
                  {/* Status Bar */}
                  <div className="bg-slate-950 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        log.success ? "bg-emerald-950/80 text-emerald-300" : "bg-rose-950/80 text-rose-300"
                      }`}>
                        {log.responseStatus} {log.success ? "OK" : "ERROR"}
                      </span>
                      <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-bold">
                        {log.method}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px] truncate max-w-[240px]" title={log.url}>
                        {log.url}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString("es-CO")}
                    </span>
                  </div>

                  {/* Cuerpo del Detalle */}
                  <div className="p-4 space-y-3.5 font-mono">
                    
                    {/* Comando curl equivalente */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
                        <CornerDownRight className="w-3.5 h-3.5 text-blue-400" /> Comando cURL Equivalente
                      </span>
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px] text-blue-300 overflow-x-auto whitespace-pre select-all border-l-2 border-l-blue-500">
                        curl -X POST "{log.url}" \<br />
                        &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                        &nbsp;&nbsp;-d '{JSON.stringify({ ...log.requestPayload, extractedData: "..." })}'
                      </div>
                    </div>

                    {/* Request Payload */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
                        <Code className="w-3.5 h-3.5 text-blue-400" /> Petición Saliente (Request Body)
                      </span>
                      <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto text-[10px] text-slate-300 leading-tight">
                        {JSON.stringify(log.requestPayload, null, 2)}
                      </pre>
                    </div>

                    {/* Response Payload */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
                        {log.success ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        Respuesta del Servidor Externo (Response)
                      </span>
                      <pre className={`p-3 rounded-lg border overflow-x-auto text-[10px] leading-tight ${
                        log.success 
                          ? "bg-slate-950 border-slate-800 text-emerald-400" 
                          : "bg-red-950/20 border-red-900/40 text-rose-400"
                      }`}>
                        {JSON.stringify(log.responseBody, null, 2)}
                      </pre>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 text-center rounded-b-2xl">
          <p className="text-[9px] text-slate-500 leading-relaxed font-mono">
            Proceso de Integración Transaccional de Tránsito Colombiano (REST API over TLS)
          </p>
        </div>
      </div>
    </div>
  );
}
