export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let targetUrl = url.searchParams.get("url");

  if (!targetUrl) return new Response(JSON.stringify([]), { status: 400 });

  // 1. DOLOČI BRAND (Da ga lahko PREPOVEDEMO v rezultatih)
  let domain = targetUrl.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0];
  let brandName = domain.split('.')[0]; 
  // Naredi prvo črko veliko (npr. "Futunatura")
  brandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);

  const GEMINI_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc";
  const SERPER_KEY = "5ddb9fe661387ffb18f471615704b32ddbec0b13";

  // Seznam modelov za stabilnost
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-1.5-pro"];

  try {
    // 2. SERPER: Poglej, kaj dejansko prodajajo (Naslovi strani)
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: `site:${domain}`,
        num: 8
      })
    });

    const serperData = await serperResponse.json();
    let productContext = "";
    
    // Izlušči naslove produktov iz iskanja
    if (serperData.organic) {
        serperData.organic.forEach(result => {
             // Odstrani ime branda iz naslova
             let cleanTitle = result.title.replace(new RegExp(brandName, "gi"), "").replace(/\|/g, "").trim();
             if (cleanTitle.length > 3) {
                productContext += `- Product: ${cleanTitle} (Desc: ${result.snippet})\n`;
             }
        });
    }

    // 3. PROMPT: "NON-BRANDED GAP ANALYSIS"
    const prompt = `
      You are a Black Hat SEO Strategist.
      Target Site: "${domain}" (Brand: ${brandName})
      
      I have analyzed their top pages and found these products:
      ${productContext}

      YOUR MISSION:
      Generate 3 "Content Gap" keywords that catch customers BEFORE they buy specific brands.
      
      CRITICAL RULES:
      1. FORBIDDEN: Do NOT use the word "${brandName}" in the keywords.
      2. TARGET: Use the PRODUCT NAMES found above.
      3. INTENT: Combine product name with "best", "vs", "price", "for sleep", "review".
      4. LANGUAGE: Output keywords in the language of the snippets (e.g. Slovenian).

      Output JSON: [{"keyword": "...", "gap": "HIGH"}]
    `;

    // Loop čez modele
    for (const model of models) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        if (data.error) continue; // Poskusi naslednji model

        const aiText = data.candidates[0].content.parts[0].text;
        const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

        return new Response(cleanJson, { headers: { 'Content-Type': 'application/json' } });

      } catch (e) {
        continue;
      }
    }
    
    throw new Error("All models failed");

  } catch (error) {
    // FALLBACK
    const fallback = [
      { keyword: `best rated products on ${domain}`, gap: "HIGH" },
      { keyword: `${domain.split('.')[0]} discount code`, gap: "LOW" },
      { keyword: `top competitors to ${domain}`, gap: "MED" }
    ];
    return new Response(JSON.stringify(fallback), { headers: { 'Content-Type': 'application/json' } });
  }
}