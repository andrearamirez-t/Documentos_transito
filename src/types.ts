/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DocumentType = 'cedula' | 'factura' | 'runt' | 'gases' | 'poder' | 'desconocido';

export interface CedulaData {
  nombreCompleto: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  sexo: 'M' | 'F' | '';
  rh: string;
  estatura: string;
  celular: string;
  correo: string;
  direccion: string;
}

export interface FacturaData {
  numeroFactura: string;
  fecha: string;
  compradorNombre: string;
  compradorIdentificacion: string;
  vehiculoMarca: string;
  vehiculoLinea: string;
  vehiculoModelo: string;
  vehiculoMotor: string;
  vehiculoChasis: string;
  vehiculoCilindrada: string;
  vehiculoColor: string;
  valorTotal: number;
}

export interface RuntData {
  tramiteSolicitado: string;
  propietarioNombre: string;
  propietarioIdentificacion: string;
  vehiculoMarca: string;
  vehiculoLinea: string;
  vehiculoMotor: string;
  vehiculoChasis: string;
  vehiculoModelo: string;
  vehiculoCilindrada: string;
  vehiculoColor: string;
}

export interface GasesData {
  tipoCertificado: string; // e.g. "Certificado de gases" or "Empadronamiento"
  fechaCertificado: string;
  vehiculoMarca: string;
  vehiculoLinea: string;
  vehiculoChasis: string;
  vehiculoMotor: string;
  vehiculoCilindrada: string;
  vehiculoModelo: string;
}

export interface PoderData {
  otorganteNombre: string;
  otorganteIdentificacion: string;
  apoderadoNombre: string;
  tramitesAutorizados: string[];
}

export interface ExtractedPayload {
  documentType: DocumentType;
  extractedData: CedulaData | FacturaData | RuntData | GasesData | PoderData | Record<string, any>;
  confidence: number;
  summary: string;
}

export interface SyncLogEntry {
  timestamp: string;
  url: string;
  method: string;
  requestPayload: any;
  responseStatus: number;
  responseBody: any;
  success: boolean;
}

export interface DocumentRecord {
  id: string;
  tramiteId: string;
  fileName: string;
  documentType: DocumentType;
  extractedData: any;
  confidence: number;
  summary: string;
  scannedAt: string;
  syncStatus: 'pending' | 'success' | 'failed';
  syncUrlUsed?: string;
  logs: SyncLogEntry[];
}

export interface ExternalRecord {
  id: string;
  receivedAt: string;
  originDocumentId: string;
  documentType: DocumentType;
  clientName: string;
  clientDocId: string;
  vehicleChasis: string;
  vehicleMotor: string;
  details: any;
}
