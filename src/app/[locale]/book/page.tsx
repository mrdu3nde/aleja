import { BookClient } from "./BookClient";

/** Desde la página de servicios se llega con ?service=<id> ya elegido. */
export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  return <BookClient initialService={typeof service === "string" ? service : undefined} />;
}
