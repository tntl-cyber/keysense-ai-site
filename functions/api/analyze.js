export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let targetUrl = url.searchParams.get("url");

  if (!targetUrl) return new Response(JSON.stringify({ error: "No URL" }), { status: 400 });
  if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

  // --- TVOJ NOVI API KLJUČ ---
  const GEMINI_KEY = "AIzaSyBwo5W7XD2J04YrcwQQEPWwqDxutwT5cms";
  const SERPER_KEY = "5ddb9fe661387ffb18f471615704b32ddbec0b13";

  try {
    // 1. AUTO-DISCOVERY: VPRAŠAJ GOOGLE, KATERI MODEL DELA
    // To reši problem "Model not found" za vedno.
    let modelName = "models/gemini-1.5-flash"; // Privzeto
    try {
        const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`);
        const listData = await listResp.json();
        
        if (listData.models) {
            // Poišči prvega Gemini, ki podpira generiranje vsebine
            // Preferiramo "flash" za hitrost, če ne, vzamemo "pro"
            const preferredModel = listData.models.find(m => 
                m.name.includes("gemini") && 
                m.name.includes("flash") &&
                m.supportedGenerationMethods.includes("generateContent")
            );
            
            const backupModel = listData.models.find(m => 
                m.name.includes("gemini") && 
                m.supportedGenerationMethods.includes("generateContent")
            );

            if (preferredModel) {
                modelName = preferredModel.name;
            } else if (backupModel) {
                modelName = backupModel.name;
            }
            console.log("Auto-discovered Model:", modelName);
        }
    } catch (e) {
        console.log("Discovery failed, using default.");
    }

    // 2. VSEBINA (Jina + Serper Fallback)
    let contextText = "";
    let source = "Google Context";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    try {
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
        contextText = text.replace(/\s+/g, ' ').substring(0, 20000); 
        source = "Full Website Content";
      }
    } catch (e) {
      // Ignore Jina fail
    } finally {
      clearTimeout(timeoutId);
    }

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

    // 3. OPAL PROMPT (Tvoj originalni recept)
    const prompt = `
      Act as KeySense AI, an elite SEO strategist.
      Analyze this website content (${source}):
      """${contextText}"""

      Perform 3 tasks and combine into one JSON output.
      
      TASK 1: STRATEGY. Identify 'Money Topics', 'Content Gaps', and 5 'Money Keywords' (Transactional/Commercial).
      TASK 2: RECOMMENDATIONS. Create 3 specific optimization recommendations.
      TASK 3: CONTENT PLAN. Suggest 3 blog article titles targeting gaps.

      OUTPUT FORMAT (Strict JSON Only):
      {
        "competitor_summary": "Executive summary...",
        "visible_keywords": [{"keyword": "Product Name", "intent": "Transactional", "opportunity": "High"}],
        "content_gap_keywords": ["Gap Keyword 1", "Gap Keyword 2", "Gap Keyword 3"],
        "money_list_keywords": ["Kw1", "Kw2", "Kw3", "Kw4", "Kw5"],
        "hidden_keywords_count": 850,
        "upgrade_hook": "Unlock full competitor data.",
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

    // 4. KLIC GEMINI (Z uporabo odkritega imena modela)
    // Preverimo, če modelName že vsebuje 'models/', sicer dodamo
    const finalModel = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
    
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${finalModel}:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await geminiResponse.json();

    if (data.error) {
        return new Response(JSON.stringify({
            competitor_summary: `API Error: ${data.error.message}. Model attempted: ${finalModel}`,
            money_list_keywords: ["API Error"],
            content_gap_keywords: [],
            recommendations: [],
            article_ideas: []
        }), { headers: { 'Content-Type': 'application/json' } });
    }

    const aiText = data.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(cleanJson, { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({
        competitor_summary: `System Error: ${error.message}`,
        money_list_keywords: ["System Error"],
        content_gap_keywords: [],
        recommendations: [],
        article_ideas: []
    }), { headers: { 'Content-Type': 'application/json' } });
  }
}