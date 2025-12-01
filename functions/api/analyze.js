export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let targetUrl = url.searchParams.get("url");

  if (!targetUrl) return new Response(JSON.stringify({ error: "No URL" }), { status: 400 });
  if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

  const GEMINI_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc";
  const SERPER_KEY = "5ddb9fe661387ffb18f471615704b32ddbec0b13";

  try {
    // 1. AUTO-DISCOVERY: Poišči delujoč model
    // Vprašamo Google, kaj imamo na voljo
    let modelName = "models/gemini-1.5-flash"; // Default
    try {
        const modelsResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`);
        const modelsData = await modelsResp.json();
        
        if (modelsData.models) {
            // Poišči prvega, ki je 'gemini' in podpira 'generateContent'
            const activeModel = modelsData.models.find(m => 
                m.name.includes("gemini") && 
                m.supportedGenerationMethods.includes("generateContent")
            );
            if (activeModel) {
                modelName = activeModel.name;
                console.log("Using auto-discovered model:", modelName);
            }
        }
    } catch (e) {
        console.log("Auto-discovery failed, using default.");
    }

    // 2. JINA SCRAPE (Vsebina)
    let contextText = "";
    try {
      const scrape = await fetch(`https://r.jina.ai/${targetUrl}`, {
        headers: { 'User-Agent': 'KeySense/1.0', 'X-With-Images-Summary': 'false' }
      });
      if (scrape.ok) {
        const text = await scrape.text();
        contextText = text.replace(/\s+/g, ' ').substring(0, 15000); 
      }
    } catch (e) {}

    // Fallback na Serper če Jina ne dela
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
    }

    // 3. OPAL PROMPT
    const prompt = `
      Act as KeySense AI, an elite SEO strategist.
      Analyze this website content:
      """
      ${contextText}
      """

      Generate a comprehensive SEO Strategy Report.
      
      OUTPUT FORMAT (Strict JSON Only):
      {
        "competitor_summary": "Executive summary...",
        "visible_keywords": [{"keyword": "Ex: Product Name", "intent": "Transactional", "opportunity": "High"}],
        "content_gap_keywords": ["Gap Keyword 1", "Gap Keyword 2", "Gap Keyword 3"],
        "money_list_keywords": ["Money Kw 1", "Money Kw 2", "Money Kw 3", "Money Kw 4", "Money Kw 5"],
        "hidden_keywords_count": 850,
        "upgrade_hook": "Unlock full data.",
        "recommendations": [
            {"title": "Tech Fix", "desc": "Fix..."},
            {"title": "Content Fix", "desc": "Fix..."},
            {"title": "Strategy Fix