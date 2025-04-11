"use client"; // Indica que este archivo es un componente cliente, necesario para usar hooks como useState.

import { useState, useRef } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button"; // Importa el componente Button desde la biblioteca ShadCN.
import { Switch } from "@/components/ui/switch"; // Importa el componente Switch desde la biblioteca ShadCN.
import { transcribeAudio } from "@/lib/whisperApi"; // Importa la función para transcribir audios.
import { generateSummary } from "@/lib/chatgptApi"; // Importa la función para generar resúmenes.
import { Mic, MicOff, FileText, Save } from "lucide-react"; // Añadimos el icono Save
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function RecordingPage() {
	const [isRecording, setIsRecording] = useState(false); // Estado para controlar si se está grabando o no.
	const [audioURLs, setAudioURLs] = useState<
		{ url: string; name: string; transcription: string | null }[]
	>([]); // Definí el tipo como un array de objetos con url, name y transcription.
	const [shouldRecord, setShouldRecord] = useState(true); // Estado para controlar si se debe grabar o no.
	const [sessionSummary, setSessionSummary] = useState<string | null>(null); // Estado para almacenar el resumen de la sesión.
	const [errorDialog, setErrorDialog] = useState({
		isOpen: false,
		message: "",
	}); // Estado para controlar el diálogo de error.
	const mediaRecorderRef = useRef<MediaRecorder | null>(null); // Inicialicé como null y definí el tipo MediaRecorder.
	const audioChunksRef = useRef<Blob[]>([]); // Definí el tipo como un array de Blob.
	const audioContextRef = useRef<AudioContext | null>(null); // Inicialicé como null y definí el tipo AudioContext.
	const analyserRef = useRef<AnalyserNode | null>(null); // Inicialicé como null y definí el tipo AnalyserNode.
	const dataArrayRef = useRef<Uint8Array | null>(null); // Inicialicé como null y definí el tipo Uint8Array.
	const animationFrameRef = useRef<number | null>(null); // Inicialicé como null y definí el tipo number.

	const startRecording = () => {
		if (!shouldRecord) return;

		navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then((stream) => {
				const mediaRecorder = new MediaRecorder(stream); // Inicializa MediaRecorder con el flujo de audio.
				mediaRecorderRef.current = mediaRecorder;
				audioChunksRef.current = []; // Resetea los fragmentos de audio.

				const audioContext = new AudioContext(); // Usé AudioContext directamente.
				const analyser = audioContext.createAnalyser(); // Crea un analizador de audio.
				const source = audioContext.createMediaStreamSource(stream); // Conecta el micrófono al contexto de audio.
				source.connect(analyser); // Conecta el analizador al flujo de audio.

				analyser.fftSize = 256; // Configura el tamaño de la transformada rápida de Fourier.
				const bufferLength = analyser.frequencyBinCount; // Obtiene el tamaño del buffer de frecuencias.
				const dataArray = new Uint8Array(bufferLength); // Crea un array para almacenar los datos de frecuencia.

				audioContextRef.current = audioContext; // Guarda el contexto de audio en la referencia.
				analyserRef.current = analyser; // Guarda el analizador en la referencia.
				dataArrayRef.current = dataArray; // Guarda el array de datos en la referencia.

				const draw = () => {
					analyser.getByteFrequencyData(dataArray); // Obtiene los datos de frecuencia del analizador.
					const level = dataArray.reduce((a, b) => a + b, 0) / bufferLength; // Calcula el nivel promedio de audio.
					const levelElement = document.getElementById("audio-level"); // Obtiene el elemento del visor de nivel de audio.
					if (levelElement) {
						levelElement.style.width = `${level}%`; // Actualiza el ancho del visor según el nivel de audio.
					}
					animationFrameRef.current = requestAnimationFrame(draw); // Solicita la próxima animación.
				};
				draw(); // Inicia la animación.

				mediaRecorder.ondataavailable = (event) => {
					audioChunksRef.current.push(event.data); // Almacena cada fragmento de audio grabado.
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
						const audioData = { url: audioURL, name: timestamp, transcription: null };
						setAudioURLs((prev) => [...prev, audioData]);

						handleTranscription(audioBlob).then((transcription) => {
							setAudioURLs((prev) =>
								prev.map((audio) =>
									audio.url === audioURL ? { ...audio, transcription } : audio
								)
							);
						});
					}

					audioContext.close();
					cancelAnimationFrame(animationFrameRef.current);
				};

				mediaRecorder.start(); // Inicia la grabación.
				setIsRecording(true); // Cambia el estado a "grabando".
			})
			.catch((error) => {
				let mensaje = "Error al acceder al micrófono: ";

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

				setErrorDialog({
					isOpen: true,
					message: mensaje,
				});
				setIsRecording(false);
			});
	};

	const stopRecording = () => {
		if (mediaRecorderRef.current) {
			mediaRecorderRef.current.stop(); // Detiene la grabación.
			setIsRecording(false); // Cambia el estado a "no grabando".
		}
	};

	const handleTranscription = async (audioBlob: Blob) => {
		const audioFile = new File([audioBlob], "audio.webm", { type: "audio/webm" }); // Convierte el Blob en un archivo.
		try {
			const transcription = await transcribeAudio(audioFile); // Llama a la API de Whisper.
			return transcription; // Devuelve la transcripción.
		} catch (error) {
			setErrorDialog({
				isOpen: true,
				message: "Error al transcribir el audio. Por favor, inténtalo de nuevo.",
			});
			return null;
		}
	};

	const handleGenerateSummary = async () => {
		try {
			const transcriptions = await Promise.all(
				audioURLs.map(async (audio) => {
					const response = await fetch(audio.url);
					const audioBlob = await response.blob();
					const audioFile = new File([audioBlob], "audio.webm", {
						type: "audio/webm",
					});
					return await transcribeAudio(audioFile);
				})
			);

			if (transcriptions.length === 0) {
				setSessionSummary(
					"No se proporcionaron transcripciones para generar un resumen."
				);
				return;
			}

			const summary = await generateSummary(transcriptions); // Llama a la API de ChatGPT.
			setSessionSummary(summary); // Almacena el resumen en el estado.
		} catch (error) {
			setSessionSummary(
				"Error al generar el resumen. Por favor, inténtalo de nuevo."
			);
		}
	};

	return (
		<div className="p-3">
			{" "}
			{/* Aumentamos el padding bottom para dejar espacio al botón */}
			<h1 className="text-8xl font-bold mb-4">Sesión de Tutoría</h1>{" "}
			{/* Descripción */}
			<div className="mb-4 flex items-center">
				{" "}
				{/* Contenedor del switch */}
				<label htmlFor="record-toggle" className="mr-2 text-sm ">
					¿Habilitar audio?
				</label>
				<Switch
					id="record-toggle"
					checked={shouldRecord}
					onCheckedChange={(value) => setShouldRecord(value)}
				/>
			</div>
			<div className="mt-4">
				{" "}
				{/* Contenedor del visor de nivel de audio */}
				<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
					{" "}
					{/* Barra de fondo del visor */}
					<div
						id="audio-level"
						className="h-full bg-green-500"
						style={{ width: "0%" }}
					></div>{" "}
					{/* Barra dinámica que muestra el nivel de audio */}
				</div>
			</div>
			{audioURLs.length > 0 && (
				<div className="mt-4">
					<h2 className="text-2xl font-semibold mb-4">Audios Guardados</h2>
					<div className="grid gap-4">
						{audioURLs.map((audio, index) => (
							<Card key={index}>
								<CardHeader>
									<CardTitle className="text-lg">Grabación del {audio.name}</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="bg-slate-50 p-4 rounded-md">
										<audio controls src={audio.url} className="w-full" />
									</div>
									<div className="space-y-2">
										<h4 className="font-medium">Transcripción:</h4>
										<p className="text-sm text-gray-600">
											{audio.transcription || "Transcripción no disponible"}
										</p>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{sessionSummary && (
						<Card className="mt-4">
							<CardHeader>
								<CardTitle>Resumen de la Sesión</CardTitle>
							</CardHeader>
							<CardContent>
								<p>{sessionSummary}</p>
							</CardContent>
						</Card>
					)}
				</div>
			)}
			<AlertDialog
				open={errorDialog.isOpen}
				onOpenChange={(open) =>
					setErrorDialog((prev) => ({ ...prev, isOpen: open }))
				}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Error de Grabación</AlertDialogTitle>
						<AlertDialogDescription>{errorDialog.message}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction>Aceptar</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			{/* Contenedor fijo para los botones */}
			<div className="fixed bottom-4 right-4 flex gap-4">
				<Button
					onClick={isRecording ? stopRecording : startRecording}
					className={`
						w-15 h-15 rounded-full p-0 
						flex items-center justify-center 
						transition-all duration-200
						shadow-lg hover:shadow-xl
						${
							isRecording
								? "bg-red-500 hover:bg-red-600"
								: "bg-green-500 hover:bg-green-600"
						}
						${!shouldRecord && "opacity-50 cursor-not-allowed"}
					`}
					disabled={!shouldRecord}
					variant={isRecording ? "destructive" : "default"}
				>
					{isRecording ? (
						<MicOff className="h-10 w-10 text-white" />
					) : (
						<Mic className="h-10 w-10 text-white" />
					)}
				</Button>

				{audioURLs.length > 0 && (
					<>
						<Button
							onClick={handleGenerateSummary}
							className={`
								w-15 h-15 rounded-full p-0 
								flex items-center justify-center 
								transition-all duration-200
								shadow-lg hover:shadow-xl
								bg-blue-500 hover:bg-blue-600
							`}
						>
							<FileText className="h-10 w-10 text-white" />
						</Button>

						<Button
							onClick={() => {
								/* Aquí va la función para guardar */
							}}
							className={`
								w-15 h-15 rounded-full p-0 
								flex items-center justify-center 
								transition-all duration-200
								shadow-lg hover:shadow-xl
								bg-purple-500 hover:bg-purple-600
							`}
						>
							<Save className="h-10 w-10 text-white" />
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
