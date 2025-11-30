export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let targetUrl = url.searchParams.get("url");

  if (!targetUrl) return new Response(JSON.stringify([]), { status: 400 });

  // Počistimo URL, da dobimo domeno (npr. nasiol.com)
  let domain = targetUrl.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0];

  // --- TVOJI KLJUČI (VKLJUČENI) ---
  const GEMINI_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc";
  const SERPER_KEY = "5ddb9fe661387ffb18f471615704b32ddbec0b13";
  // -------------------------------

  try {
    // 1. PRIDOBI PRAVE PODATKE S POMOČJO GOOGLE SEARCH (Serper)
    // To so "oči" sistema. Vidimo, kaj ta stran dejansko prodaja.
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: `site:${domain}`,
        num: 6 // Preberemo top 6 strani te domene
      })
    });

    const serperData = await serperResponse.json();

    // Sestavimo kontekst iz pravih rezultatov iskanja
    let siteContext = "";
    if (serperData.organic && serperData.organic.length > 0) {
        serperData.organic.forEach(result => {
            siteContext += `- Page Title: ${result.title}\n  Description: ${result.snippet}\n`;
        });
    } else {
        // Če Serper ne najde ničesar (zelo redko), uporabimo domeno
        siteContext = `Domain: ${domain} (Specific products not found in search index)`;
    }

    // 2. ANALIZA Z GEMINI AI (Možgani)
    // AI-ju damo PRAVE podatke, zato ne bo generičen.
    const prompt = `
      You are a Senior SEO Strategist.
      I have performed a deep crawl of the domain "${domain}" and found these top ranking pages/products:

      ${siteContext}

      Based STRICTLY on this content, identify the specific NICHE and PRODUCTS.
      Then, generate 3 highly specific, commercial-intent "Content Gap" keywords that this specific business should target to get more customers.

      Rules:
      1. NO generic keywords like "alternatives" or "pricing" unless a specific product name is attached (e.g. use "Nasiol ZR53 price", NOT just "Nasiol price").
      2. Focus on "Best [Specific Product Category] for [Use Case]" style keywords.
      3. Gap levels: HIGH, MED, LOW.

      Output STRICT JSON:
      [
        {"keyword": "...", "gap": "HIGH"},
        {"keyword": "...", "gap": "MED"},
        {"keyword": "...", "gap": "HIGH"}
      ]
    `;

    // Uporabljamo stabilen Gemini 1.5 Flash model
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const geminiData = await geminiResponse.json();

    if (geminiData.error) {
        throw new Error(geminiData.error.message);
    }

    const aiText = geminiData.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(cleanJson, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log("System Error: " + error.message);

    // TOTAL SYSTEM FAILURE FALLBACK (Samo če oba API-ja odpovesta)
    // Tudi to poskušamo narediti specifično
    const fallback = [
      { keyword: `best ${domain.split('.')[0]} product reviews`, gap: "HIGH" },
      { keyword: `${domain.split('.')[0]} discount codes`, gap: "LOW" },
      { keyword: `top rated alternatives to ${domain.split('.')[0]}`, gap: "MED" }
    ];

    return new Response(JSON.stringify(fallback), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}