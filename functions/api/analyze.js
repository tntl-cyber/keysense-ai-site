export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let targetUrl = url.searchParams.get("url");

  if (!targetUrl) return new Response(JSON.stringify({ error: "No URL" }), { status: 400 });
  if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

  const GEMINI_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc";
  const SERPER_KEY = "5ddb9fe661387ffb18f471615704b32ddbec0b13";

  try {
    let contextText = "";
    let source = "";

    // 1. POSKUS: JINA READER (Deep Content)
    // Nastavimo timeout, da ne čakamo predolgo
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 sekund max za scrape

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
        // Očistimo in skrajšamo tekst za hitrost
        contextText = text.replace(/\s+/g, ' ').substring(0, 12000); 
        source = "Deep Scrape";
      }
    } catch (e) {
      console.log("Jina timed out or failed, switching to Serper.");
    } finally {
      clearTimeout(timeoutId);
    }

    // 2. POSKUS: SERPER (Če je Jina prazna)
    if (!contextText || contextText.length < 200) {
       const serper = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: `site:${targetUrl}`, num: 8 })
       });
       const serperData = await serper.json();
       if (serperData.organic) {
           serperData.organic.forEach(r => contextText += `Title: ${r.title}. Desc: ${r.snippet}\n`);
       }
       source = "Google Index";
    }

    // 3. OPAL MEGA-PROMPT (Optimiziran za hitrost)
    const prompt = `
      Act as KeySense AI, an elite SEO strategist.
      Analyze this website content (${source}):
      """
      ${contextText}
      """

      Generate a comprehensive SEO Strategy Report.
      
      TASKS:
      1. Analyze the niche and specific products/services.
      2. Identify 5 'Money Keywords' (Transactional intent, specific to products found).
      3. Identify 3 'Content Gap' keywords (What they should target but aren't).
      4. Create 3 specific optimization recommendations.
      5. Draft 3 blog article titles to drive traffic.

      OUTPUT FORMAT (Strict JSON Only):
      {
        "competitor_summary": "Executive summary of the business and SEO status.",
        "visible_keywords": [{"keyword": "Ex: Product Name", "intent": "Transactional", "opportunity": "High"}],
        "content_gap_keywords": ["Gap Keyword 1", "Gap Keyword 2", "Gap Keyword 3"],
        "money_list_keywords": ["Money Kw 1", "Money Kw 2", "Money Kw 3", "Money Kw 4", "Money Kw 5"],
        "hidden_keywords_count": 850,
        "upgrade_hook": "Unlock full competitor keyword data.",
        "recommendations": [
            {"title": "Tech Fix", "desc": "Specific advice..."},
            {"title": "Content Fix", "desc": "Specific advice..."},
            {"title": "Strategy Fix", "desc": "Specific advice..."}
        ],
        "article_ideas": [
            {"title": "Article 1", "outline": "Focus on..."},
            {"title": "Article 2", "outline": "Focus on..."},
            {"title": "Article 3", "outline": "Focus on..."}
        ]
      }
    `;

    // 4. KLIC GEMINI (Model Flash 001 - Najhitrejši)
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await geminiResponse.json();
    
    // ERROR HANDLING - Da vidimo točno napako v UI
    if (data.error) {
        return new Response(JSON.stringify({
            competitor_summary: `Google API Error: ${data.error.message}`,
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
    // CATCH-ALL ERROR (Timeouti itd.)
    return new Response(JSON.stringify({
        competitor_summary: `System Analysis Failed: ${error.message}. Please try a simpler URL.`,
        money_list_keywords: ["System Error"],
        content_gap_keywords: [],
        recommendations: [],
        article_ideas: []
    }), { headers: { 'Content-Type': 'application/json' } });
  }
}