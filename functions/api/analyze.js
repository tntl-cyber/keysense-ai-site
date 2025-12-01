export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let targetUrl = url.searchParams.get("url");

  if (!targetUrl) return new Response(JSON.stringify({ error: "No URL" }), { status: 400 });
  if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

  const GEMINI_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc";
  const SERPER_KEY = "5ddb9fe661387ffb18f471615704b32ddbec0b13";

  // SEZNAM MODELOV (Če prvi ne dela, poskusi naslednjega)
  const candidateModels = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro"
  ];

  try {
    // 1. SCRARE CONTENT (Jina + Serper Fallback)
    let contextText = "";
    let source = "Google Context";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); 

    try {
      // Poskusimo Jina (Deep Scrape)
      const scrape = await fetch(`https://r.jina.ai/${targetUrl}`, {
        headers: { 
            'User-Agent': 'KeySense/1.0',
            'X-With-Images-Summary': 'false',
            'X-With-Links-Summary': 'false' 
        },
        signal: controller.signal
      });
      if (scrape.ok) {
        const text = await scrape.text();
        contextText = text.replace(/\s+/g, ' ').substring(0, 15000); 
        source = "Full Website Content";
      }
    } catch (e) {
      console.log("Jina fail, moving to Serper");
    } finally {
      clearTimeout(timeoutId);
    }

    // Če Jina ni delala, uporabimo Serper
    if (!contextText || contextText.length < 500) {
       const serper = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: `site:${targetUrl}`, num: 10 })
       });
       const serperData = await serper.json();
       if (serperData.organic) {
           serperData.organic.forEach(r => contextText += `Title: ${r.title}. Desc: ${r.snippet}\n`);
       }
    }

    // 2. OPAL PROMPT (Tvoj originalni recept)
    const prompt = `
      Act as KeySense AI, an elite SEO strategist.
      Analyze this website content (${source}):
      """
      ${contextText}
      """

      You must perform 3 distinct tasks and combine them into one JSON output.

      TASK 1: STRATEGY ANALYSIS
      - Identify 'Money Topics' (High value).
      - Identify 'Content Gaps' (Keywords they miss).
      - Generate 5 'Money Keywords' (Transactional intent).

      TASK 2: RECOMMENDATIONS
      - Create 3 specific optimization recommendations based on the content found.

      TASK 3: CONTENT PLAN
      - Suggest 3 blog article titles to target the gaps.

      OUTPUT FORMAT (Strict JSON Only):
      {
        "competitor_summary": "Executive summary of the business strategy...",
        "visible_keywords": [{"keyword": "Ex: Product Name", "intent": "Transactional", "opportunity": "High"}],
        "content_gap_keywords": ["Gap Keyword 1", "Gap Keyword 2", "Gap Keyword 3"],
        "money_list_keywords": ["Money Kw 1", "Money Kw 2", "Money Kw 3", "Money Kw 4", "Money Kw 5"],
        "hidden_keywords_count": 850,
        "upgrade_hook": "Unlock full competitor keyword data.",
        "recommendations": [
            {"title": "Fix 1", "desc": "How to fix..."},
            {"title": "Fix 2", "desc": "How to fix..."},
            {"title": "Fix 3", "desc": "How to fix..."}
        ],
        "article_ideas": [
            {"title": "Article 1", "outline": "Focus on..."},
            {"title": "Article 2", "outline": "Focus on..."},
            {"title": "Article 3", "outline": "Focus on..."}
        ]
      }
    `;

    // 3. MODEL HUNTER LOOP (Ključna rešitev za tvojo napako)
    let lastError = "";
    
    for (const model of candidateModels) {
        try {
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            const data = await geminiResponse.json();

            // Če ta model javi napako, vrzi error in pojdi na naslednjega
            if (data.error) throw new Error(data.error.message);

            // Če smo tukaj, je uspelo!
            const aiText = data.candidates[0].content.parts[0].text;
            const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

            return new Response(cleanJson, { headers: { 'Content-Type': 'application/json' } });

        } catch (e) {
            console.log(`Model ${model} failed. Trying next...`);
            lastError = e.message;
            // Nadaljuj zanko na naslednji model
        }
    }

    // Če vsi modeli odpovedo
    throw new Error(`All Google models failed. Last error: ${lastError}`);

  } catch (error) {
    return new Response(JSON.stringify({
        competitor_summary: `System Error: ${error.message}`,
        money_list_keywords: ["API Error"],
        content_gap_keywords: [],
        recommendations: [],
        article_ideas: []
    }), { headers: { 'Content-Type': 'application/json' } });
  }
}