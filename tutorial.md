# Tutorial: Creación de una Aplicación para Grabar y Resumir Tutorías

Este tutorial te guiará paso a paso para crear una aplicación Next.js que permita grabar audios asociados a tutorías, convertirlos en texto utilizando Whisper y resumirlos con la API de ChatGPT.

## Requisitos Previos

1. Tener instalado Node.js (versión 16 o superior).
2. Familiaridad básica con JavaScript, React y Next.js.
3. Conexión a internet para instalar dependencias.

---

## Paso 1: Crear el Proyecto Next.js

1. Abre una terminal y navega a la carpeta donde deseas crear el proyecto.
2. Ejecuta el siguiente comando para crear una nueva aplicación Next.js:
   ```bash
   npx create-next-app@latest .
   ```
   - Este comando inicializa un nuevo proyecto Next.js en la carpeta actual.
3. Durante la configuración, selecciona las siguientes opciones:
   - **TypeScript**: No (usaremos JavaScript para simplificar).
   - **ESLint**: Sí (para mantener un código limpio y consistente).
   - **Tailwind CSS**: Sí (para estilos rápidos y personalizables).
   - **Directorio `src/`**: Sí (organiza mejor los archivos del proyecto).
   - **App Router**: Sí (estructura recomendada para nuevas aplicaciones).
   - **Turbopack**: Sí (mejora el rendimiento en desarrollo).
   - **Alias de importación**: `@/*` (para rutas más limpias en los imports).

---

## Paso 2: Configurar ShadCN para la Interfaz de Usuario

1. Inicializa ShadCN ejecutando el siguiente comando:
   ```bash
   npx shadcn@latest init
   ```
   - Este comando configura ShadCN en el proyecto y permite usar sus componentes.
2. Durante la configuración, selecciona el color base para los estilos (por ejemplo, `Neutral`).
3. Para agregar componentes, utiliza el comando:
   ```bash
   npx shadcn@latest add <nombre-del-componente>
   ```
   Por ejemplo, para agregar un botón:
   ```bash
   npx shadcn@latest add button
   ```
   - Esto instala y configura el componente `Button` en el proyecto.

---

## Paso 3: Crear la Página de Grabación

1. Abre el archivo `src/app/page.tsx` y crea una interfaz básica para grabar audios.
2. Implementa un botón para iniciar y detener la grabación.
3. Añade un visor de nivel de audio utilizando la Web Audio API para mostrar el nivel de entrada del micrófono en tiempo real.

Código inicial:

```tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function RecordingPage() {
	const [isRecording, setIsRecording] = useState(false);
	const [audioURLs, setAudioURLs] = useState<{ url: string; name: string }[]>(
		[]
	);
	const [shouldRecord, setShouldRecord] = useState(true);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const dataArrayRef = useRef<Uint8Array | null>(null);
	const animationFrameRef = useRef<number | null>(null);

	const startRecording = () => {
		if (!shouldRecord) return;

		navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
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

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
				const audioURL = URL.createObjectURL(audioBlob);

				const now = new Date();
				const timestamp = now
					.toLocaleString("es-ES", {
						year: "numeric",
						month: "2-digit",
						day: "2-digit",
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit",
					})
					.replace(/[:/]/g, "-");

				const saveAudio = window.confirm(
					`¿Quieres guardar este audio con el nombre: ${timestamp}?`
				);
				if (saveAudio) {
					setAudioURLs((prev) => [...prev, { url: audioURL, name: timestamp }]);
				}

				audioContext.close();
				cancelAnimationFrame(animationFrameRef.current);
			};

			mediaRecorder.start();
			setIsRecording(true);
		});
	};

	const stopRecording = () => {
		if (mediaRecorderRef.current) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);
		}
	};

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Grabación de Tutoría</h1>
			<p className="mb-4">Presiona el botón para grabar tu reunión.</p>
			<div className="mb-4 flex items-center">
				<label htmlFor="record-toggle" className="mr-2">
					¿Grabar audio?
				</label>
				<Switch
					id="record-toggle"
					checked={shouldRecord}
					onCheckedChange={(value) => setShouldRecord(value)}
				/>
			</div>
			<Button onClick={isRecording ? stopRecording : startRecording}>
				{isRecording ? "Detener Grabación" : "Iniciar Grabación"}
			</Button>
			<div className="mt-4">
				<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
					<div
						id="audio-level"
						className="h-full bg-green-500"
						style={{ width: "0%" }}
					></div>
				</div>
			</div>
			{audioURLs.length > 0 && (
				<div className="mt-4">
					<h2 className="text-xl font-semibold">Audios Guardados</h2>
					<ul>
						{audioURLs.map((audio, index) => (
							<li key={index} className="mt-2">
								<p className="text-sm">{audio.name}</p>
								<audio controls src={audio.url}></audio>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
```

---

## Paso 4: Añadir un Switch para Activar o Desactivar la Grabación

En este paso, reemplazamos el selector por un switch estilizado de ShadCN para permitir al usuario activar o desactivar la grabación de audio de manera más intuitiva.

---

## Paso 5: Permitir Grabar Múltiples Audios

En este paso, actualizamos la funcionalidad para permitir grabar múltiples audios. Al detener la grabación, se pregunta al usuario si desea guardar el audio. Los audios guardados se muestran en una lista con sus nombres basados en la fecha y hora de la grabación.

### Cambios Realizados

1. **Actualizar el Estado**:

   - Se modificó el estado `audioURLs` para manejar múltiples audios como un array de objetos que contienen la URL y el nombre del audio.

2. **Asignar Nombres a los Audios**:

   - Cada audio grabado recibe un nombre basado en la fecha y hora de la grabación, utilizando el formato `DD-MM-YYYY, HH-MM-SS`.

3. **Confirmación para Guardar**:

   - Al detener la grabación, se muestra un cuadro de confirmación preguntando si el usuario desea guardar el audio.

4. **Mostrar Lista de Audios Guardados**:
   - Los audios guardados se muestran en una lista con su nombre y un reproductor de audio.

---

Con este cambio, la aplicación ahora permite grabar múltiples audios y gestionarlos de manera más eficiente. En el próximo paso, podemos explorar cómo integrar Whisper para convertir los audios en texto.
