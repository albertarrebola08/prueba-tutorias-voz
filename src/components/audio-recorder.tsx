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
  Square,
} from "lucide-react";
import type { AlumnoCard, AudioRecording } from "@/types/entrevistas";
import { transcribeAudio } from "@/lib/whisperApi";
import { generateSummary } from "@/lib/chatgptApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [summary, setSummary] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [errorDialog, setErrorDialog] = useState({
    isOpen: false,
    message: "",
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      const draw = () => {
        analyser.getByteFrequencyData(dataArray);
        const level = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        const levelElement = document.getElementById("audio-level");
        if (levelElement) {
          levelElement.style.width = `${level}%`;
        }
        animationFrameRef.current = requestAnimationFrame(draw);
      };
      draw();

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Transcribir automáticamente
        let transcription = "Transcribiendo...";
        try {
          const audioFile = new File([audioBlob], "audio.webm", {
            type: "audio/webm",
          });
          transcription = await transcribeAudio(audioFile);
        } catch (error) {
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

        audioContext.close();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      let mensaje = "Error al acceder al micrófono: ";
      if (error instanceof Error) {
        if (
          error.name === "NotFoundError" ||
          error.name === "DevicesNotFoundError"
        ) {
          mensaje += "No se encontró ningún micrófono conectado.";
        } else if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          mensaje += "Permiso denegado para acceder al micrófono.";
        } else {
          mensaje += "Ocurrió un error desconocido.";
        }
      }

      setErrorDialog({
        isOpen: true,
        message: mensaje,
      });
      setIsRecording(false);
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
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const transcriptions = recordings
        .map((r) => r.transcription || "")
        .filter(Boolean);
      if (transcriptions.length === 0) {
        setSummary("No hay transcripciones para generar un resumen.");
        return;
      }
      const summaryText = await generateSummary(transcriptions);
      setSummary(summaryText);
    } catch (error) {
      setSummary("Error al generar el resumen. Por favor, inténtalo de nuevo.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handlePlay = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
    setPlayingAudio(audioUrl);
    audio.onended = () => setPlayingAudio(null);
  };

  const handleStop = () => {
    const audios = document.getElementsByTagName("audio");
    for (const audio of audios) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlayingAudio(null);
  };

  const handleSave = () => {
    // Aquí guardarías en la base de datos
    console.log("Guardando:", {
      alumno: alumno.id,
      tipo,
      recordings,
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
            <span>Volver</span>
          </Button>
          <div className="text-center">
            <h1 className="font-semibold text-lg text-gray-900">
              Sesión de {tipo === "entrevista" ? "Entrevista" : "Observación"}
            </h1>
            <p className="text-sm text-gray-600">
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
            <AvatarFallback className="bg-blue-500 text-white">
              {alumno.nombre[0]}
              {alumno.apellidos[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium text-gray-900">
              {alumno.nombre} {alumno.apellidos}
            </h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {alumno.grupo}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${
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
          <span className="text-sm text-gray-700">¿Habilitar audio?</span>
          <Switch checked={audioEnabled} onCheckedChange={setAudioEnabled} />
        </div>
      </div>

      {/* Audio Level Indicator */}
      {isRecording && (
        <div className="bg-white p-4 border-b">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              id="audio-level"
              className="h-full bg-green-500 transition-all duration-100"
              style={{ width: "0%" }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Recordings List */}
        {recordings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grabaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      playingAudio === recording.url
                        ? handleStop()
                        : handlePlay(recording.url)
                    }
                  >
                    {playingAudio === recording.url ? (
                      <Square className="h-4 w-4 text-red-500" />
                    ) : (
                      <Play className="h-4 w-4 text-green-500" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {recording.timestamp.toLocaleTimeString("es-ES")}
                    </p>
                    <Textarea
                      value={recording.transcription || ""}
                      onChange={(e) => {
                        setRecordings((prev) =>
                          prev.map((r) =>
                            r.id === recording.id
                              ? { ...r, transcription: e.target.value }
                              : r
                          )
                        );
                      }}
                      className="text-xs mt-1"
                      rows={2}
                    />
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
        {recordings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transcripciones</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-32"
                value={recordings
                  .map(
                    (r, index) =>
                      `${index + 1}. ${r.transcription || "Sin transcripción"}`
                  )
                  .join("\n")}
                readOnly
              />
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen de la sesión</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="min-h-32"
                placeholder="Resumen de la sesión..."
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex gap-4">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!audioEnabled}
          className={`w-15 h-15 rounded-full p-0 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl ${
            isRecording
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          } ${!audioEnabled && "opacity-50 cursor-not-allowed"}`}
        >
          {isRecording ? (
            <MicOff className="h-10 w-10 text-white" />
          ) : (
            <Mic className="h-10 w-10 text-white" />
          )}
        </Button>

        {recordings.length > 0 && (
          <>
            <Button
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary}
              className="w-15 h-15 rounded-full p-0 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl bg-blue-500 hover:bg-blue-600"
            >
              {isGeneratingSummary ? (
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              ) : (
                <FileText className="h-10 w-10 text-white" />
              )}
            </Button>

            <Button
              onClick={handleSave}
              className="w-15 h-15 rounded-full p-0 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl bg-orange-500 hover:bg-orange-600"
            >
              <Save className="h-10 w-10 text-white" />
            </Button>
          </>
        )}
      </div>

      {/* Error Dialog */}
      <AlertDialog
        open={errorDialog.isOpen}
        onOpenChange={(open) =>
          setErrorDialog((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>
              {errorDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
