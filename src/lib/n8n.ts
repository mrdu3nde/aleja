export async function sendToN8N(webhookUrl: string, data: unknown) {
  if (!webhookUrl) {
    console.warn("N8N webhook URL not configured, skipping.");
    return { success: true, skipped: true };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`N8N webhook failed: ${response.status}`);
  }

  return { success: true };
}
