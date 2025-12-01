export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let targetUrl = url.searchParams.get("url");

  if (!targetUrl) return new Response(JSON.stringify([]), { status: 400 });

  // Čiščenje domene
  let domain = targetUrl.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0];

  // --- KLJUČI ---
  const GEMINI_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc";
  const SERPER_KEY = "5ddb9fe661387ffb18f471615704b32ddbec0b13";
  // --------------

  // 1. SEZNAM VSEH MOŽNIH MODELOV (Če eden crkne, gremo na naslednjega)
  const candidateModels = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-pro"
  ];

  try {
    // 2. PRIDOBI KONTEKST S SERPERJEM (To vedno dela)
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: `site:${domain} "cenik" OR "price" OR "shop" OR "servis"`, 
        num: 6
      })
    });

    const serperData = await serperResponse.json();
    let siteContext = "";
    if (serperData.organic) {
        serperData.organic.forEach(result => {
             siteContext += `Page: ${result.title} | Snippet: ${result.snippet}\n`;
        });
    }

    // 3. PROMPT (Agresiven SEO)
    const prompt = `
      You are an Aggressive SEO Strategist.
      Target Domain: "${domain}"
      Google Scan Results:
      ${siteContext}

      YOUR MISSION:
      Identify 3 "Money Keywords" with HIGH COMMERCIAL INTENT based on the content found.
      
      RULES:
      1. IGNORE informational keywords. Look for TRANSACTIONAL terms.
      2. DETECT LOCATION/LANGUAGE: If results are in Slovenian/German, output keywords in that language.
      3. BE SPECIFIC: Use specific product names or service locations found in the scan.
      
      Output JSON: [{"keyword": "...", "gap": "HIGH"}]
    `;

    // 4. "MODEL HUNTER" ZANKA
    // Poskusi vsak model v seznamu, dokler ne dobimo odgovora
    let lastError = "";
    
    for (const model of candidateModels) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();

        // Če Google vrne napako za ta model, vrzi izjemo in pojdi na naslednjega
        if (data.error) {
          throw new Error(`Model ${model} failed: ${data.error.message}`);
        }

        // ČE SMO TUKAJ, JE USPELO!
        const aiText = data.candidates[0].content.parts[0].text;
        const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

        return new Response(cleanJson, {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (e) {
        // Shrani napako in poskusi naslednji model
        console.log(e.message);
        lastError = e.message;
        continue; // Pojdi na vrh zanke z naslednjim modelom
      }
    }

    // 5. ČE VSI MODELI CRKNEJO (Zelo malo verjetno)
    // Vrnemo sistemsko napako, ampak vsaj vemo, da smo poskusili vse.
    throw new Error("All models failed. Last error: " + lastError);

  } catch (error) {
    // Fallback v skrajni sili (Smart URL parsing), da uporabnik ne vidi errorja
    const smartFallback = [
      { keyword: `best ${domain.split('.')[0]} alternatives`, gap: "HIGH" },
      { keyword: `${domain.split('.')[0]} reviews`, gap: "MED" },
      { keyword: `buy ${domain.split('.')[0]} online`, gap: "HIGH" }
    ];
    
    return new Response(JSON.stringify(smartFallback), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}