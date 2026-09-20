import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

/**
 * Transcripción de las notas de voz con un modelo multimodal.
 *
 * Antes esto leía fotos de papel escritas a mano. Se cambió a voz porque la
 * cámara no funcionó en la práctica, y porque hablar es más rápido que
 * escribir cuando se tienen las manos ocupadas. Es el mismo mecanismo: Gemini
 * acepta el audio por la misma vía `{type:"file"}` que aceptaba la imagen, con
 * la misma cascada de modelos.
 *
 * El audio NO se guarda: se transcribe al vuelo y se descarta. Por eso la
 * transcripción ocurre ANTES de crear la nota — si el modelo falla, el
 * navegador todavía tiene la grabación y ella puede reintentar o escribirla,
 * en vez de quedarse con una nota vacía y el audio perdido.
 */

/**
 * En orden de preferencia. El más nuevo no es el más disponible: en pruebas
 * reales `gemini-3.8-flash` respondía "this model is currently experiencing
 * high demand" y tardaba más de dos minutos en rendirse, lo que en Vercel
 * mataría la función antes de contestar. Se prueba uno, y si está saturado se
 * pasa al siguiente en vez de dejarla esperando.
 */
export const AI_MODELS = [
  // Medido el 2026-09-20 con voz real de 12 s: 12.9 s de ida y vuelta.
  "gemini-3.1-flash-lite",
  // Respaldo: más lento pero funcionó cuando los grandes estaban saturados.
  "gemini-3.5-flash-lite",
  // Último recurso, y el más capaz si algún día baja la demanda.
  "gemini-3.6-flash",
] as const;

const VoiceNoteSchema = z.object({
  /// Lo dicho, palabra por palabra. Vacío si el audio no tiene voz.
  transcripcion: z.string(),
  /// Título corto para poder listar la nota sin abrirla.
  titulo: z.string(),
  /// Qué tan seguro quedó, para avisarle que lo revise.
  confianza: z.enum(["alta", "media", "baja"]),
});

export type VoiceTranscription = z.infer<typeof VoiceNoteSchema> & { model: string };

/**
 * El prompt le prohíbe corregir o completar a propósito: esta nota es un
 * requerimiento de la dueña, y un modelo que "mejora" lo que ella pidió cambia
 * el pedido sin que nadie se entere. Solo se permite arreglar la puntuación,
 * porque nadie dicta comas.
 */
const PROMPT = `Eres un transcriptor de notas de voz en español.

Quien habla es la dueña de un estudio de belleza, y está dictando algo que
quiere que se cambie o se mejore en su plataforma web.

REGLAS ESTRICTAS:
1. Transcribe EXACTAMENTE lo que dice, palabra por palabra, respetando su forma
   de hablar, sus muletillas y su vocabulario.
2. NO corrijas el contenido, NO completes ideas, NO interpretes y NO agregues
   nada que ella no haya dicho. Si pidió algo confuso, transcribe la confusión.
3. Lo único que puedes arreglar es la puntuación y las mayúsculas, porque nadie
   dicta las comas. Si enumera cosas, puedes ponerlas en viñetas.
4. Si una palabra no se entiende, escribe [inaudible]. Si dudas entre dos,
   escribe la más probable seguida de [?]. Nunca inventes un nombre, una cifra
   ni una fecha.
5. Si el audio no tiene voz o está en silencio, devuelve transcripcion vacía.

Además devuelve un título de menos de 6 palabras que resuma lo que pide, y tu
nivel de confianza en lo que oíste.`;

/**
 * Transcribe una nota de voz. Lanza si no hay API key o si todos los modelos
 * fallan, para que quien llame decida qué hacer (aquí: avisarle a ella y
 * conservar la grabación en el navegador).
 */
export async function transcribeVoiceNote(
  audio: Uint8Array,
  mediaType: string,
): Promise<VoiceTranscription> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("no_api_key");
  }

  let lastError: Error = new Error("sin modelos");

  for (const id of AI_MODELS) {
    try {
      const { object } = await generateObject({
        model: google(id),
        schema: VoiceNoteSchema,
        // Sin creatividad: queremos lo más literal posible.
        temperature: 0,
        // Cero reintentos: si está saturado conviene cambiar de modelo, no
        // insistir. Reintentar aquí es lo que hacía que una sola nota tardara
        // siete minutos y muriera en Vercel a los 60 segundos.
        maxRetries: 0,
        messages: [
          {
            role: "user",
            content: [
              // El audio va antes del texto: los modelos siguen mejor la
              // instrucción cuando ya tienen delante lo que deben escuchar.
              { type: "file", data: audio, mediaType },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      });

      return { ...object, model: id };
    } catch (error) {
      lastError = error as Error;
      console.warn(`Transcripción con ${id} falló:`, lastError.message);
    }
  }

  throw lastError;
}

/**
 * Separa un data URL en bytes y tipo. Sirve para el audio que manda el
 * navegador y para la foto de respaldo, que usan el mismo formato.
 */
export function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; mediaType: string } {
  const match = /^data:([a-zA-Z0-9/+.-]+);base64,([\s\S]+)$/.exec(dataUrl);
  if (!match) throw new Error("invalid_data_url");
  return {
    mediaType: match[1],
    bytes: new Uint8Array(Buffer.from(match[2], "base64")),
  };
}
