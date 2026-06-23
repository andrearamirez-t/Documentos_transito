/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Upload, FileText, FileImage, ShieldCheck, HelpCircle } from "lucide-react";

interface DocumentDropzoneProps {
  onAnalyze: (base64: string, mimeType: string, fileName: string) => void;
  onSelectSample: (sampleKey: string, fileName: string) => void;
  isAnalyzing: boolean;
  onShowHelp: () => void;
}

export default function DocumentDropzone({
  onAnalyze,
  onSelectSample,
  isAnalyzing,
  onShowHelp,
}: DocumentDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    
    // Validar tipo de archivo (imágenes y PDFs)
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      alert("Por favor suba una imagen (JPEG, PNG, WEBP) o un archivo PDF.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Extraer el base64 limpio omitiendo la cabecera dataUrl si es necesario, 
        // pero la enviamos tal cual o con split en el server
        const base64Data = reader.result.split(",")[1];
        onAnalyze(base64Data, file.type, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const sampleDocs = [
    { key: "sample_cedula", name: "1. Cédula Brayan Salgado.png", desc: "Cédula de Identidad con datos manuscritos", type: "Cédula" },
    { key: "sample_factura", name: "2. Factura Éxito Mosquera.pdf", desc: "Factura compra de moto VOGE 300 Rally", type: "Factura" },
    { key: "sample_runt", name: "3. Solicitud Formulario RUNT.pdf", desc: "Formulario de Traspaso de Tránsito", type: "RUNT" },
    { key: "sample_gases", name: "4. Certificado Gases y Empadronamiento.pdf", desc: "Certificado de gases AKT-VOGE", type: "Emisiones" },
    { key: "sample_poder", name: "5. Poder de Trámite Especial.pdf", desc: "Poder para firmar trámites ante Tránsito", type: "Poder" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-tight text-slate-700 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-500" />
          Subir y Digitalizar Documento
        </h2>
        <button
          onClick={onShowHelp}
          className="text-xs text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-1 cursor-pointer"
          id="btn-help-info"
        >
          <HelpCircle className="w-4 h-4" />
          Guía de Archivos
        </button>
      </div>

      <div
        id="file-dropzone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-blue-500 bg-blue-50/40 scale-[0.99]"
            : "border-slate-200 hover:border-blue-400 hover:bg-slate-50/50"
        } ${isAnalyzing ? "opacity-55 pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf"
          onChange={handleChange}
          disabled={isAnalyzing}
          id="file-input-element"
        />

        <div className="flex flex-col items-center">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-full mb-3">
            <Upload className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            Arrastre aquí su documento ó <span className="text-blue-600 underline">busque en su equipo</span>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Soporta imágenes (JPG, PNG, WEBP) o archivos PDF de trámites
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-150 pt-5">
        <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span>O use muestras de los archivos adjuntos</span>
          <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full lowercase normal-case">
            <ShieldCheck className="w-3 h-3" /> listo para pruebas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {sampleDocs.map((sample) => (
            <button
              key={sample.key}
              disabled={isAnalyzing}
              onClick={() => onSelectSample(sample.key, sample.name)}
              className="group flex flex-col items-start p-3 text-left bg-slate-50/80 hover:bg-blue-50/60 rounded-xl border border-slate-200/50 hover:border-blue-100 transition-all text-xs outline-none disabled:opacity-50 cursor-pointer"
              id={`btn-sample-${sample.key}`}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/80 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700 uppercase tracking-tight">
                  {sample.type}
                </span>
                <span className="font-semibold text-slate-700 group-hover:text-blue-900 truncate flex-1">
                  {sample.name.split(". ")[1]}
                </span>
              </div>
              <span className="text-slate-400 text-[10px] mt-1 line-clamp-1">
                {sample.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
