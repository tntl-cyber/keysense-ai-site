export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "No URL provided" }), { status: 400 });
  }

  // TUKAJ JE TVOJ API KLJUČ (Vstavljen)
  const API_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc"; 

  try {
    // STRATEGIJA: Semantic Inference (Brez blokad)
    // AI analizira URL na podlagi svoje baze znanja, namesto da bi fizično obiskal stran.
    
    const prompt = `
      You are an elite SEO Strategist. 
      Analyze this URL: "${targetUrl}"
      
      Based on the domain name and your knowledge of the web, identify the likely niche and business model.
      
      Then, generate 3 high-value, commercial intent "money keywords" that a business with this URL should target to steal traffic from competitors.
      
      For each keyword, assign a 'Gap' level (HIGH, MED, or LOW).
      
      STRICT JSON OUTPUT ONLY. Do not write markdown. Do not write explanations.
      Format:
      [
        {"keyword": "keyword one", "gap": "HIGH"},
        {"keyword": "keyword two", "gap": "MED"},
        {"keyword": "keyword three", "gap": "HIGH"}
      ]
    `;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!geminiResponse.ok) {
      // Če Google javi napako, sproži fallback
      throw new Error(`Gemini API Error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json(