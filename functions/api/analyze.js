export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let targetUrl = url.searchParams.get("url");

  if (!targetUrl) return new Response(JSON.stringify([]), { status: 400 });

  // Čiščenje
  let domain = targetUrl.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0];

  // --- KLJUČI ---
  const GEMINI_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc";
  const SERPER_KEY = "5ddb9fe661387ffb18f471615704b32ddbec0b13";
  // --------------

  try {
    // 1. SERPER: Išči specifično "Cenik", "Akcija", "Produkt"
    // S tem dobimo boljše podatke kot samo z naslovnico
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: `site:${domain} "cenik" OR "price" OR "shop" OR "servis"`, 
        num: 8
      })
    });

    const serperData = await serperResponse.json();

    let siteContext = "";
    if (serperData.organic) {
        serperData.organic.forEach(result => {
             siteContext += `Page: ${result.title} | Snippet: ${result.snippet}\n`;
        });
    }

    // 2. PROMPT: BLACK HAT STRATEGIJA
    const prompt = `
      You are an Aggressive SEO Strategist.
      Target Domain: "${domain}"
      Google Scan Results:
      ${siteContext}

      YOUR MISSION:
      Identify 3 "Money Keywords" with HIGH COMMERCIAL INTENT.
      
      RULES:
      1. IGNORE informational keywords (like "history of...", "about...").
      2. IF LOCAL BUSINESS (e.g. Car Dealer, Service): You MUST include the CITY/COUNTRY inferred from the text (e.g. "Renault servis Ljubljana", "Gume akcija").
      3. IF E-COMMERCE: Target specific product models + "buy" or "price" (e.g. "Nasiol ZR53 price", "buy nano coating").
      4. LANGUAGE: Output keywords strictly in the language of the site title (Slovenian for .si, etc).
      
      FORBIDDEN:
      - Do not use the phrase "best alternatives" unless it's a software tool.
      - Do not use generic brand names alone.

      Output JSON:
      [
        {"keyword": "...", "gap": "HIGH"}
      ]
    `;

    // Kličemo stabilen model
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const geminiData = await geminiResponse.json();

    // ČE JE NAPAKA, JO POKAŽI (Brez skrivanja!)
    if (geminiData.error) {
        return new Response(JSON.stringify([
            { keyword: "API ERROR", gap: "!!!" },
            { keyword: geminiData.error.message, gap: "FIX" }
        ]), { headers: { 'Content-Type': 'application/json' } });
    }

    const aiText = geminiData.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(cleanJson, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Pokaži sistemsko napako, če obstaja
    return new Response(JSON.stringify([
        { keyword: "SYSTEM CRASH", gap: "!!!" },
        { keyword: error.message, gap: "LOGS" }
    ]), { headers: { 'Content-Type': 'application/json' } });
  }
}