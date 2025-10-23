/**
 * Serviço para buscar eventos do calendário econômico do Forex Factory
 */

interface ForexEvent {
  date: string;
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
    return cachedEvents;
  }

  try {
    const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.xml');
    
    if (!response.ok) {
      console.error('[Forex Calendar] Failed to fetch:', response.statusText);
      return cachedEvents; // Retorna cache antigo se falhar
    }

    const xmlText = await response.text();
    const events = parseForexFactoryXML(xmlText);
    
    cachedEvents = events.slice(0, 200); // Limita a 200 eventos
    lastFetch = Date.now();
    
    console.log(`[Forex Calendar] Fetched ${events.length} events`);
    return cachedEvents;
  } catch (error) {
    console.error('[Forex Calendar] Error fetching events:', error);
    return cachedEvents; // Retorna cache antigo se houver erro
  }
}

function parseForexFactoryXML(xml: string): ForexEvent[] {
  const events: ForexEvent[] = [];
  
  try {
    // Parser simples de XML usando regex
    const eventRegex = /<event>([\s\S]*?)<\/event>/g;
    const eventMatches = Array.from(xml.matchAll(eventRegex));
    
    for (const match of eventMatches) {
      const eventXml = match[1];
      
      const title = extractTag(eventXml, 'title');
      const country = extractTag(eventXml, 'country');
      const date = extractTag(eventXml, 'date');
      const time = extractTag(eventXml, 'time');
      const impact = extractTag(eventXml, 'impact');
      const forecast = extractTag(eventXml, 'forecast');
      const previous = extractTag(eventXml, 'previous');
      
      if (title && country && date) {
        // Converte data de MM-DD-YYYY para formato ISO
        const dateParts = date.split('-');
        if (dateParts.length === 3) {
          const month = dateParts[0];
          const day = dateParts[1];
          const year = dateParts[2];
          
          // Converte hora de 12h para 24h
          let hour = '00';
          let minute = '00';
          if (time) {
            const timeMatch = time.match(/(\d{1,2}):(\d{2})(am|pm)/i);
            if (timeMatch) {
              let h = parseInt(timeMatch[1]);
              const m = timeMatch[2];
              const period = timeMatch[3].toLowerCase();
              
              if (period === 'pm' && h !== 12) h += 12;
              if (period === 'am' && h === 12) h = 0;
              
              hour = h.toString().padStart(2, '0');
              minute = m;
            }
          }
          
          const isoDate = `${year}-${month}-${day}T${hour}:${minute}:00`;
          
          events.push({
            date: isoDate,
            country: country,
            impact: impact || 'Low',
            title: title,
            forecast: forecast || undefined,
            previous: previous || undefined,
          });
        }
      }
    }
  } catch (error) {
    console.error('[Forex Calendar] Error parsing XML:', error);
  }
  
  return events;
}

function extractTag(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\/${tagName}>`);
  const match = xml.match(regex);
  if (!match) return '';
  
  let value = match[1].trim();
  
  // Remove CDATA se presente
  if (value.startsWith('<![CDATA[') && value.endsWith(']]>')) {
    value = value.substring(9, value.length - 3);
  }
  
  return value.trim();
}

