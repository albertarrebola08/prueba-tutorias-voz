"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Plus,
  MessageSquare,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { mockAlumnosCards } from "@/data/entrevistas-data";
import type { AlumnoCard } from "@/types/entrevistas";
import { AudioRecorder } from "./audio-recorder";

interface EntrevistaDashboardProps {
  onBack: () => void;
  userEmail: string;
}

export function EntrevistaDashboard({ onBack }: EntrevistaDashboardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRecorder, setShowRecorder] = useState(false);
  const [recordingType, setRecordingType] = useState<
    "entrevista" | "observacion"
  >("entrevista");
  const [selectedAlumno, setSelectedAlumno] = useState<AlumnoCard | null>(null);
  const [scrollY, setScrollY] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const currentX = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const isVerticalScroll = useRef<boolean>(false);

  const alumnos = mockAlumnosCards;
  const currentAlumno = alumnos[currentIndex];

  // Manejar gestos táctiles mejorados
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    isVerticalScroll.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;

    currentX.current = e.touches[0].clientX;
    currentY.current = e.touches[0].clientY;

    const diffX = Math.abs(startX.current - currentX.current);
    const diffY = Math.abs(startY.current - currentY.current);

    // Determinar si es scroll vertical u horizontal
    if (diffY > diffX && diffY > 10) {
      isVerticalScroll.current = true;
      const newScrollY = Math.max(
        0,
        Math.min(300, startY.current - currentY.current)
      );
      setScrollY(newScrollY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;

    if (!isVerticalScroll.current) {
      const diffX = startX.current - currentX.current;
      const threshold = 50;

      if (Math.abs(diffX) > threshold) {
        if (diffX > 0 && currentIndex < alumnos.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setScrollY(0);
        } else if (diffX < 0 && currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
          setScrollY(0);
        }
      }
    }

    isDragging.current = false;
    isVerticalScroll.current = false;
  };

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
        setScrollY(0);
      } else if (e.key === "ArrowRight" && currentIndex < alumnos.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setScrollY(0);
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

  const nextStudent = () => {
    if (currentIndex < alumnos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setScrollY(0);
    }
  };

  const prevStudent = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setScrollY(0);
    }
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
      {/* Header fijo */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-white/90 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-gray-700 hover:text-gray-900 p-2"
          >
            <ArrowLeft className="h-6 w-6 mr-2" />
            <span className="font-opensans text-lg">Volver</span>
          </Button>

          <div className="text-center">
            <h1 className="font-raleway font-semibold text-xl text-gray-900">
              Entrevistas y Observaciones
            </h1>
            <p className="font-opensans text-base text-gray-600">
              {currentIndex + 1} de {alumnos.length}
            </p>
          </div>

          <div className="w-20" />
        </div>
      </div>

      {/* Navegación lateral */}
      {currentIndex > 0 && (
        <Button
          onClick={prevStudent}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/80 hover:bg-white shadow-lg"
          variant="ghost"
        >
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </Button>
      )}

      {currentIndex < alumnos.length - 1 && (
        <Button
          onClick={nextStudent}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/80 hover:bg-white shadow-lg"
          variant="ghost"
        >
          <ChevronRight className="h-6 w-6 text-gray-700" />
        </Button>
      )}

      {/* Contenedor principal */}
      <div
        ref={containerRef}
        className="pt-20 h-screen flex flex-col relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(-${scrollY}px)`,
          transition: isDragging.current ? "none" : "transform 0.3s ease-out",
        }}
      >
        {/* Card principal del alumno */}
        <div className="flex-1 relative overflow-hidden mx-4 mb-4 rounded-2xl shadow-2xl">
          <div className="absolute inset-0">
            <Avatar className="w-full h-full rounded-2xl">
              <AvatarImage
                src={currentAlumno.avatar || "/placeholder.svg"}
                alt={currentAlumno.nombre}
                className="object-cover w-full h-full"
              />
              <AvatarFallback className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 text-white text-8xl font-raleway rounded-2xl">
                {currentAlumno.nombre[0]}
                {currentAlumno.apellidos[0]}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Overlay con gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-2xl" />

          {/* Información del alumno */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="font-raleway font-bold text-4xl mb-3">
              {currentAlumno.nombre} {currentAlumno.apellidos}
            </h2>

            <div className="flex items-center gap-3 mb-6">
              <Badge
                variant="secondary"
                className="bg-white/25 text-white border-white/30 text-base px-4 py-2"
              >
                <span className="font-opensans font-medium">
                  {currentAlumno.edad} años
                </span>
              </Badge>
              <Badge
                variant="secondary"
                className="bg-white/25 text-white border-white/30 text-base px-4 py-2"
              >
                <span className="font-opensans font-medium">
                  {currentAlumno.grupo}
                </span>
              </Badge>
            </div>

            {/* Botones de acción más grandes */}
            <div className="flex gap-4 mb-6">
              <Button
                onClick={() => handleActionClick("entrevista")}
                className="flex-1 h-16 bg-green-500 hover:bg-green-600 text-white font-opensans font-semibold text-lg rounded-xl shadow-lg"
              >
                <Plus className="h-6 w-6 mr-3" />
                <MessageSquare className="h-6 w-6 mr-2" />
                Entrevista
              </Button>
              <Button
                onClick={() => handleActionClick("observacion")}
                className="flex-1 h-16 bg-blue-500 hover:bg-blue-600 text-white font-opensans font-semibold text-lg rounded-xl shadow-lg"
              >
                <Plus className="h-6 w-6 mr-3" />
                <Eye className="h-6 w-6 mr-2" />
                Observación
              </Button>
            </div>

            {/* Indicador de scroll */}
            <div className="text-center text-white/70 font-opensans text-base">
              ↓ Desliza hacia abajo para ver más información
            </div>
          </div>
        </div>

        {/* Panel de información (aparece con scroll) */}
        <Card
          className="mx-4 mb-4 bg-white shadow-xl rounded-2xl"
          style={{
            opacity: Math.min(1, scrollY / 100),
            transform: `translateY(${Math.max(0, 50 - scrollY)}px)`,
          }}
        >
          <CardContent className="p-6">
            <h3 className="font-raleway font-semibold text-2xl mb-6 text-gray-900">
              Información Reciente
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <div className="font-raleway font-bold text-4xl text-green-600 mb-2">
                  {currentAlumno.totalEntrevistas}
                </div>
                <div className="font-opensans text-lg text-gray-700 mb-2">
                  Entrevistas
                </div>
                {currentAlumno.ultimaEntrevista && (
                  <div className="font-opensans text-sm text-gray-500">
                    Última:{" "}
                    {currentAlumno.ultimaEntrevista.toLocaleDateString("es-ES")}
                  </div>
                )}
              </div>

              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <div className="font-raleway font-bold text-4xl text-blue-600 mb-2">
                  {currentAlumno.totalObservaciones}
                </div>
                <div className="font-opensans text-lg text-gray-700 mb-2">
                  Observaciones
                </div>
                {currentAlumno.ultimaObservacion && (
                  <div className="font-opensans text-sm text-gray-500">
                    Última:{" "}
                    {currentAlumno.ultimaObservacion.toLocaleDateString(
                      "es-ES"
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="font-raleway font-semibold text-lg text-gray-900 mb-3">
                  Última Entrevista
                </h4>
                <p className="font-opensans text-base text-gray-700 leading-relaxed">
                  {'"'}El alumno muestra buen progreso en las prácticas, pero
                  necesita mejorar la comunicación con el equipo.{'"'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="font-raleway font-semibold text-lg text-gray-900 mb-3">
                  Última Observación
                </h4>
                <p className="font-opensans text-base text-gray-700 leading-relaxed">
                  {'"'}Participación activa en clase. Muestra interés por
                  aprender nuevas tecnologías.{'"'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores de navegación */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {alumnos.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setScrollY(0);
            }}
            className={`h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-white w-8" : "bg-white/50 w-3"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default EntrevistaDashboard;
