/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Configurar parser con límite de 50mb para recibir imágenes en base64 grandes sin error
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Inicialización diferida y segura de Gemini API para que no falle al iniciar si la clave falta
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY no configurada. Por favor, agregue su API Key en el panel Settings > Secrets.");
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Base de datos en memoria para documentos analizados
interface DocumentRecord {
  id: string;
  fileName: string;
  documentType: string;
  extractedData: any;
  confidence: number;
  summary: string;
  scannedAt: string;
  syncStatus: "pending" | "success" | "failed";
  syncUrlUsed?: string;
  logs: any[];
}

// Base de datos en memoria para Simular la OTRA aplicación externa
interface ExternalRecord {
  id: string;
  receivedAt: string;
  originDocumentId: string;
  documentType: string;
  clientName: string;
  clientDocId: string;
  vehicleChasis: string;
  vehicleMotor: string;
  details: any;
}

let documentsDB: DocumentRecord[] = [];
let externalSystemDB: ExternalRecord[] = [];

// Precargar datos de prueba de Brayan Camilo Salgado que corresponden a los documentos adjuntos
const MOCK_SAMPLES: Record<string, { documentType: string; extractedData: any; summary: string; confidence: number }> = {
  "sample_factura": {
    documentType: "factura",
    confidence: 0.98,
    summary: "Factura de compra de motocicleta VOGE 300Rally de ÉXITO MOSQUERA para Brayan Camilo Salgado Jimenez",
    extractedData: {
      numeroFactura: "RZ2173627",
      fecha: "2026-06-06T15:59:24",
      compradorNombre: "BRAYAN CAMILO SALGADO JIMENEZ",
      compradorIdentificacion: "1233498817",
      vehiculoMarca: "ART - VOGE",
      vehiculoLinea: "300RALLY",
      vehiculoModelo: "2027",
      vehiculoMotor: "LC178MN445103Q5",
      vehiculoChasis: "9F2A73001VB000332",
      vehiculoCilindrada: "292 cc",
      vehiculoColor: "GRIS",
      valorTotal: 17590000
    }
  },
  "sample_runt": {
    documentType: "runt",
    confidence: 0.96,
    summary: "Formulario de solicitud de trámites RUNT para traspaso de motocicleta por Brayan Camilo Salgado",
    extractedData: {
      tramiteSolicitado: "Traspaso de Propiedad",
      propietarioNombre: "Brayan Camilo Salgado Jimenez",
      propietarioIdentificacion: "1233498817",
      vehiculoMarca: "ART-VOGE",
      vehiculoLinea: "300Rally",
      vehiculoMotor: "LC178MN445103Q5",
      vehiculoChasis: "9F2A73001VB000332",
      vehiculoModelo: "2027",
      vehiculoCilindrada: "292 cc",
      vehiculoColor: "Gris"
    }
  },
  "sample_gases": {
    documentType: "gases",
    confidence: 0.97,
    summary: "Certificado de Empadronamiento y de Emisiones de Gases AKT Motos para la motocicleta Rally 300",
    extractedData: {
      tipoCertificado: "Certificado de Empadronamiento y Emisiones",
      fechaCertificado: "2026-04-11",
      vehiculoMarca: "AKT-VOGE",
      vehiculoLinea: "300RALLY",
      vehiculoChasis: "9F2A73001VB000332",
      vehiculoMotor: "LC178MN445103Q5",
      vehiculoCilindrada: "292 cc",
      vehiculoModelo: "2027"
    }
  },
  "sample_cedula": {
    documentType: "cedula",
    confidence: 0.99,
    summary: "Cédula de Ciudadanía Colombiana de Brayan Camilo Salgado Jimenez con anotaciones manuscritas de contacto",
    extractedData: {
      nombreCompleto: "BRAYAN CAMILO SALGADO JIMENEZ",
      numeroDocumento: "1.233.498.817",
      fechaNacimiento: "1998-07-18",
      sexo: "M",
      rh: "O+",
      estatura: "1.77 m",
      contacto: {
        celular: "3102389606",
        correo: "SalgadoBS98@gmail.com",
        direccion: "Cl 24E # 1-147, Madrid Cundinamarca"
      }
    }
  },
  "sample_poder": {
    documentType: "poder",
    confidence: 0.95,
    summary: "Poder para trámites de tránsito firmado por Brayan Camilo Salgado Jimenez otorgado a TRANSITEMOS",
    extractedData: {
      otorganteNombre: "Brayan Camilo Salgado Jimenez",
      otorganteIdentificacion: "1233498817",
      apoderadoNombre: "TRANSITEMOS / APODERADO INDETERMINADO",
      tramitesAutorizados: [
        "Matrícula Inicial",
        "Inscripción de Alerta",
        "Traspaso"
      ]
    }
  }
};

// Cargar algunos registros iniciales para visualización rápida de excelente valor
if (documentsDB.length === 0) {
  const now = new Date();
  documentsDB.push({
    id: "doc_1",
    fileName: "cedula_brayan_camilo.png",
    documentType: "cedula",
    extractedData: MOCK_SAMPLES["sample_cedula"].extractedData,
    confidence: 0.99,
    summary: MOCK_SAMPLES["sample_cedula"].summary,
    scannedAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), // hace 30 minutos
    syncStatus: "success",
    syncUrlUsed: "http://localhost:3000/api/external-system-mock",
    logs: [
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 29).toISOString(),
        url: "http://localhost:3000/api/external-system-mock",
        method: "POST",
        requestPayload: MOCK_SAMPLES["sample_cedula"].extractedData,
        responseStatus: 201,
        responseBody: { status: "success", recordId: "ext_init_1", message: "Registro guardado en base de datos externa de tránsito." },
        success: true
      }
    ]
  });

  // Agregar a la DB externa simulada de tránsito el registro precargado sincronizado
  externalSystemDB.push({
    id: "ext_init_1",
    receivedAt: new Date(now.getTime() - 1000 * 60 * 29).toISOString(),
    originDocumentId: "doc_1",
    documentType: "cedula",
    clientName: "BRAYAN CAMILO SALGADO JIMENEZ",
    clientDocId: "1.233.498.817",
    vehicleChasis: "N/A",
    vehicleMotor: "N/A",
    details: MOCK_SAMPLES["sample_cedula"].extractedData
  });

  documentsDB.push({
    id: "doc_2",
    fileName: "factura_voge_300rally.pdf",
    documentType: "factura",
    extractedData: MOCK_SAMPLES["sample_factura"].extractedData,
    confidence: 0.98,
    summary: MOCK_SAMPLES["sample_factura"].summary,
    scannedAt: new Date(now.getTime() - 1000 * 60 * 15).toISOString(), // hace 15 minutos
    syncStatus: "pending",
    logs: []
  });
}


/* ==================== API ENDPOINTS ==================== */

// 1. Obtener todos los documentos parseados
app.get("/api/documents", (_req, res) => {
  res.json(documentsDB);
});

// 2. Obtener la base de datos externa simulada
app.get("/api/external-system-db", (_req, res) => {
  res.json(externalSystemDB);
});

// 3. Endpoint para Limpiar DB externa simulada
app.delete("/api/external-system-db/clear", (_req, res) => {
  externalSystemDB = [];
  res.json({ message: "Base de datos externa simulada vaciada con éxito." });
});

// 4. Eliminar un documento específico
app.delete("/api/documents/:id", (req, res) => {
  const { id } = req.params;
  documentsDB = documentsDB.filter(d => d.id !== id);
  res.json({ success: true, message: "Documento eliminado." });
});

// 5. Analizar documento subido (usando Gemini o fallback de prueba)
app.post("/api/documents/analyze", async (req, res) => {
  const { fileName, mimeType, base64, sampleKey } = req.body;

  // Si envuelve un sample y el usuario pidió fallback rápido o no hay API key de Gemini
  if (sampleKey && MOCK_SAMPLES[sampleKey]) {
    const sample = MOCK_SAMPLES[sampleKey];
    const newRecord: DocumentRecord = {
      id: "doc_" + Date.now(),
      fileName: fileName || `${sampleKey}.png`,
      documentType: sample.documentType,
      extractedData: sample.extractedData,
      confidence: sample.confidence,
      summary: sample.summary,
      scannedAt: new Date().toISOString(),
      syncStatus: "pending",
      logs: []
    };
    documentsDB.unshift(newRecord);
    return res.status(201).json(newRecord);
  }

  // Si no se proporcionó base64, dar error
  if (!base64) {
    return res.status(400).json({ error: "No se proporcionó data de imagen o archivo en base64" });
  }

  try {
    const ai = getGeminiClient();

    const imagePart = {
      inlineData: {
        data: base64,
        mimeType: mimeType || "image/png"
      }
    };

    const promptText = `
    Analiza de forma extremadamente minuciosa este documento de tránsito (factura, documento de identificación / cédula de ciudadanía, certificado de emisiones de gases / certificado de empadronamiento de marcas como AKT/VOGE, formulario de solicitud de trámites RUNT o poder de trámites especiales de tránsito).
    
    1. Determina la categoría del documento ('cedula', 'factura', 'runt', 'gases', 'poder', 'desconocido').
    2. Extrae de manera estructurada todos los datos del texto. Presta alta atención a datos escritos a mano con bolígrafo (como números de teléfono, correos electrónicos, etc.) que se encuentran a menudo en las esquinas o márgenes de las hojas de las cédulas o poderes.
    3. Asegúrate de retornar estrictamente un objeto JSON que siga el siguiente esquema, sin incluir envoltorios Markdown, texto libre antes o después, código adicional o comillas triples de formato si no es puramente un JSON:
    
    {
      "documentType": "cedula" | "factura" | "runt" | "gases" | "poder" | "desconocido",
      "extractedData": {
         // Si es "cedula":
         "nombreCompleto": (string, nombre en mayúscula o minúscula completo),
         "numeroDocumento": (string, ej: "1.233.498.817"),
         "fechaNacimiento": (string, ej: "1998-07-18"),
         "sexo": (string, "M" o "F"),
         "rh": (string, ej: "O+"),
         "estatura": (string, ej: "1.77 m"),
         "contacto": {
            "celular": (string escrito a mano o impreso, ej: "3102389606"),
            "correo": (string de correo, descifra si está manuscrito, ej: "SalgadoBS98@gmail.com"),
            "direccion": (string de dirección, ej: "Cl 24E # 1-147, Madrid Cundinamarca")
         }
         
         // Si es "factura":
         "numeroFactura": (string de referencia de factura, ej: "RZ2173627"),
         "fecha": (string, ej: "2026-06-06T15:59:24"),
         "compradorNombre": (string, ej: "BRAYAN CAMILO SALGADO JIMENEZ"),
         "compradorIdentificacion": (string, ej: "1233498817"),
         "vehiculoMarca": (string, ej: "ART - VOGE"),
         "vehiculoLinea": (string, ej: "300RALLY"),
         "vehiculoModelo": (string, ej: "2027"),
         "vehiculoMotor": (string, ej: "LC178MN445103Q5"),
         "vehiculoChasis": (string, ej: "9F2A73001VB000332"),
         "vehiculoCilindrada": (string, ej: "292 cc"),
         "vehiculoColor": (string, ej: "GRIS"),
         "valorTotal": (valor de venta final en pesos sin comas, número entero, ej: 17590000)

         // Si es "runt":
         "tramiteSolicitado": (string, ej: "Traspaso de Propiedad"),
         "propietarioNombre": (string, ej: "Brayan Camilo Salgado Jimenez"),
         "propietarioIdentificacion": (string, ej: "1233498817"),
         "vehiculoMarca": (string, ej: "ART-VOGE"),
         "vehiculoLinea": (string, ej: "300Rally"),
         "vehiculoMotor": (string, ej: "LC178MN445103Q5"),
         "vehiculoChasis": (string, ej: "9F2A73001VB000332"),
         "vehiculoModelo": (string, ej: "2027"),
         "vehiculoCilindrada": (string, ej: "292 cc"),
         "vehiculoColor": (string, ej: "Gris")

         // Si es "gases":
         "tipoCertificado": (string, ej: "Certificado de Empadronamiento/Gases"),
         "fechaCertificado": (string de fecha del certificado),
         "vehiculoMarca": (string),
         "vehiculoLinea": (string),
         "vehiculoChasis": (string),
         "vehiculoMotor": (string),
         "vehiculoCilindrada": (string),
         "vehiculoModelo": (string)

         // Si es "poder":
         "otorganteNombre": (string, nombre del firmante que autoriza),
         "otorganteIdentificacion": (string, identificación),
         "apoderadoNombre": (string, la persona o entidad a quien se le cede poder, ej: "TRANSITEMOS"),
         "tramitesAutorizados": (arreglo de strings con los trámites específicos del formulario autorizados, ej: ["Traspaso", "Inscripción en Runt", "Matricula Inicial"])
      },
      "confidence": (un número decimal entre 0 y 1 indicando la claridad y precisión de la lectura),
      "summary": (un resumen corto y pulido en una sola oración del contenido e implicaciones legales o comerciales del documento)
    }
    
    Asegúrate de que el documento responda con estrictamente un objeto JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, { text: promptText }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const resultText = response.text || "{}";
    const parsedResult = JSON.parse(resultText.trim());

    const newRecord: DocumentRecord = {
      id: "doc_" + Date.now(),
      fileName: fileName || "documento_escaneado.png",
      documentType: parsedResult.documentType || "desconocido",
      extractedData: parsedResult.extractedData || {},
      confidence: parsedResult.confidence || 0.85,
      summary: parsedResult.summary || "Documento procesado correctamente.",
      scannedAt: new Date().toISOString(),
      syncStatus: "pending",
      logs: []
    };

    documentsDB.unshift(newRecord);
    return res.status(201).json(newRecord);

  } catch (error: any) {
    console.error("Error procesando imagen con Gemini:", error);
    return res.status(500).json({
      error: "Error en el reconocimiento automático del documento",
      details: error.message || "Error desconocido",
      hint: "Verifique que la API Key de Gemini esté configurada en Settings > Secrets en AI Studio."
    });
  }
});

// 6. Endpoint de Sincronización (Viajar por una API a otro sistema)
app.post("/api/documents/sync/:id", async (req, res) => {
  const { id } = req.params;
  const { targetUrl } = req.body; // URL configurable dada por el usuario

  const doc = documentsDB.find(d => d.id === id);
  if (!doc) {
    return res.status(404).json({ error: "Documento no encontrado." });
  }

  const destinationUrl = targetUrl || "http://localhost:3000/api/external-system-mock";

  // Preparar el cuerpo que viajará por la API según las mejores prácticas full-stack
  // Un payload estándar que consolida la información organizada del trámite
  const apiPayload = {
    eventType: "DOCUMENT_REGISTRATION",
    sourceApp: "Registro de Tránsito Sincronizador",
    payloadId: "pay_" + Date.now(),
    documentId: doc.id,
    documentType: doc.documentType,
    scannedAt: doc.scannedAt,
    syncedAt: new Date().toISOString(),
    extractedData: doc.extractedData,
    confidence: doc.confidence,
    summary: doc.summary
  };

  const syncLog: any = {
    timestamp: new Date().toISOString(),
    url: destinationUrl,
    method: "POST",
    requestPayload: apiPayload,
  };

  try {
    // Usar fetch nativo (disponible en Node 18+) para hacer la llamada real de API
    const response = await fetch(destinationUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "http://localhost:3000"
      },
      body: JSON.stringify(apiPayload)
    });

    const status = response.status;
    let responseBody: any = null;

    try {
      responseBody = await response.json();
    } catch (e) {
      responseBody = await response.text();
    }

    syncLog.responseStatus = status;
    syncLog.responseBody = responseBody;
    syncLog.success = status >= 200 && status < 300;

    // Actualizar base de datos de origen con estado e historial
    doc.syncStatus = syncLog.success ? "success" : "failed";
    doc.syncUrlUsed = destinationUrl;
    doc.logs.unshift(syncLog);

    return res.json({
      success: syncLog.success,
      status,
      responseBody,
      logEntry: syncLog
    });

  } catch (err: any) {
    console.error("Error conectando con la API externa:", err);
    syncLog.responseStatus = 500;
    syncLog.responseBody = { error: "Fallo de conexión de red", details: err.message };
    syncLog.success = false;

    doc.syncStatus = "failed";
    doc.syncUrlUsed = destinationUrl;
    doc.logs.unshift(syncLog);

    return res.status(500).json({
      success: false,
      error: "Ocurrió un error al enviar por API al otro sistema.",
      details: err.message,
      logEntry: syncLog
    });
  }
});


/* ==================== VALIDACIÓN DE CAMPOS POR TIPO DE DOCUMENTO ==================== */

const REQUIRED_FIELDS: Record<string, { field: string; label: string }[]> = {
  cedula: [
    { field: "nombreCompleto",    label: "Nombre completo" },
    { field: "numeroDocumento",   label: "Número de documento" },
    { field: "fechaNacimiento",   label: "Fecha de nacimiento" },
    { field: "sexo",              label: "Sexo" },
  ],
  factura: [
    { field: "numeroFactura",           label: "Número de factura" },
    { field: "fecha",                   label: "Fecha de la factura" },
    { field: "compradorNombre",         label: "Nombre del comprador" },
    { field: "compradorIdentificacion", label: "Identificación del comprador" },
    { field: "vehiculoMarca",           label: "Marca del vehículo" },
    { field: "vehiculoLinea",           label: "Línea del vehículo" },
    { field: "vehiculoModelo",          label: "Modelo del vehículo" },
    { field: "vehiculoMotor",           label: "Número de motor" },
    { field: "vehiculoChasis",          label: "Número de chasis" },
    { field: "valorTotal",              label: "Valor total de venta" },
  ],
  runt: [
    { field: "tramiteSolicitado",          label: "Trámite solicitado" },
    { field: "propietarioNombre",          label: "Nombre del propietario" },
    { field: "propietarioIdentificacion",  label: "Identificación del propietario" },
    { field: "vehiculoMarca",              label: "Marca del vehículo" },
    { field: "vehiculoLinea",              label: "Línea del vehículo" },
    { field: "vehiculoMotor",              label: "Número de motor" },
    { field: "vehiculoChasis",             label: "Número de chasis" },
  ],
  gases: [
    { field: "tipoCertificado",   label: "Tipo de certificado" },
    { field: "fechaCertificado",  label: "Fecha del certificado" },
    { field: "vehiculoMarca",     label: "Marca del vehículo" },
    { field: "vehiculoChasis",    label: "Número de chasis" },
    { field: "vehiculoMotor",     label: "Número de motor" },
    { field: "vehiculoCilindrada", label: "Cilindrada" },
  ],
  poder: [
    { field: "otorganteNombre",          label: "Nombre del otorgante" },
    { field: "otorganteIdentificacion",  label: "Identificación del otorgante" },
    { field: "apoderadoNombre",          label: "Nombre del apoderado" },
    { field: "tramitesAutorizados",      label: "Trámites autorizados" },
  ],
};

function validateDocumentPayload(documentType: string, extractedData: any): { valid: boolean; missingFields: { field: string; label: string }[] } {
  const rules = REQUIRED_FIELDS[documentType];
  if (!rules) {
    return { valid: false, missingFields: [{ field: "documentType", label: `Tipo de documento desconocido: "${documentType}"` }] };
  }

  const missingFields = rules.filter(({ field }) => {
    const value = extractedData[field];
    if (value === undefined || value === null || value === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  });

  return { valid: missingFields.length === 0, missingFields };
}


// 7. Endpoint de validación standalone (útil para Postman / integración externa)
app.post("/api/validate", (req, res) => {
  const { documentType, extractedData } = req.body;

  if (!documentType || !extractedData) {
    return res.status(400).json({
      status: "error",
      message: "Se requieren los campos 'documentType' y 'extractedData'.",
    });
  }

  const { valid, missingFields } = validateDocumentPayload(documentType, extractedData);

  if (!valid) {
    return res.status(422).json({
      status: "validation_error",
      documentType,
      valid: false,
      missingCount: missingFields.length,
      missingFields: missingFields.map(f => ({ field: f.field, label: f.label })),
      message: `Faltan ${missingFields.length} campo(s) obligatorio(s): ${missingFields.map(f => f.label).join(", ")}.`,
    });
  }

  return res.status(200).json({
    status: "ok",
    documentType,
    valid: true,
    message: "El payload es válido. Todos los campos obligatorios están presentes.",
  });
});


// 8. API interna Mock para simular "la base de datos de otra aplicación" que recibe el registro
app.post("/api/external-system-mock", (req, res) => {
  const { documentId, documentType, extractedData } = req.body;

  // Validación básica de estructura
  if (!documentType || !extractedData) {
    return res.status(400).json({
      status: "error",
      message: "Payload inválido. Se requieren 'documentType' y 'extractedData'.",
    });
  }

  // Validación de campos obligatorios según tipo de documento
  const { valid, missingFields } = validateDocumentPayload(documentType, extractedData);
  if (!valid) {
    return res.status(422).json({
      status: "validation_error",
      documentType,
      valid: false,
      missingCount: missingFields.length,
      missingFields: missingFields.map(f => ({ field: f.field, label: f.label })),
      message: `No se puede registrar el documento. Faltan ${missingFields.length} campo(s) obligatorio(s): ${missingFields.map(f => f.label).join(", ")}.`,
    });
  }

  // Mapeo de campos clave para la tabla del sistema destino
  let clientName = "Desconocido";
  let clientDocId = "N/A";
  let vehicleChasis = "N/A";
  let vehicleMotor = "N/A";

  if (documentType === "cedula") {
    clientName = extractedData.nombreCompleto || clientName;
    clientDocId = extractedData.numeroDocumento || clientDocId;
  } else if (documentType === "factura") {
    clientName = extractedData.compradorNombre || clientName;
    clientDocId = extractedData.compradorIdentificacion || clientDocId;
    vehicleChasis = extractedData.vehiculoChasis || vehicleChasis;
    vehicleMotor = extractedData.vehiculoMotor || vehicleMotor;
  } else if (documentType === "runt") {
    clientName = extractedData.propietarioNombre || clientName;
    clientDocId = extractedData.propietarioIdentificacion || clientDocId;
    vehicleChasis = extractedData.vehiculoChasis || vehicleChasis;
    vehicleMotor = extractedData.vehiculoMotor || vehicleMotor;
  } else if (documentType === "gases") {
    vehicleChasis = extractedData.vehiculoChasis || vehicleChasis;
    vehicleMotor = extractedData.vehiculoMotor || vehicleMotor;
  } else if (documentType === "poder") {
    clientName = extractedData.otorganteNombre || clientName;
    clientDocId = extractedData.otorganteIdentificacion || clientDocId;
  }

  const mockRecord: ExternalRecord = {
    id: "ext_" + Math.random().toString(36).slice(2, 11),
    receivedAt: new Date().toISOString(),
    originDocumentId: documentId || "doc_unknown",
    documentType,
    clientName,
    clientDocId,
    vehicleChasis,
    vehicleMotor,
    details: extractedData
  };

  externalSystemDB.unshift(mockRecord);

  return res.status(201).json({
    status: "success",
    recordId: mockRecord.id,
    receivedAt: mockRecord.receivedAt,
    documentType,
    clientName,
    message: "Documento recibido y registrado correctamente en la base de datos del sistema destino.",
  });
});



/* ==================== VITE MIDDLEWARE CONFIGURATION ==================== */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Monta el middleware de desarrollo de Vite
    app.use(vite.middlewares);
  } else {
    // Sirve archivos estáticos compilados en producción
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
