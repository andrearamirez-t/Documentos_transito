/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Upload, HelpCircle, FileText } from "lucide-react";

interface DocumentDropzoneProps {
  onAnalyze: (base64: string, mimeType: string, fileName: string) => void;
  isAnalyzing: boolean;
  onShowHelp: () => void;
  onFilterType?: (type: string | null) => void;
  activeFilter?: string | null;
  documentCounts?: Record<string, number>;
}

export default function DocumentDropzone({ onAnalyze, isAnalyzing, onShowHelp, onFilterType, activeFilter, documentCounts = {} }: DocumentDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const processFile = (file: File) => {
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      alert("Por favor suba una imagen (JPEG, PNG, WEBP) o un archivo PDF.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onAnalyze(reader.result.split(",")[1], file.type, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const docTypes = [
    { label: "Cédula",    desc: "Cédula de Ciudadanía",      type: "cedula"   },
    { label: "Factura",   desc: "Factura de compraventa",    type: "factura"  },
    { label: "RUNT",      desc: "Formulario de trámite RUNT",type: "runt"     },
    { label: "Emisiones", desc: "Certificado de gases",      type: "gases"    },
    { label: "Poder",     desc: "Poder de trámite especial", type: "poder"    },
  ];

  const handleBadgeClick = (type: string) => {
    if (!onFilterType) return;
    onFilterType(activeFilter === type ? null : type);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-tight text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-500" />
          Subir y Digitalizar Documento
        </h2>
        <button
          onClick={onShowHelp}
          className="text-xs text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          Guía de Archivos
        </button>
      </div>

      {/* Zona de arrastre / clic */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-blue-500 bg-blue-50/40 dark:bg-blue-900/20 scale-[0.99]"
            : "border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50/50 dark:hover:bg-slate-700/50"
        } ${isAnalyzing ? "opacity-55 pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf"
          onChange={handleChange}
          disabled={isAnalyzing}
        />
        <div className="flex flex-col items-center">
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 p-3 rounded-full mb-3">
            <Upload className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Arrastre aquí su documento ó{" "}
            <span className="text-blue-600 underline">busque en su equipo</span>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Soporta imágenes (JPG, PNG, WEBP) o archivos PDF de trámites
          </p>
        </div>
      </div>

      {/* Tipos de documentos — clic para ir al documento de ese tipo */}
      <div className="mt-5 border-t border-slate-100 dark:border-slate-700 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          Ir al documento por tipo
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {docTypes.map((t) => {
            const count = documentCounts[t.type] ?? 0;
            const isActive = activeFilter === t.type;
            const hasDoc = count > 0;
            return (
              <button
                key={t.label}
                onClick={() => hasDoc ? handleBadgeClick(t.type) : undefined}
                disabled={!hasDoc}
                className={`flex flex-col p-2.5 rounded-lg border text-left transition-all duration-150 ${
                  !hasDoc
                    ? "bg-slate-50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800 opacity-40 cursor-not-allowed"
                    : isActive
                    ? "bg-blue-50 dark:bg-blue-900/40 border-blue-400 dark:border-blue-500 shadow-sm cursor-pointer"
                    : "bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight ${
                    isActive
                      ? "bg-blue-500 text-white"
                      : hasDoc
                      ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                  }`}>
                    {t.label}
                  </span>
                  {hasDoc && (
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1 rounded">
                      {count}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                  {t.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
