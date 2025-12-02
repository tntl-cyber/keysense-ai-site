export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let targetUrl = url.searchParams.get("url");

  if (!targetUrl) return new Response(JSON.stringify({ error: "No URL" }), { status: 400 });
  if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

  const GEMINI_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc";
  const SERPER_KEY = "5ddb9fe661387ffb18f471615704b32ddbec0b13";

  try {
    // 1. VSEBINA (Scraping)
    let contextText = "";
    let source = "Google Context";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); 

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
        contextText = text.replace(/\s+/g, ' ').substring(0, 15000); 
        source = "Full Website Content";
      }
    } catch (e) {
      // Jina failed, ignore
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

    // 2. OPAL PROMPT
    const prompt = `
      Act as KeySense AI, an elite SEO strategist.
      Analyze this website content (${source}):
      """${contextText}"""

      Perform 3 tasks and combine into one JSON output.
      
      TASK 1: STRATEGY. Identify 'Money Topics', 'Content Gaps', and 5 'Money Keywords' (Transactional).
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

    // 3. KLIC API - SPREMEMBA NA v1 (STABILNO)
    // Uporabljamo 'v1' namesto 'v1beta'.
    // Model 'gemini-1.5-flash' je tukaj standard.
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

    const geminiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await geminiResponse.json();

    // DIAGNOSTIKA: Če še vedno ne dela, morava videti točen seznam modelov
    if (data.error) {
        return new Response(JSON.stringify({
            competitor_summary: `FATAL ERROR: ${data.error.message}. Please check if 'Generative Language API' is enabled in Google Cloud Console.`,
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