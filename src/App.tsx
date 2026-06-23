/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DocumentRecord, ExternalRecord } from "./types";
import DocumentDropzone from "./components/DocumentDropzone";
import ActiveDocumentDetail from "./components/ActiveDocumentDetail";
import DocumentList from "./components/DocumentList";
import ExternalDatabaseView from "./components/ExternalDatabaseView";
import NetworkLogModal from "./components/NetworkLogModal";
import { 
  FileText, ShieldAlert, Cpu, Network, CheckCircle, Database, HelpCircle, 
  Settings, Key, AlertTriangle, Eye, ArrowRight, BookOpen, Clock, Info, ExternalLink,
  RefreshCw
} from "lucide-react";

export default function App() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [externalRecords, setExternalRecords] = useState<ExternalRecord[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | undefined>(undefined);
  
  // Estados de carga (loaders)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingExtDb, setIsLoadingExtDb] = useState(false);
  
  // Modales
  const [showLogModal, setShowLogModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Endpoint configurable de API
  const [targetApiUrl, setTargetApiUrl] = useState("http://localhost:3000/api/external-system-mock");
  const [savedSettingsMsg, setSavedSettingsMsg] = useState("");

  const activeDoc = documents.find((d) => d.id === activeDocId) || null;

  // Cargar datos iniciales al arrancar la app
  useEffect(() => {
    fetchDocumentsAndExternalDb();
  }, []);

  const fetchDocumentsAndExternalDb = async () => {
    try {
      const docsRes = await fetch("/api/documents");
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData);
        if (docsData.length > 0 && !activeDocId) {
          setActiveDocId(docsData[0].id);
        }
      }

      const extRes = await fetch("/api/external-system-db");
      if (extRes.ok) {
        const extData = await extRes.json();
        setExternalRecords(extData);
      }
    } catch (e) {
      console.error("Error al refrescar bases de datos:", e);
    }
  };

  // 1. Analizar archivo subido (MimeType / Base64)
  const handleAnalyzeDocument = async (base64: string, mimeType: string, fileName: string) => {
    setIsAnalyzing(true);
    setAnalyzeMsg("Subiendo archivo encryptado de tránsito y lanzando IA de Gemini...");
    
    // Simular pequeños pasos de progreso visuales para una experiencia excelente de usuario
    const steps = [
      "Subiendo archivo encryptado de tránsito y lanzando IA de Gemini...",
      "Ejecutando OCR inteligente y descifrando firmas manuscritas...",
      "Clasificando formulario y aplicando mapeo de propiedades...",
      "Formateando esquema JSON listo para sincronizar vía API...",
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setAnalyzeMsg(steps[stepIndex]);
      }
    }, 1500);

    try {
      const res = await fetch("/api/documents/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mimeType, fileName }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || errData.details || "Fallo en la comunicación con la IA");
      }

      const newRecord = await res.json();
      setDocuments((prev) => [newRecord, ...prev]);
      setActiveDocId(newRecord.id);
    } catch (error: any) {
      alert(`Error de Procesamiento: ${error.message}\n\n${error.hint || "Por favor, configure su API Key de Gemini en el panel Settings > Secrets de AI Studio."}`);
    } finally {
      setIsAnalyzing(false);
      setAnalyzeMsg("");
    }
  };

  // 2. Analizar muestra precargada de prueba (1-Click instantáneo)
  const handleSelectSample = async (sampleKey: string, fileName: string) => {
    setIsAnalyzing(true);
    setAnalyzeMsg("Despachando muestra de tránsito para simulación de lectura...");
    
    // Darle un aire de realismo
    const steps = [
      "Precargando imagen seleccionada por el usuario...",
      "Enviando documento de demostración de Brayan Salgado a la API...",
      "Interpretando datos del RUNT y del comprador electrónico...",
      "Generando payload seguro para la API destino...",
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setAnalyzeMsg(steps[stepIndex]);
      }
    }, 850);

    try {
      const res = await fetch("/api/documents/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleKey, fileName }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Fallo de respuesta del servidor");
      }

      const newRecord = await res.json();
      setDocuments((prev) => [newRecord, ...prev]);
      setActiveDocId(newRecord.id);
    } catch (error: any) {
      alert(`Error al procesar la muestra: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
      setAnalyzeMsg("");
    }
  };

  // 3. Modificar datos de forma local antes de enviar por la API
  const handleUpdateDocumentData = (id: string, updatedData: any) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === id) {
          return {
            ...doc,
            extractedData: updatedData,
          };
        }
        return doc;
      })
    );
  };

  // 4. Sincronizar vía API al sistema externo
  const handleSyncDocument = async (id: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/documents/sync/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl: targetApiUrl }),
      });

      const syncResult = await res.json();
      
      // Actualizar listado local de documentos
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === id) {
            const success = syncResult.success;
            return {
              ...doc,
              syncStatus: success ? "success" : "failed",
              syncUrlUsed: targetApiUrl,
              logs: [syncResult.logEntry, ...(doc.logs || [])],
            };
          }
          return doc;
        })
      );

      // Refrescar DB externa del otro sistema visible
      await refreshExternalDb();

      if (syncResult.success) {
        // Mostrar pequeña confirmación opcional o abrir inspector
        setTimeout(() => {
          setShowLogModal(true);
        }, 500);
      } else {
        alert(`Fallo en el envío por API: Servidor retornó status ${syncResult.status}`);
      }

    } catch (e: any) {
      alert(`Error de sincronización: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // 5. Vaciar DB externa simulada de tránsito
  const handleClearExternalDb = async () => {
    setIsLoadingExtDb(true);
    try {
      await fetch("/api/external-system-db/clear", { method: "DELETE" });
      await refreshExternalDb();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingExtDb(false);
    }
  };

  // 6. Eliminar documento del historial
  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (activeDocId === id) {
        setActiveDocId(undefined);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const refreshExternalDb = async () => {
    setIsLoadingExtDb(true);
    try {
      const res = await fetch("/api/external-system-db");
      if (res.ok) {
        const extData = await res.json();
        setExternalRecords(extData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingExtDb(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSettingsMsg("¡Configuración de API guardada!");
    setTimeout(() => setSavedSettingsMsg(""), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      
      {/* HEADER DE LA APLICACIÓN */}
      <header className="bg-white border-b border-slate-150 sticky top-0 z-40 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-blue-100 shadow-md">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900" id="app-title-main">
                Scanner & Sincronizador de Trámites de Tránsito
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Digitalización inteligente de Cédulas, Facturas, RUNT, Gases y Poderes con envío vía REST API.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-2 px-4 border border-blue-100 hover:border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              id="btn-case-guide"
            >
              <BookOpen className="w-4 h-4" />
              Guía del Caso Brayan Salgado
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-xl border transition-all ${
                showSettings 
                  ? "bg-slate-100 text-slate-800 border-slate-300" 
                  : "bg-white text-slate-500 border-slate-200 hover:text-slate-800"
              }`}
              title="Configuración de la API destino"
              id="btn-toggle-settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* LOADER DEL PROCESAMIENTO CON INTELIGENCIA ARTIFICIAL (GEMINI) */}
      {isAnalyzing && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-blue-950 px-6 py-4 text-center select-none shadow-sm flex items-center justify-center gap-3 animate-pulse">
          <RefreshCw className="w-4 animate-spin text-blue-400" />
          <span className="text-xs font-semibold tracking-wider uppercase font-mono">
            Procesando Trámite: <span className="text-blue-200 font-normal normal-case inline">{analyzeMsg}</span>
          </span>
        </div>
      )}

      {/* CUERPO PRINCIPAL DEL DASHBOARD */}
      <main className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: CONFIGURADOR API, SUBIDA Y HISTORIAL (5 de 12 columnas) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          
          {/* PANEL DE CONFIGURACIÓN DE LA API DESTINO */}
          {showSettings && (
            <div className="bg-white rounded-2xl border border-dashed border-blue-200 p-5 shadow-xs animate-slideDown">
              <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold text-xs uppercase tracking-wider">
                <Settings className="w-4 h-4 text-blue-600" />
                Configurar API de Destino (Otra Aplicación)
              </div>
              <form onSubmit={handleSaveSettings} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">
                    URL Endpoint Destino (HTTP POST)
                  </label>
                  <input
                    type="url"
                    value={targetApiUrl}
                    onChange={(e) => setTargetApiUrl(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono focus:outline-none focus:border-blue-400 focus:bg-white"
                    placeholder="https://otra-aplicacion.com/api/transito/v1"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Por defecto apunta al mock local integrado para ver los registros insertados en tiempo real.
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-green-600 font-semibold">{savedSettingsMsg}</span>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 text-white font-semibold text-[11px] rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Guardar Parámetros
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* DRAG & DROP E IMÁGENES DE MUESTRA PARA OCR */}
          <DocumentDropzone
            onAnalyze={handleAnalyzeDocument}
            onSelectSample={handleSelectSample}
            isAnalyzing={isAnalyzing}
            onShowHelp={() => setShowHelpModal(true)}
          />

          {/* HISTORIAL LOCAL EN LA DB DE ESTE SISTEMA */}
          <DocumentList
            documents={documents}
            activeId={activeDocId}
            onSelect={(id) => {
              setActiveDocId(id);
              setShowLogModal(false);
            }}
            onDelete={handleDeleteDocument}
          />
        </div>

        {/* COLUMNA CENTRAL-DERECHA (7 de 12 columnas): VISOR DE EXTRACCIÓN Y API DESTINO */}
        <div className="lg:col-span-7 space-y-6 flex flex-col h-full [content-visibility:auto]">
          
          {/* DETALLES Y VALIDACIÓN DEL DOCUMENTO ACTIVO */}
          <div className="flex-1">
            <ActiveDocumentDetail
              document={activeDoc}
              onUpdateDocumentData={handleUpdateDocumentData}
              onSyncDocument={handleSyncDocument}
              isSyncing={isSyncing}
              apiUrl={targetApiUrl}
            />
          </div>

          {/* MONITOREO DE BASE DE DATOS EXTERNA SIMULADA */}
          <div>
            <ExternalDatabaseView
              records={externalRecords}
              onClear={handleClearExternalDb}
              isLoading={isLoadingExtDb}
              onRefresh={refreshExternalDb}
            />
          </div>
        </div>

      </main>

      {/* INSPECTOR DE LOGS DE RED (MODAL) */}
      {showLogModal && activeDoc && (
        <NetworkLogModal
          document={activeDoc}
          onClose={() => setShowLogModal(false)}
        />
      )}

      {/* GUÍA DE ARCHIVOS DEL TRÁMITE / AYUDA (MODAL) */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="help-modal-overlay">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] text-slate-800 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Guía de Gestión del Trámite Colombiano: Brayan Camilo Salgado
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-colors text-xs font-semibold cursor-pointer"
                id="btn-close-help"
              >
                Cerrar Guía
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 leading-relaxed custom-scrollbar">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 mb-0.5">El caso de Negocio Sincronizado</p>
                  <p className="text-[11px] text-blue-950">
                    Los archivos adjuntos corresponden a un trámite real de <strong>traspaso de motocicleta</strong> en Colombia en Junio de 2026. El comprador del vehículo es BRAYAN CAMILO SALGADO JIMENEZ, quien compra una motocicleta <strong>VOGE 300Rally de color Gris Modelo 2027</strong>.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-tight text-[11px] mb-2 flex items-center gap-1.5 border-b border-slate-50 pb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Los Documentos y datos extraídos:
                </h4>
                <ul className="space-y-3 pl-1 text-[11px]">
                  <li>
                    <strong className="text-slate-800">1. Cédula de Ciudadanía Colombiana (Pág. 5)</strong>:
                    Identificación de Brayan (C.C. 1.233.498.817). Note que el modelo IA puede leer y decodificar datos manuscritos escritos abajo en bolígrafo sobre el papel fotocopiado: Celular (3102389606), Dirección (Cl 24E # 1-147, Madrid Cundinamarca), Correo (SalgadoBS98@gmail.com).
                  </li>
                  <li>
                    <strong className="text-slate-800">2. Factura de Venta Éxito (Pág 1 y 4)</strong>:
                    Comprobante fiscal con número RZ2173627 del Almacén Éxito Mosquera del 06-Jun-2026. Detalla la moto 300Rally, valor de $17.590.000, número de chasis (9F2A73001VB000332), número de motor (LC178MN445103Q5), color Gris, modelo 2027.
                  </li>
                  <li>
                    <strong className="text-slate-800">3. Formulario Nacional RUNT (Pág. 2)</strong>:
                    Formulario oficial de Solicitud de Trámites del Registro Nacional Automotor con casilla de "Traspaso" marcada para moto VOGE 300Rally.
                  </li>
                  <li>
                    <strong className="text-slate-800">4. Certificado de Gases y Empadronamiento (Pág 3)</strong>:
                    Expedido por AKT Motos. Valida la cilindrada oficial de la motocicleta (292 cc) y los códigos VIN del motor.
                  </li>
                  <li>
                    <strong className="text-slate-800">5. Poder de Trámite Especial (Pág. 6)</strong>:
                    Documento de mandato legal por Brayan Camilo Salgado facultando a TRANSITEMOS para radicar y solicitar el traspaso de placas y alertas.
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-tight text-[11px] mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> ¿Cómo probar el flujo completo de la API?
                </h4>
                <ol className="list-decimal list-inside space-y-2.5 pl-1.5 text-[11px]">
                  <li>
                    Haga click en cualquiera de las <strong>muestras rápidas de tránsito</strong> a la izquierda.
                  </li>
                  <li>
                    La aplicación digitalizará la información automáticamente, estructurándola bajo las reglas de tránsito de Colombia.
                  </li>
                  <li>
                    Valide y modifique cualquier dato si lo desea en los campos editables del formulario central. Presione "Guardar Cambios Locales" para registrar sus ediciones.
                  </li>
                  <li>
                    Haga clic en <strong>"Sincronizar vía API"</strong>. El servidor gestionará un POST real enviando el JSON estructurado. Sabrá que triunfó puesto que el registro aparecerá de inmediato en la tabla de base de datos del "Sistema Destino" de la derecha. El Inspector se abrirá mostrando el request/response HTTP.
                  </li>
                </ol>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-between text-[10px] text-slate-500">
              <span>Soporte Técnico de Integración • API Rest v1.0</span>
              <a href="https://runt.com.co" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-0.5 font-medium">
                Sistemas RUNT Colombia <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-150 py-5 mt-auto text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Procesamiento Electrónico Inteligente de Trámites © 2026. Todos los derechos reservados.</span>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px]">API Endpoint: Active</span>
            <span className="font-mono text-[10px]">Engine: Gemini 3.5 Flash</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
