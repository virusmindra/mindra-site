export type Lang = "en" | "es";

export function detectLangFromText(text: string): Lang {
  const t = (text || "").toLowerCase();

  // 🇪🇸 Spanish markers
  if (
    /[áéíóúñü]/i.test(t) ||
    /\b(quiero|necesito|recordatorio|recuérdame|mañana|hoy|por favor|hacer|salir|caminar|beber)\b/i.test(t)
  ) {
    return "es";
  }

  // 🇺🇸 Default → English
  return "en";
}
