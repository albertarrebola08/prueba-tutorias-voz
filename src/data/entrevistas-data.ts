import type { AlumnoCard, Entrevista } from "@/types/entrevistas";

export const mockAlumnosCards: AlumnoCard[] = [
  {
    id: "1",
    nombre: "Marc",
    apellidos: "González Pérez",
    edad: 19,
    grupo: "DAW 2º",
    avatar: "/placeholder.svg?height=400&width=400",
    ultimaEntrevista: new Date("2024-01-15"),
    ultimaObservacion: new Date("2024-01-10"),
    totalEntrevistas: 3,
    totalObservaciones: 5,
  },
  {
    id: "2",
    nombre: "Laura",
    apellidos: "Martín López",
    edad: 18,
    grupo: "DAW 2º",
    avatar: "/placeholder.svg?height=400&width=400",
    ultimaEntrevista: new Date("2024-01-12"),
    ultimaObservacion: new Date("2024-01-08"),
    totalEntrevistas: 2,
    totalObservaciones: 4,
  },
  {
    id: "3",
    nombre: "David",
    apellidos: "Rodríguez García",
    edad: 20,
    grupo: "DAW 2º",
    avatar: "/placeholder.svg?height=400&width=400",
    ultimaEntrevista: new Date("2024-01-14"),
    ultimaObservacion: new Date("2024-01-11"),
    totalEntrevistas: 4,
    totalObservaciones: 3,
  },
  {
    id: "4",
    nombre: "Ana",
    apellidos: "Fernández Ruiz",
    edad: 18,
    grupo: "SMX 2º",
    avatar: "/placeholder.svg?height=400&width=400",
    ultimaEntrevista: new Date("2024-01-13"),
    ultimaObservacion: new Date("2024-01-09"),
    totalEntrevistas: 1,
    totalObservaciones: 6,
  },
];

export const mockEntrevistas: Entrevista[] = [
  {
    id: "1",
    alumnoId: "1",
    tutorId: "tutor1",
    fecha: new Date("2024-01-15"),
    tipo: "entrevista",
    grabaciones: [],
    transcripciones: [
      "El alumno muestra buen progreso en las prácticas",
      "Necesita mejorar la comunicación con el equipo",
    ],
    resumen:
      "Entrevista positiva, el alumno está progresando bien pero necesita trabajar habilidades blandas.",
    estado: "guardada",
  },
];
