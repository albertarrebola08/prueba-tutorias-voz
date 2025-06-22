export interface AudioRecording {
  id: string;
  url: string;
  duration: number;
  timestamp: Date;
  transcription?: string;
}

export interface Entrevista {
  id: string;
  alumnoId: string;
  tutorId: string;
  fecha: Date;
  tipo: "entrevista" | "observacion";
  grabaciones: AudioRecording[];
  transcripciones: string[];
  resumen?: string;
  notas?: string;
  estado: "en_progreso" | "completada" | "guardada";
}

export interface AlumnoCard {
  id: string;
  nombre: string;
  apellidos: string;
  edad: number;
  grupo: string;
  avatar?: string;
  ultimaEntrevista?: Date;
  ultimaObservacion?: Date;
  totalEntrevistas: number;
  totalObservaciones: number;
}
