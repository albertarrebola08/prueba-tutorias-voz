"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
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

  // Navegación con scroll horizontal
  const handleScroll = () => {
    if (containerRef.current) {
      const scrollLeft = containerRef.current.scrollLeft;
      const cardWidth = containerRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setCurrentIndex(newIndex);
    }
  };

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

      {/* Carrusel horizontal */}
      <div
        ref={containerRef}
        className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
        style={{ scrollBehavior: "smooth" }}
      >
        {alumnos.map((alumno) => (
          <div
            key={alumno.id}
            className="min-w-full h-full snap-center relative flex flex-col"
          >
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
            <div className="relative z-10 flex flex-col h-full">
              {/* Información principal (fija arriba) */}
              <div className="flex-1 flex items-end p-6 pb-4">
                <div className="w-full">
                  <h2 className="font-raleway font-bold text-4xl text-white mb-3">
                    {alumno.nombre}
                  </h2>
                  <h3 className="font-raleway font-semibold text-2xl text-white/90 mb-4">
                    {alumno.apellidos}
                  </h3>
                  <div className="flex items-center gap-3 mb-6">
                    <Badge className="bg-white/20 text-white border-white/30 text-base px-4 py-2">
                      <span className="font-opensans">{alumno.edad} años</span>
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30 text-base px-4 py-2">
                      <span className="font-opensans">{alumno.grupo}</span>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="px-6 pb-6">
                <div className="flex gap-4 mb-6">
                  <Button
                    onClick={() => handleActionClick("entrevista")}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-6 text-xl font-semibold rounded-2xl shadow-lg"
                  >
                    <Plus className="h-6 w-6 mr-3" />
                    <MessageSquare className="h-6 w-6 mr-2" />
                    Entrevista
                  </Button>
                  <Button
                    onClick={() => handleActionClick("observacion")}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-6 text-xl font-semibold rounded-2xl shadow-lg"
                  >
                    <Plus className="h-6 w-6 mr-3" />
                    <Eye className="h-6 w-6 mr-2" />
                    Observación
                  </Button>
                </div>
              </div>

              {/* Información adicional (scrolleable) */}
              <div className="bg-white rounded-t-3xl shadow-2xl overflow-y-auto max-h-96">
                <div className="p-6">
                  {/* Indicador de scroll */}
                  <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

                  <h3 className="font-raleway font-semibold text-2xl mb-6 text-gray-900">
                    Información Reciente
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="text-center p-6 bg-green-50 rounded-2xl">
                      <div className="font-raleway font-bold text-3xl text-green-600 mb-2">
                        {alumno.totalEntrevistas}
                      </div>
                      <div className="font-opensans text-lg text-gray-600 mb-2">
                        Entrevistas
                      </div>
                      {alumno.ultimaEntrevista && (
                        <div className="font-opensans text-sm text-gray-500">
                          Última:{" "}
                          {alumno.ultimaEntrevista.toLocaleDateString("es-ES")}
                        </div>
                      )}
                    </div>

                    <div className="text-center p-6 bg-blue-50 rounded-2xl">
                      <div className="font-raleway font-bold text-3xl text-blue-600 mb-2">
                        {alumno.totalObservaciones}
                      </div>
                      <div className="font-opensans text-lg text-gray-600 mb-2">
                        Observaciones
                      </div>
                      {alumno.ultimaObservacion && (
                        <div className="font-opensans text-sm text-gray-500">
                          Última:{" "}
                          {alumno.ultimaObservacion.toLocaleDateString("es-ES")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-raleway font-semibold text-xl text-gray-900 mb-3">
                        Última Entrevista
                      </h4>
                      <p className="font-opensans text-base text-gray-700 leading-relaxed">
                        &ldquo;El alumno muestra buen progreso en las prácticas,
                        pero necesita mejorar la comunicación con el
                        equipo.&rdquo;
                      </p>
                    </div>

                    <div>
                      <h4 className="font-raleway font-semibold text-xl text-gray-900 mb-3">
                        Última Observación
                      </h4>
                      <p className="font-opensans text-base text-gray-700 leading-relaxed">
                        &ldquo;Participación activa en clase. Muestra interés
                        por aprender nuevas tecnologías.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Indicadores de navegación */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {alumnos.map((_, dotIndex) => (
          <button
            key={dotIndex}
            onClick={() => {
              if (containerRef.current) {
                containerRef.current.scrollLeft =
                  dotIndex * containerRef.current.offsetWidth;
              }
            }}
            className={`w-3 h-3 rounded-full transition-all ${
              dotIndex === currentIndex ? "bg-white w-8" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
