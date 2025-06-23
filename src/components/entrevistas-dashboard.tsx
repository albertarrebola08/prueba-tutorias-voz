"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MessageSquare, Eye, Plus } from "lucide-react";
import { mockAlumnosCards } from "@/data/entrevistas-data";
import type { AlumnoCard } from "@/types/entrevistas";
import { AudioRecorder } from "./audio-recorder";

interface EntrevistaDashboardProps {
  onBack: () => void;
  userEmail: string;
}

export default function EntrevistaDashboard({
  onBack,
}: EntrevistaDashboardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRecorder, setShowRecorder] = useState(false);
  const [recordingType, setRecordingType] = useState<
    "entrevista" | "observacion"
  >("entrevista");
  const [selectedAlumno, setSelectedAlumno] = useState<AlumnoCard | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const alumnos = mockAlumnosCards;
  const currentAlumno = alumnos[currentIndex];

  // Navegación con gestos táctiles
  const handleTouchStart = useRef<number>(0);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = handleTouchStart.current - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < alumnos.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    }
  };

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else if (e.key === "ArrowRight" && currentIndex < alumnos.length - 1) {
        setCurrentIndex((prev) => prev + 1);
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
    <div className="h-screen overflow-hidden bg-black">
      {/* Header flotante */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-6 w-6 mr-2" />
            <span className="font-opensans text-lg">Volver</span>
          </Button>
          <div className="text-center">
            <h1 className="font-raleway font-semibold text-xl text-white">
              Entrevistas
            </h1>
            <p className="font-opensans text-sm text-white/80">
              {currentIndex + 1} de {alumnos.length}
            </p>
          </div>
          <div className="w-20" />
        </div>
      </div>

      {/* Carrusel principal */}
      <div
        ref={containerRef}
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={(e) => {
          handleTouchStart.current = e.touches[0].clientX;
        }}
        onTouchEnd={handleTouchEnd}
      >
        {alumnos.map((alumno, index) => (
          <div key={alumno.id} className="min-w-full h-full relative">
            {/* Foto de fondo */}
            <div className="absolute inset-0">
              <Avatar className="w-full h-full rounded-none">
                <AvatarImage
                  src={alumno.avatar || "/placeholder.svg"}
                  alt={alumno.nombre}
                  className="object-cover w-full h-full"
                />
                <AvatarFallback className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 text-white text-8xl font-raleway rounded-none">
                  {alumno.nombre[0]}
                  {alumno.apellidos[0]}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Overlay degradado */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Contenido scrolleable */}
            <div className="absolute inset-0 flex flex-col">
              {/* Espaciador para el header */}
              <div className="h-20" />

              {/* Contenido principal */}
              <div className="flex-1 flex flex-col justify-end">
                {/* Información del alumno */}
                <div className="p-6 text-white">
                  <div className="mb-6">
                    <h2 className="font-raleway font-bold text-4xl mb-3">
                      {alumno.nombre}
                    </h2>
                    <h3 className="font-raleway font-semibold text-2xl mb-4 text-white/90">
                      {alumno.apellidos}
                    </h3>
                    <div className="flex items-center gap-3 mb-6">
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white border-white/30 text-lg px-4 py-2"
                      >
                        <span className="font-opensans">
                          {alumno.edad} años
                        </span>
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white border-white/30 text-lg px-4 py-2"
                      >
                        <span className="font-opensans">{alumno.grupo}</span>
                      </Badge>
                    </div>
                  </div>

                  {/* Botones de acción grandes */}
                  <div className="flex gap-4 mb-6">
                    <Button
                      onClick={() => handleActionClick("entrevista")}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-opensans font-semibold text-lg py-4 rounded-2xl shadow-lg"
                    >
                      <Plus className="h-6 w-6 mr-3" />
                      <MessageSquare className="h-6 w-6 mr-2" />
                      Entrevista
                    </Button>
                    <Button
                      onClick={() => handleActionClick("observacion")}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-opensans font-semibold text-lg py-4 rounded-2xl shadow-lg"
                    >
                      <Plus className="h-6 w-6 mr-3" />
                      <Eye className="h-6 w-6 mr-2" />
                      Observación
                    </Button>
                  </div>

                  {/* Información adicional scrolleable */}
                  <div className="max-h-60 overflow-y-auto">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                      <CardContent className="p-6">
                        <h3 className="font-raleway font-semibold text-xl mb-4 text-white">
                          Información Reciente
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="text-center p-4 bg-green-500/20 rounded-xl border border-green-500/30">
                            <div className="font-raleway font-bold text-3xl text-green-400">
                              {alumno.totalEntrevistas}
                            </div>
                            <div className="font-opensans text-sm text-white/80">
                              Entrevistas
                            </div>
                            {alumno.ultimaEntrevista && (
                              <div className="font-opensans text-xs text-white/60 mt-1">
                                Última:{" "}
                                {alumno.ultimaEntrevista.toLocaleDateString(
                                  "es-ES"
                                )}
                              </div>
                            )}
                          </div>

                          <div className="text-center p-4 bg-blue-500/20 rounded-xl border border-blue-500/30">
                            <div className="font-raleway font-bold text-3xl text-blue-400">
                              {alumno.totalObservaciones}
                            </div>
                            <div className="font-opensans text-sm text-white/80">
                              Observaciones
                            </div>
                            {alumno.ultimaObservacion && (
                              <div className="font-opensans text-xs text-white/60 mt-1">
                                Última:{" "}
                                {alumno.ultimaObservacion.toLocaleDateString(
                                  "es-ES"
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-raleway font-medium text-white mb-2 text-lg">
                              Última Entrevista
                            </h4>
                            <p className="font-opensans text-sm text-white/80 leading-relaxed">
                              &ldquo;El alumno muestra buen progreso en las
                              prácticas, pero necesita mejorar la comunicación
                              con el equipo.&rdquo;
                            </p>
                          </div>

                          <div>
                            <h4 className="font-raleway font-medium text-white mb-2 text-lg">
                              Última Observación
                            </h4>
                            <p className="font-opensans text-sm text-white/80 leading-relaxed">
                              &ldquo;Participación activa en clase. Muestra
                              interés por aprender nuevas tecnologías.&rdquo;
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Indicadores de navegación */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {alumnos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-white w-8" : "bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Instrucciones de uso */}
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-10">
        <div className="text-white/60 text-sm font-opensans">← Desliza →</div>
      </div>
    </div>
  );
}
