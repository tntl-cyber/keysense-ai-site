export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let targetUrl = url.searchParams.get("url");

  if (!targetUrl) return new Response(JSON.stringify({ error: "No URL" }), { status: 400 });
  if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

  const GEMINI_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc";

  try {
    // 1. JINA READER (To je tvoj "Get Webpage" node)
    let fullContent = "";
    try {
      const scrape = await fetch(`https://r.jina.ai/${targetUrl}`, {
        headers: { 
            'User-Agent': 'KeySense/1.0',
            'X-With-Images-Summary': 'false',
            'X-With-Links-Summary': 'false' 
        }
      });
      fullContent = await scrape.text();
      // Omejimo dolžino, da ne pretiravamo, a dovolj za analizo
      fullContent = fullContent.substring(0, 30000); 
    } catch (e) {
      throw new Error("Could not scrape website content.");
    }

    // 2. MEGA-PROMPT (Vsi tvoji Opal koraki združeni v enega)
    const prompt = `
      You are KeySense AI, an elite SEO strategist. 
      Analyze the provided website content strictly.

      TARGET URL: "${targetUrl}"
      WEBSITE CONTENT:
      """
      ${fullContent}
      """

      You must perform 3 distinct tasks (like a workflow) and combine them into one JSON output.

      TASK 1: SEO STRATEGY ANALYSIS
      - Identify 'Money Topics' and 'Content Gaps'.
      - Generate 5 high-intent keywords found in the text.
      - Generate 3 "Gap" keywords (what they are missing).
      - Estimate hidden keywords count.

      TASK 2: OPTIMIZATION RECOMMENDATIONS
      - Based on the analysis, create 3 specific, actionable technical or content recommendations to improve ranking.

      TASK 3: SEO OPTIMIZED ARTICLE TITLES
      - Suggest 3 titles for new blog articles that would cover the "Content Gap".

      OUTPUT FORMAT (Strict JSON, no markdown):
      {
        "competitor_summary": "A concise executive summary of what this business does and their current SEO stance.",
        "visible_keywords": [
            {"keyword": "Example Keyword", "intent": "Transactional", "opportunity": "High"}
        ],
        "content_gap_keywords": ["Gap Keyword 1", "Gap Keyword 2", "Gap Keyword 3"],
        "money_list_keywords": ["Money Keyword 1", "Money Keyword 2", "Money Keyword 3", "Money Keyword 4", "Money Keyword 5"],
        "hidden_keywords_count": 1240,
        "upgrade_hook": "Unlock the full database of 1240+ keywords to dominate this niche.",
        "recommendations": [
            {"title": "Recommendation 1", "desc": "Details on how to fix..."},
            {"title": "Recommendation 2", "desc": "Details on how to fix..."},
            {"title": "Recommendation 3", "desc": "Details on how to fix..."}
        ],
        "article_ideas": [
            {"title": "Article Title 1", "outline": "Brief outline of what to write..."},
            {"title": "Article Title 2", "outline": "Brief outline of what to write..."},
            {"title": "Article Title 3", "outline": "Brief outline of what to write..."}
        ]
      }
    `;

    // 3. KLIC GEMINI
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await geminiResponse.json();
    if (data.error) throw new Error(data.error.message);

    const aiText = data.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(cleanJson, { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    // Fallback samo če vse odpove
    return new Response(JSON.stringify({
        competitor_summary: "Analysis failed due to high load.",
        money_list_keywords: ["Error retrieving data"],
        content_gap_keywords: [],
        recommendations: [],
        article_ideas: []
    }), { headers: { 'Content-Type': 'application/json' } });
  }
}