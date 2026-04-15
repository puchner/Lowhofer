/**
 * Leitet die konkreten XML-Abruf-URLs aus einer Liga-Basis-URL ab.
 *
 * Bevorzugter Ablauf:
 * 1. HTML der Basis-URL abrufen und XML-Export-Links darin erkennen
 * 2. Fallback: XML-URLs aus der Saison-ID in der Basis-URL ableiten
 */

export interface DerivedLeagueUrls {
  tableUrl: string;
  fixturesUrl: string;
}

export function validateLeagueBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export async function deriveLeagueUrls(baseUrl: string): Promise<DerivedLeagueUrls> {
  const idMatch = baseUrl.match(/\/saison\/(\d+)/);
  const seasonId = idMatch?.[1];

  // HTML-Parsing bevorzugt – findet die echten XML-Links
  try {
    const response = await fetch(baseUrl, { signal: AbortSignal.timeout(8000) });

    if (response.ok) {
      const html = await response.text();
      const tableMatch = html.match(/href="([^"]*sprung_tabelle[^"]*xml=1[^"]*)"/);
      const fixturesMatch = html.match(/href="([^"]*sprung_spielplan[^"]*xml=1[^"]*)"/);

      if (tableMatch && fixturesMatch) {
        return {
          tableUrl: new URL(tableMatch[1], baseUrl).href,
          fixturesUrl: new URL(fixturesMatch[1], baseUrl).href,
        };
      }
    }
  } catch {
    // Fallthrough zur ID-basierten Ableitung
  }

  if (!seasonId) {
    throw new Error("Keine gültige Liga-Basis-URL: Saison-ID nicht erkennbar und HTML-Parsing fehlgeschlagen.");
  }

  const origin = new URL(baseUrl).origin;

  return {
    tableUrl: `${origin}/sprung_tabelle?i=${seasonId}&xml=1`,
    fixturesUrl: `${origin}/sprung_spielplan?i=${seasonId}&xml=1`,
  };
}
