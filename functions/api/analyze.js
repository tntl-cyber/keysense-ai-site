export async function onRequest(context) {
  // 1. Pridobi URL iz zahteve
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "No URL provided" }), { status: 400 });
  }

  // !!! TUKAJ PRILEPI SVOJ KLJUČ !!!
  const API_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc"; 

  try {
    // 2. Preberi vsebino ciljne strani (Scraping)
    // Uporabljamo preprost fetch. Opomba: Nekatere strani blokirajo bote.
    // Za MVP je to dovolj.
    const siteResponse = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KeySenseAI/1.0;)'
      }
    });
    const siteHtml = await siteResponse.text();

    // Počistimo HTML, da dobimo samo tekst (da ne zmedemo AI-ja)
    // To je zelo osnovno čiščenje, samo da dobimo kontekst.
    const textSnippet = siteHtml.replace(/<[^>]*>?/gm, ' ').substring(0, 10000); 

    // 3. Pripravi Prompt za Gemini
    const prompt = `
      Analyze the following website content text and act as an SEO Expert.
      Website Content Snippet: "${textSnippet}..."

      Task:
      1. Identify the core topic.
      2. Generate 3 high-value, specific "money keywords" that this competitor is likely targeting or missing.
      3. For each keyword, estimate a generic "Gap Level" (High, Med, Low).

      Output ONLY valid JSON in this format:
      [
        {"keyword": "example keyword 1", "gap": "HIGH"},
        {"keyword": "example keyword 2", "gap": "MED"},
        {"keyword": "example keyword 3", "gap": "HIGH"}
      ]
    `;

    // 4. Pokliči Google Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const geminiData = await geminiResponse.json();
    
    // 5. Parsanje odgovora
    const aiText = geminiData.candidates[0].content.parts[0].text;
    // Očistimo morebitne markdown oznake (```json ...)
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(cleanJson, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Analysis failed", details: error.message }), { status: 500 });
  }
}