const CHATGPT_API_URL = "https://api.openai.com/v1/chat/completions"; // Verifiqué que la URL sea correcta.
const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY; // Asegúrate de configurar esta variable de entorno.

/**
 * Envía un conjunto de transcripciones a la API de ChatGPT para generar un resumen.
 * @param {string[]} transcriptions - Las transcripciones de los audios.
 * @returns {Promise<string>} - El resumen generado por ChatGPT.
 */
export async function generateSummary(
	transcriptions: string[]
): Promise<string> {
	if (!API_KEY) {
		throw new Error("La clave de API de OpenAI no está configurada.");
	}

	const messages = [
		{
			role: "system",
			content:
				"Eres un asistente que crea resúmenes claros y concisos de reuniones de tutoría basados en transcripciones de audio.",
		},
		{
			role: "user",
			content: `Por favor, crea un resumen de la siguiente sesión de tutoría:\n${transcriptions.join(
				"\n\n"
			)}`,
		},
	];

	try {
		const response = await fetch(CHATGPT_API_URL, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gpt-4", // Asegúrate de que tu cuenta tenga acceso a este modelo.
				messages,
			}),
		});

		if (!response.ok) {
			throw new Error(
				`Error en la generación del resumen: ${response.statusText}`
			);
		}

		const data = await response.json();
		return data.choices[0].message.content;
	} catch (error) {
		console.error("Error al generar el resumen:", error);
		throw new Error("No se pudo generar el resumen.");
	}
}
