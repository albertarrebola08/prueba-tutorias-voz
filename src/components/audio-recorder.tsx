"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { transcribeAudio } from "@/lib/whisperApi";
import { generateSummary } from "@/lib/chatgptApi";
import type { AlumnoCard, AudioRecording } from "@/types/entrevistas";

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
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Actualizar tiempo cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const startRecording = async () => {
    if (!audioEnabled) return;

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

        // Transcribir audio
        let transcription = "Transcripción automática pendiente...";
        try {
          const audioFile = new File([audioBlob], "audio.wav", {
            type: "audio/wav",
          });
          transcription = await transcribeAudio(audioFile);
        } catch {
          transcription = "Error en la transcripción";
        }

        const newRecording: AudioRecording = {
          id: Date.now().toString(),
          url: audioUrl,
          duration: 0,
          timestamp: new Date(),
          transcription: transcription,
        };

        setRecordings((prev) => [...prev, newRecording]);
        setTranscriptions((prev) => [...prev, transcription]);

        // Detener el stream
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
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    setTranscriptions((prev) => {
      const index = recordings.findIndex((r) => r.id === id);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);

    try {
      const allTranscriptions = transcriptions.join("\n");
      const generatedSummary = await generateSummary([allTranscriptions]);
      setSummary(generatedSummary);
    } catch {
      setSummary("Error al generar el resumen. Por favor, inténtalo de nuevo.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSave = () => {
    // Aquí se guardaría en la base de datos
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
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={onClose} className="text-gray-600">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="font-opensans">Volver</span>
          </Button>
          <div className="text-center">
            <h1 className="font-raleway font-semibold text-lg text-gray-900">
              Sesión de {tipo === "entrevista" ? "Entrevista" : "Observación"}
            </h1>
            <p className="font-opensans text-sm text-gray-600">
              {currentTime.toLocaleString("es-ES")}
            </p>
          </div>
          <div className="w-20" />
        </div>

        {/* Student Info */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={alumno.avatar || "/placeholder.svg"}
              alt={alumno.nombre}
            />
            <AvatarFallback className="bg-blue-500 text-white font-opensans">
              {alumno.nombre[0]}
              {alumno.apellidos[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-raleway font-medium text-gray-900">
              {alumno.nombre} {alumno.apellidos}
            </h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="font-opensans text-xs">
                {alumno.grupo}
              </Badge>
              <Badge
                variant="outline"
                className={`font-opensans text-xs ${
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

        {/* Audio Toggle */}
        <div className="flex items-center gap-3">
          <span className="font-opensans text-sm text-gray-700">
            ¿Habilitar audio?
          </span>
          <Switch checked={audioEnabled} onCheckedChange={setAudioEnabled} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Recording Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-center">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  disabled={!audioEnabled}
                  className="bg-green-500 hover:bg-green-600 text-white w-16 h-16 rounded-full"
                >
                  <Mic className="h-8 w-8" />
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Button
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600 text-white w-16 h-16 rounded-full"
                  >
                    <MicOff className="h-8 w-8" />
                  </Button>

                  {/* Recording Indicator */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="font-opensans text-sm text-gray-600">
                      Grabando...
                    </span>
                  </div>

                  {/* Audio Visualization */}
                  <div className="flex gap-1 items-end h-8">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-green-500 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 100 + 20}%`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recordings List */}
        {recordings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-raleway text-lg">
                Grabaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Button variant="ghost" size="sm">
                    <Play className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <p className="font-opensans text-sm font-medium">
                      {recording.timestamp.toLocaleTimeString("es-ES")}
                    </p>
                    <p className="font-opensans text-xs text-gray-600">
                      {recording.transcription}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRecording(recording.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Transcriptions */}
        {transcriptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-raleway text-lg">
                Transcripciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transcriptions.map((transcription, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-opensans font-medium text-sm">
                        {index + 1}.
                      </span>
                    </div>
                    <p className="font-opensans text-sm text-gray-700">
                      {transcription}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate Summary */}
        {recordings.length > 0 && !summary && (
          <Card>
            <CardContent className="p-4 text-center">
              <Button
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
                className="bg-blue-500 hover:bg-blue-600 text-white font-opensans"
              >
                {isGeneratingSummary ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando resumen...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generar Resumen
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="font-raleway text-lg">
                Resumen de la sesión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="min-h-32 font-opensans"
                placeholder="Resumen de la sesión..."
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Save Button */}
      {(recordings.length > 0 || summary) && (
        <div className="p-4 bg-white border-t">
          <Button
            onClick={handleSave}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-opensans font-medium"
          >
            <Save className="h-5 w-5 mr-2" />
            Guardar Sesión
          </Button>
        </div>
      )}
    </div>
  );
}
