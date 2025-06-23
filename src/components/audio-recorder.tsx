"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Play,
  Trash2,
  FileText,
  Save,
  Loader2,
} from "lucide-react";
import type { AlumnoCard, AudioRecording } from "@/types/entrevistas";
import { transcribeAudio } from "@/lib/whisperApi";
import { generateSummary } from "@/lib/chatgptApi";

interface AudioRecorderProps {
  alumno: AlumnoCard;
  tipo: "entrevista" | "observacion";
  onClose: () => void;
  onSave: () => void;
}

export function AudioRecorder({
  alumno,
  tipo,
  onClose,
  onSave,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Transcribir automáticamente
        const audioFile = new File([audioBlob], "audio.wav", {
          type: "audio/wav",
        });
        let transcription = "Transcribiendo...";

        try {
          transcription = await transcribeAudio(audioFile);
        } catch {
          transcription = "Error en la transcripción";
        }

        const newRecording: AudioRecording = {
          id: Date.now().toString(),
          url: audioUrl,
          duration: 0,
          timestamp: new Date(),
          transcription,
        };

        setRecordings((prev) => [...prev, newRecording]);
        setTranscriptions((prev) => [...prev, transcription]);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      console.error("Error accessing microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteRecording = (id: string) => {
    const recordingIndex = recordings.findIndex((r) => r.id === id);
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    setTranscriptions((prev) => prev.filter((_, i) => i !== recordingIndex));
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const summaryText = await generateSummary(transcriptions);
      setSummary(summaryText);
    } catch {
      setSummary("Error al generar el resumen");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSave = () => {
    console.log("Guardando:", {
      alumno: alumno.id,
      tipo,
      recordings,
      transcriptions,
      summary,
      fecha: new Date(),
    });
    onSave();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header mejorado */}
      <div className="bg-white shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-600 p-2"
          >
            <ArrowLeft className="h-6 w-6 mr-2" />
            <span className="font-opensans text-lg">Volver</span>
          </Button>
          <div className="text-center">
            <h1 className="font-raleway font-semibold text-2xl text-gray-900">
              {tipo === "entrevista" ? "Entrevista" : "Observación"}
            </h1>
            <p className="font-opensans text-base text-gray-600">
              {currentTime.toLocaleString("es-ES")}
            </p>
          </div>
          <div className="w-20" />
        </div>

        {/* Info del estudiante mejorada */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={alumno.avatar || "/placeholder.svg"}
              alt={alumno.nombre}
            />
            <AvatarFallback className="bg-blue-500 text-white font-opensans text-xl">
              {alumno.nombre[0]}
              {alumno.apellidos[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-raleway font-semibold text-xl text-gray-900">
              {alumno.nombre} {alumno.apellidos}
            </h2>
            <div className="flex gap-3 mt-2">
              <Badge
                variant="outline"
                className="font-opensans text-sm px-3 py-1"
              >
                {alumno.grupo}
              </Badge>
              <Badge
                variant="outline"
                className={`font-opensans text-sm px-3 py-1 ${
                  tipo === "entrevista"
                    ? "border-green-500 text-green-600"
                    : "border-blue-500 text-blue-600"
                }`}
              >
                {tipo === "entrevista" ? "Entrevista" : "Observación"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Controles de grabación optimizados */}
        {recordings.length === 0 ? (
          // Primera grabación - Botón grande
          <Card className="p-8">
            <CardContent className="text-center">
              <h3 className="font-raleway font-semibold text-xl mb-6 text-gray-900">
                Iniciar {tipo === "entrevista" ? "Entrevista" : "Observación"}
              </h3>
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="bg-green-500 hover:bg-green-600 text-white w-24 h-24 rounded-full shadow-lg"
                >
                  <Mic className="h-12 w-12" />
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <Button
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600 text-white w-24 h-24 rounded-full shadow-lg"
                  >
                    <MicOff className="h-12 w-12" />
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                    <span className="font-opensans text-lg text-gray-600">
                      Grabando...
                    </span>
                  </div>
                  {/* Visualización de audio */}
                  <div className="flex gap-1 items-end h-12">
                    {Array.from({ length: 15 }, (_, i) => (
                      <div
                        key={i}
                        className="w-2 bg-green-500 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 100 + 20}%`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          // Botones compactos cuando ya hay grabaciones
          <div className="flex gap-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex-1 py-4 text-lg font-semibold ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              } text-white rounded-xl`}
            >
              {isRecording ? (
                <MicOff className="h-6 w-6 mr-2" />
              ) : (
                <Mic className="h-6 w-6 mr-2" />
              )}
              {isRecording ? "Detener" : "Grabar"}
            </Button>

            {!isGeneratingSummary && !summary && (
              <Button
                onClick={handleGenerateSummary}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-4 text-lg font-semibold rounded-xl"
              >
                <FileText className="h-6 w-6 mr-2" />
                Resumen
              </Button>
            )}

            {summary && (
              <Button
                onClick={handleSave}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-4 text-lg font-semibold rounded-xl"
              >
                <Save className="h-6 w-6 mr-2" />
                Guardar
              </Button>
            )}
          </div>
        )}

        {/* Lista de grabaciones */}
        {recordings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-raleway text-xl">
                Grabaciones ({recordings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
                >
                  <Button variant="ghost" size="sm" className="mt-1">
                    <Play className="h-5 w-5 text-green-600" />
                  </Button>
                  <div className="flex-1">
                    <p className="font-opensans font-medium text-lg mb-2">
                      {recording.timestamp.toLocaleTimeString("es-ES")}
                    </p>
                    <p className="font-opensans text-base text-gray-700 leading-relaxed">
                      {recording.transcription}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRecording(recording.id)}
                    className="text-red-500 hover:text-red-700 mt-1"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Generando resumen */}
        {isGeneratingSummary && (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="font-opensans text-lg text-gray-600">
                Generando resumen...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Resumen */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="font-raleway text-xl">
                Resumen de la sesión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="min-h-40 text-base font-opensans leading-relaxed"
                placeholder="Resumen de la sesión..."
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
