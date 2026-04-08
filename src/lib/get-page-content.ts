import { prisma } from "./prisma";

export async function getPageContent(locale: string): Promise<Record<string, string>> {
  try {
    const rows = await prisma.content.findMany({ where: { locale } });
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    return map;
  } catch {
    return {};
  }
}
