"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  MessageSquare,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { mockAlumnosCards } from "@/data/entrevistas-data";
import type { AlumnoCard } from "@/types/entrevistas";
import { AudioRecorder } from "./audio-recorder";

export function EntrevistaDashboard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [recordingType, setRecordingType] = useState<
    "entrevista" | "observacion"
  >("entrevista");
  const [selectedAlumno, setSelectedAlumno] = useState<AlumnoCard | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const alumnos = mockAlumnosCards;
  const currentAlumno = alumnos[currentIndex];

  // Navegación por gestos
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;

    const diffX = startX.current - currentX.current;
    const threshold = 50;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && currentIndex < alumnos.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (diffX < 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    }

    isDragging.current = false;
    setShowDetails(false);
  };

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
        setShowDetails(false);
      } else if (e.key === "ArrowRight" && currentIndex < alumnos.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setShowDetails(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, alumnos.length]);

  const handleActionClick = (type: "entrevista" | "observacion") => {
    setRecordingType(type);
    setSelectedAlumno(currentAlumno);
    setShowRecorder(true);
  };

  const handleRecorderClose = () => {
    setShowRecorder(false);
    setSelectedAlumno(null);
  };

  if (showRecorder && selectedAlumno) {
    return (
      <AudioRecorder
        alumno={selectedAlumno}
        tipo={recordingType}
        onClose={handleRecorderClose}
        onSave={() => {
          handleRecorderClose();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-bold text-lg text-gray-900">
              Entrevistas y Observaciones
            </h1>
            <p className="text-sm text-gray-600">
              {currentIndex + 1} de {alumnos.length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Card Container */}
      <div
        ref={containerRef}
        className="pt-20 pb-4 px-4 h-screen flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Student Card */}
        <Card className="flex-1 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0">
            <Avatar className="w-full h-full rounded-lg">
              <AvatarImage
                src={currentAlumno.avatar || "/placeholder.svg"}
                alt={currentAlumno.nombre}
                className="object-cover"
              />
              <AvatarFallback className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 text-white text-6xl">
                {currentAlumno.nombre[0]}
                {currentAlumno.apellidos[0]}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Student Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="font-bold text-3xl mb-2">
              {currentAlumno.nombre} {currentAlumno.apellidos}
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30"
              >
                <span>{currentAlumno.edad} años</span>
              </Badge>
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30"
              >
                <span>{currentAlumno.grupo}</span>
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-4">
              <Button
                onClick={() => handleActionClick("entrevista")}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Entrevista
              </Button>
              <Button
                onClick={() => handleActionClick("observacion")}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium"
              >
                <Eye className="h-5 w-5 mr-2" />
                Observación
              </Button>
            </div>

            {/* Show Details Toggle */}
            <Button
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-white hover:bg-white/20"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-5 w-5 mr-2" />
                  Ocultar detalles
                </>
              ) : (
                <>
                  <ChevronDown className="h-5 w-5 mr-2" />
                  Ver detalles
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Details Panel */}
        {showDetails && (
          <Card className="mt-4 bg-white shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 text-gray-900">
                Información Reciente
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="font-bold text-2xl text-green-600">
                    {currentAlumno.totalEntrevistas}
                  </div>
                  <div className="text-sm text-gray-600">Entrevistas</div>
                  {currentAlumno.ultimaEntrevista && (
                    <div className="text-xs text-gray-500 mt-1">
                      Última:{" "}
                      {currentAlumno.ultimaEntrevista.toLocaleDateString(
                        "es-ES"
                      )}
                    </div>
                  )}
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="font-bold text-2xl text-blue-600">
                    {currentAlumno.totalObservaciones}
                  </div>
                  <div className="text-sm text-gray-600">Observaciones</div>
                  {currentAlumno.ultimaObservacion && (
                    <div className="text-xs text-gray-500 mt-1">
                      Última:{" "}
                      {currentAlumno.ultimaObservacion.toLocaleDateString(
                        "es-ES"
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Última Entrevista
                  </h4>
                  <p className="text-sm text-gray-600">
                    "El alumno muestra buen progreso en las prácticas, pero
                    necesita mejorar la comunicación con el equipo."
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Última Observación
                  </h4>
                  <p className="text-sm text-gray-600">
                    "Participación activa en clase. Muestra interés por aprender
                    nuevas tecnologías."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {alumnos.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setShowDetails(false);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? "bg-white w-6" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
