export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let targetUrl = url.searchParams.get("url");

  if (!targetUrl) return new Response(JSON.stringify([]), { status: 400 });

  // Čiščenje domene
  let domain = targetUrl.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0];
  let brand = domain.split('.')[0];
  brand = brand.charAt(0).toUpperCase() + brand.slice(1);

  // --- TVOJI KLJUČI ---
  const GEMINI_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc";
  const SERPER_KEY = "5ddb9fe661387ffb18f471615704b32ddbec0b13";
  // --------------------

  try {
    // 1. ISKANJE KONTEKSTA (Serper)
    // Iščemo splošno o domeni, da vidimo, kaj so (Avtohiša? Trgovina? Blog?)
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: `site:${domain}`, // Preišči samo to domeno
        num: 6
      })
    });

    const serperData = await serperResponse.json();

    let siteContext = "";
    if (serperData.organic && serperData.organic.length > 0) {
        serperData.organic.forEach(result => {
            siteContext += `- Title: ${result.title} | Desc: ${result.snippet}\n`;
        });
    } else {
        // Če site: iskanje ne vrne nič, poišči samo ime brenda
        siteContext = `Domain: ${domain}. (Site index empty, inferring from name).`;
    }

    // 2. UNIVERZALNI PROMPT (Pravi AI)
    // AI-ju naročimo, naj najprej ugotovi NIŠO in JEZIK.
    const prompt = `
      Act as an Elite SEO Strategist.
      I have crawled the website "${domain}" and found this content:
      
      ${siteContext}

      YOUR TASK:
      1. Detect the BUSINESS TYPE (e.g., Car Dealership, SaaS, E-commerce, Blog).
      2. Detect the LANGUAGE of the content (e.g., Slovenian, English, German).
      3. Generate 3 high-value "Content Gap" keywords that this business needs to target to get more customers.

      CRITICAL RULES:
      - Keywords must be in the DOMINANT LANGUAGE of the website (if site is Slovenian, keywords must be Slovenian).
      - Keywords must be specific to their industry (e.g., if Car Dealer -> "servis opel ljubljana", "rabljena vozila").
      - NO GENERIC NONSENSE. Do not say "pricing" without a product name.
      
      Output STRICT JSON:
      [
        {"keyword": "...", "gap": "HIGH"},
        {"keyword": "...", "gap": "MED"},
        {"keyword": "...", "gap": "HIGH"}
      ]
    `;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const geminiData = await geminiResponse.json();

    if (geminiData.error) throw new Error(geminiData.error.message);

    const aiText = geminiData.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(cleanJson, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log("Error: " + error.message);

    // --- PAMETNI GENERIČNI FALLBACK (Če vse odpove) ---
    // Tokrat brez "keramičnih premazov". Samo univerzalne poslovne fraze.
    
    const universalFallback = [
      { keyword: `${brand} reviews and rating`, gap: "MED" },
      { keyword: `best alternatives to ${brand}`, gap: "HIGH" },
      { keyword: `${brand} contact and support`, gap: "LOW" }
    ];

    return new Response(JSON.stringify(universalFallback), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}