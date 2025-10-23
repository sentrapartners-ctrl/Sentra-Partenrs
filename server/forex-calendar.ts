/**
 * Serviço para buscar eventos do calendário econômico do Forex Factory
 * Baseado na lógica do EA BlackGPT
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
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos (mesmo intervalo do EA)

export async function getForexFactoryEvents(): Promise<ForexEvent[]> {
  // Retorna cache se ainda válido
  if (cachedEvents.length > 0 && Date.now() - lastFetch < CACHE_DURATION) {
    console.log(`[Forex Calendar] Returning ${cachedEvents.length} cached events`);
    return cachedEvents;
  }

  try {
    console.log('[Forex Calendar] Fetching from https://nfs.faireconomy.media/ff_calendar_thisweek.xml');
    const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.xml', {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (!response.ok) {
      console.error('[Forex Calendar] Failed to fetch:', response.statusText);
      return cachedEvents; // Retorna cache antigo se falhar
    }

    const xmlData = await response.text();
    
    if (xmlData.length < 100) {
      console.error('[Forex Calendar] Insufficient data received');
      return cachedEvents;
    }

    console.log(`[Forex Calendar] Data received: ${xmlData.length} characters`);
    const events = processNewsXML(xmlData);
    
    cachedEvents = events.slice(0, 200); // Limita a 200 eventos
    lastFetch = Date.now();
    
    console.log(`[Forex Calendar] Successfully parsed ${events.length} events, cached ${cachedEvents.length}`);
    return cachedEvents;
  } catch (error) {
    console.error('[Forex Calendar] Error fetching events:', error);
    return cachedEvents; // Retorna cache antigo se houver erro
  }
}

/**
 * Extrai valor de uma tag XML, removendo CDATA e espaços
 * Lógica idêntica ao EA BlackGPT
 */
function extractXMLValue(xml: string, tag: string): string {
  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;
  
  let start = xml.indexOf(openTag);
  if (start === -1) return '';
  
  start += openTag.length;
  const end = xml.indexOf(closeTag, start);
  if (end === -1) return '';
  
  let value = xml.substring(start, end);
  
  // Remover tags CDATA se existirem
  const cdataStart = value.indexOf('<![CDATA[');
  if (cdataStart >= 0) {
    const cdataEnd = value.indexOf(']]>');
    if (cdataEnd >= 0) {
      value = value.substring(cdataStart + 9, cdataEnd);
    }
  }
  
  // Remover espaços em branco no início e fim
  return value.trim();
}

/**
 * Processa XML das notícias
 * Lógica idêntica ao EA BlackGPT: ProcessNewsXML()
 */
function processNewsXML(xmlData: string): ForexEvent[] {
  console.log('[Forex Calendar] Processing XML...');
  console.log(`[Forex Calendar] XML size: ${xmlData.length} characters`);
  
  const events: ForexEvent[] = [];
  const now = new Date();
  
  let eventStartPos = 0;
  let eventsProcessed = 0;
  let totalEventsFound = 0;
  
  // Procurar por eventos no XML (mesma lógica do EA)
  while (eventStartPos < xmlData.length && events.length < 100) {
    // Encontrar próximo evento
    const eventStart = xmlData.indexOf('<event>', eventStartPos);
    if (eventStart === -1) break;
    
    const eventEnd = xmlData.indexOf('</event>', eventStart);
    if (eventEnd === -1) break;
    
    totalEventsFound++;
    
    // Extrair dados do evento
    const eventXML = xmlData.substring(eventStart, eventEnd);
    
    // Extrair campos (mesma ordem do EA)
    const title = extractXMLValue(eventXML, 'title');
    const country = extractXMLValue(eventXML, 'country');
    const impact = extractXMLValue(eventXML, 'impact');
    const date = extractXMLValue(eventXML, 'date');
    const time = extractXMLValue(eventXML, 'time');
    const forecast = extractXMLValue(eventXML, 'forecast');
    const previous = extractXMLValue(eventXML, 'previous');
    
    // Debug dos primeiros 3 eventos (como no EA)
    if (totalEventsFound <= 3) {
      console.log(`[Forex Calendar] Event ${totalEventsFound}:`);
      console.log(`  Title: ${title}`);
      console.log(`  Country: ${country}`);
      console.log(`  Impact: ${impact}`);
      console.log(`  Date: ${date}`);
      console.log(`  Time: ${time}`);
    }
    
    // Converter data/hora
    const eventTime = convertNewsDateTime(date, time);
    
    if (totalEventsFound <= 3) {
      console.log(`  DateTime converted: ${eventTime}`);
      console.log(`  Current time: ${now}`);
      console.log(`  Is future? ${eventTime >= now ? 'YES' : 'NO'}`);
    }
    
    // Incluir apenas notícias em tempo real e futuras (mesma lógica do EA)
    if (eventTime >= now) {
      events.push({
        title,
        country,
        impact,
        date: eventTime.toISOString().split('T')[0],
        time: time,
        forecast: forecast || undefined,
        previous: previous || undefined,
      });
      eventsProcessed++;
    }
    
    eventStartPos = eventEnd + 8;
  }
  
  // Ordenar eventos por data (como no EA)
  events.sort((a, b) => {
    const dateA = new Date(a.date + ' ' + a.time);
    const dateB = new Date(b.date + ' ' + b.time);
    return dateA.getTime() - dateB.getTime();
  });
  
  console.log(`[Forex Calendar] Total events in XML: ${totalEventsFound}`);
  console.log(`[Forex Calendar] Processing complete: ${eventsProcessed} current and future events found`);
  
  return events;
}

/**
 * Converte data e hora do formato do Forex Factory para Date
 * Formato: date = "10-23-2025", time = "9:00am"
 */
function convertNewsDateTime(dateStr: string, timeStr: string): Date {
  // Parse date (MM-DD-YYYY)
  const [month, day, year] = dateStr.split('-').map(Number);
  
  // Parse time (h:mm[am|pm])
  let hours = 0;
  let minutes = 0;
  
  if (timeStr) {
    const isPM = timeStr.toLowerCase().includes('pm');
    const isAM = timeStr.toLowerCase().includes('am');
    const timeOnly = timeStr.replace(/[ap]m/gi, '').trim();
    const [h, m] = timeOnly.split(':').map(Number);
    
    hours = h;
    minutes = m || 0;
    
    // Converter para 24h
    if (isPM && hours !== 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
  }
  
  return new Date(year, month - 1, day, hours, minutes, 0);
}

