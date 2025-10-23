/**
 * Serviço para buscar eventos do calendário econômico do Forex Factory
 */

interface ForexEvent {
  date: string;
  time: string;
  country: string;
  impact: string;
  title: string;
  forecast?: string;
  previous?: string;
}

let cachedEvents: ForexEvent[] = [];
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function getForexFactoryEvents(): Promise<ForexEvent[]> {
  // Retorna cache se ainda válido
  if (cachedEvents.length > 0 && Date.now() - lastFetch < CACHE_DURATION) {
    console.log(`[Forex Calendar] Returning ${cachedEvents.length} cached events`);
    return cachedEvents;
  }

  try {
    console.log('[Forex Calendar] Fetching from https://nfs.faireconomy.media/ff_calendar_thisweek.xml');
    const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.xml');
    
    if (!response.ok) {
      console.error('[Forex Calendar] Failed to fetch:', response.statusText);
      return cachedEvents; // Retorna cache antigo se falhar
    }

    const xmlText = await response.text();
    const events = parseForexFactoryXML(xmlText);
    
    cachedEvents = events.slice(0, 200); // Limita a 200 eventos
    lastFetch = Date.now();
    
    console.log(`[Forex Calendar] Successfully fetched ${events.length} events, cached ${cachedEvents.length}`);
    return cachedEvents;
  } catch (error) {
    console.error('[Forex Calendar] Error fetching events:', error);
    return cachedEvents; // Retorna cache antigo se houver erro
  }
}

function extractCDATA(text: string): string {
  const cdataMatch = text.match(/<!\[CDATA\[(.*?)\]\]>/);
  return cdataMatch ? cdataMatch[1].trim() : text.trim();
}

function parseForexFactoryXML(xml: string): ForexEvent[] {
  const events: ForexEvent[] = [];
  
  try {
    // Extrai todos os eventos usando regex
    const eventMatches = Array.from(xml.matchAll(/<event>([\s\S]*?)<\/event>/g));
    
    for (const match of eventMatches) {
      const eventXml = match[1];
      
      // Extrai cada campo
      const titleMatch = eventXml.match(/<title>([\s\S]*?)<\/title>/);
      const countryMatch = eventXml.match(/<country>([\s\S]*?)<\/country>/);
      const dateMatch = eventXml.match(/<date>([\s\S]*?)<\/date>/);
      const timeMatch = eventXml.match(/<time>([\s\S]*?)<\/time>/);
      const impactMatch = eventXml.match(/<impact>([\s\S]*?)<\/impact>/);
      const forecastMatch = eventXml.match(/<forecast>([\s\S]*?)<\/forecast>/);
      const previousMatch = eventXml.match(/<previous>([\s\S]*?)<\/previous>/);
      
      if (titleMatch && countryMatch && dateMatch && impactMatch) {
        const title = extractCDATA(titleMatch[1]);
        const country = extractCDATA(countryMatch[1]);
        const date = extractCDATA(dateMatch[1]);
        const time = timeMatch ? extractCDATA(timeMatch[1]) : '';
        const impact = extractCDATA(impactMatch[1]);
        const forecast = forecastMatch ? extractCDATA(forecastMatch[1]) : undefined;
        const previous = previousMatch ? extractCDATA(previousMatch[1]) : undefined;
        
        // Converte data de MM-DD-YYYY para ISO
        const [month, day, year] = date.split('-');
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        events.push({
          title,
          country,
          date: isoDate,
          time,
          impact,
          forecast: forecast || undefined,
          previous: previous || undefined,
        });
      }
    }
    
    console.log(`[Forex Calendar] Parsed ${events.length} events from XML`);
    return events;
  } catch (error) {
    console.error('[Forex Calendar] Error parsing XML:', error);
    return [];
  }
}

