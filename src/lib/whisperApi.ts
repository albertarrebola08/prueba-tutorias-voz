const WHISPER_API_URL = "https://api.openai.com/v1/audio/transcriptions";
const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY; // Asegúrate de configurar esta variable de entorno.

async function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Envía un archivo de audio a la API de Whisper para transcripción.
 * @param {File} audioFile - El archivo de audio a transcribir.
 * @returns {Promise<string>} - El texto transcrito.
 */
export async function transcribeAudio(audioFile: File): Promise<string> {
	if (!API_KEY) {
		throw new Error("La clave de API de OpenAI no está configurada.");
	}

	const formData = new FormData();
	formData.append("file", audioFile);
	formData.append("model", "whisper-1");

	let attempts = 0;
	const maxAttempts = 3;

	while (attempts < maxAttempts) {
		try {
			const response = await fetch(WHISPER_API_URL, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${API_KEY}`,
				},
				body: formData,
			});

			if (response.ok) {
				const data = await response.json();
				return data.text;
			} else if (response.status === 429) {
				attempts++;
				const retryAfter = response.headers.get("Retry-After");
				const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
				console.warn(
					`Demasiadas solicitudes. Reintentando en ${delayMs / 1000} segundos...`
				);
				await delay(delayMs);
			} else {
				throw new Error(`Error en la transcripción: ${response.statusText}`);
			}
		} catch (error) {
			if (attempts >= maxAttempts - 1) {
				console.error("Error al transcribir el audio:", error);
				throw new Error(
					"No se pudo transcribir el audio después de varios intentos."
				);
			}
			attempts++;
			await delay(2000); // Retraso predeterminado entre intentos.
		}
	}

	throw new Error("No se pudo transcribir el audio después de varios intentos.");
}
