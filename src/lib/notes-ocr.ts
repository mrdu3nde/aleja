import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

/**
 * Transcripción de notas manuscritas con un modelo de visión.
 *
 * Gemini Flash en vez de un OCR clásico: Tesseract está hecho para texto
 * impreso y con letra cursiva devuelve basura, mientras que un modelo
 * multimodal usa el contexto de la frase para acertar tildes, la "ñ" y los
 * nombres propios. Además tiene capa gratuita, que es lo que pide este uso
 * (unas pocas fotos al día).
 */
/**
 * En orden de preferencia. El más nuevo no es el más disponible: en pruebas
 * reales `gemini-3.8-flash` respondía "this model is currently experiencing
 * high demand" y tardaba más de dos minutos en rendirse, lo que en Vercel
 * mataría la función antes de contestar. Se prueba uno, y si está saturado se
 * pasa al siguiente en vez de dejarla esperando.
 */
export const OCR_MODELS = [
  // Medido el 2026-09-18 con una foto real: 2.5 s. Los "flash" grandes
  // (3.6, 3.7, 3.8) estaban todos saturados, y los modelos 2.5 ya no se
  // entregan a cuentas nuevas ("no longer available to new users").
  "gemini-3.1-flash-lite",
  // Respaldo: más lento (20 s) pero funcionó cuando los grandes no.
  "gemini-3.5-flash-lite",
  // Último recurso, y el más capaz si algún día baja la demanda.
  "gemini-3.6-flash",
] as const;

const NoteSchema = z.object({
  /// Lo escrito, palabra por palabra. Vacío si la foto no tiene texto.
  transcripcion: z.string(),
  /// Título corto para poder listar la nota sin abrirla.
  titulo: z.string(),
  /// Qué tan segura fue la lectura, para avisarle que la revise.
  confianza: z.enum(["alta", "media", "baja"]),
});

export type NoteTranscription = z.infer<typeof NoteSchema> & { model: string };

/**
 * El prompt le prohíbe corregir o completar a propósito: esta nota es un
 * requerimiento de la dueña, y un modelo que "arregla" lo que ella escribió
 * cambia el pedido sin que nadie se entere.
 */
const PROMPT = `Eres un transcriptor de notas escritas a mano en español.

REGLAS ESTRICTAS:
1. Transcribe EXACTAMENTE lo que está escrito, palabra por palabra, respetando
   los saltos de línea, las viñetas, las abreviaturas, las mayúsculas y hasta
   los errores de ortografía de la persona.
2. NO corrijas, NO completes, NO interpretes y NO agregues nada que no esté en
   la hoja.
3. Si una palabra no se lee, escribe [ilegible]. Si dudas entre dos opciones,
   escribe la más probable seguida de [?]. Nunca inventes un nombre, una cifra
   ni una fecha.
4. Si la foto no tiene texto escrito a mano, devuelve transcripcion vacía.

Además devuelve un título de menos de 6 palabras que resuma la nota, y tu nivel
de confianza en la lectura.`;

/**
 * Transcribe una foto. `image` es la URL pública de Blob o los bytes de la
 * foto cuando llegó como data URL. Lanza si no hay API key o si el modelo
 * falla, para que quien llame decida qué guardar.
 */
export async function transcribeNote(
  image: URL | Uint8Array,
  mediaType: string,
): Promise<NoteTranscription> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("no_api_key");
  }

  let lastError: Error = new Error("sin modelos");

  for (const id of OCR_MODELS) {
    try {
      const { object } = await generateObject({
        model: google(id),
        schema: NoteSchema,
        // Sin creatividad: queremos la lectura más literal posible.
        temperature: 0,
        // Cero reintentos: si está saturado conviene cambiar de modelo, no
        // insistir. Reintentar aquí es lo que hacía que una sola foto tardara
        // siete minutos y muriera en Vercel a los 60 segundos.
        maxRetries: 0,
        messages: [
          {
            role: "user",
            content: [
              // La imagen va antes del texto: los modelos de visión siguen
              // mejor la instrucción cuando ya tienen delante lo que miran.
              { type: "file", data: image, mediaType },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      });

      return { ...object, model: id };
    } catch (error) {
      lastError = error as Error;
      console.warn(`OCR con ${id} falló:`, lastError.message);
    }
  }

  throw lastError;
}

/** Separa el data URL que manda el navegador en bytes y tipo de imagen. */
export function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; mediaType: string } {
  const match = /^data:(image\/[a-zA-Z+]+);base64,([\s\S]+)$/.exec(dataUrl);
  if (!match) throw new Error("invalid_data_url");
  return {
    mediaType: match[1],
    bytes: new Uint8Array(Buffer.from(match[2], "base64")),
  };
}
