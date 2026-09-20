/**
 * Normaliza la grabación del navegador a WAV mono de 16 kHz.
 *
 * Cada navegador graba en un formato distinto: Chrome da `audio/webm;opus`,
 * Safari da `audio/mp4`, Firefox da `audio/ogg`. En vez de apostar a que el
 * modelo acepte los tres, aquí se decodifica y se vuelve a codificar a WAV,
 * que es el formato que sí se verificó contra Gemini. Así el resultado no
 * depende del teléfono que ella tenga en la mano.
 *
 * 16 kHz mono es lo que usan los modelos de voz: bajarlo de 48 kHz estéreo
 * recorta el peso a la sexta parte sin perder nada de inteligibilidad.
 */

const TARGET_RATE = 16000;

export async function toMonoWav(input: Blob): Promise<Blob> {
  const bytes = await input.arrayBuffer();

  // Un AudioContext normal solo para decodificar; se cierra enseguida porque
  // en iOS cada contexto abierto cuenta contra un límite pequeño.
  const decoder = new AudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await decoder.decodeAudioData(bytes);
  } finally {
    decoder.close();
  }

  // El remuestreo lo hace el propio navegador: pedirle un contexto a 16 kHz y
  // dejar que él convierta es más fiel que interpolar a mano.
  const frames = Math.ceil(decoded.duration * TARGET_RATE);
  const offline = new OfflineAudioContext(1, frames, TARGET_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();

  return encodeWav(rendered.getChannelData(0), TARGET_RATE);
}

/** WAV PCM de 16 bits: la cabecera de 44 bytes y las muestras detrás. */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true); // tamaño del bloque fmt
  view.setUint16(20, 1, true); // PCM sin comprimir
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // bytes por segundo
  view.setUint16(32, 2, true); // bytes por muestra
  view.setUint16(34, 16, true); // bits por muestra
  writeText(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    // Recortar antes de escalar: una muestra fuera de rango daría la vuelta y
    // sonaría como un chasquido.
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/** Un Blob en data URL, que es como viajan el audio y la foto al servidor. */
export function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("no_se_pudo_leer"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Reduce una foto antes de mandarla. Sin Blob configurado la foto viaja dentro
 * de la fila de la base, así que una foto de 4 MB del celular no cabe.
 */
export async function shrinkImage(file: File, maxSide = 1600, quality = 0.75): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("sin_canvas");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", quality);
}
