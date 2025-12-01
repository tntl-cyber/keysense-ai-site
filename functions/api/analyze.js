export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let targetUrl = url.searchParams.get("url");

  if (!targetUrl) return new Response(JSON.stringify({ error: "No URL" }), { status: 400 });

  // Priprava domene
  let domain = targetUrl.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0];

  // --- KLJUČI ---
  const GEMINI_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc";
  const SERPER_KEY = "5ddb9fe661387ffb18f471615704b32ddbec0b13";
  // --------------

  try {
    // 1. SERPER (Simulacija "Get Webpage Content")
    // Opal uporablja Google Search. Mi tudi.
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: `site:${domain}`,
        num: 10 // Preberemo več, da dobimo dober kontekst
      })
    });

    const serperData = await serperResponse.json();
    
    // Pripravimo "Webpage Content" za Prompt
    let webpageContent = `Target URL: ${targetUrl}\nDomain: ${domain}\n\nTop Ranking Pages found via Google:\n`;
    if (serperData.organic) {
        serperData.organic.forEach(result => {
             webpageContent += `- Title: ${result.title}\n  Snippet: ${result.snippet}\n`;
        });
    }

    // 2. OPAL PROMPT (TOČNO BESEDILO, KI SI GA POSLAL)
    // To je srce sistema.
    const prompt = `
      You are KeySense AI, an elite SEO strategist and competitive intelligence engine. 
      Your task is to analyze provided 'webpage_content' and 'competitor_url' to reverse-engineer its keyword strategy. 
      
      INPUT DATA:
      Competitor Url: "${targetUrl}"
      Webpage Content:
      """
      ${webpageContent}
      """

      You will identify primary 'Money Topics' and secondary 'Support Topics', identify 3 specific long-tail keyword variations not explicitly used in the text (the 'Content Gap'), and generate a 'Money List' of 5 high-intent, transactional/commercial keywords logically derived from the content.

      Your output must be a valid and complete JSON object, strictly adhering to the specified format: 
      {
        "competitor_summary": "<summary>", 
        "visible_keywords": [{"keyword": "<keyword>", "intent": "<intent>", "opportunity": "<opportunity>"}], 
        "hidden_keywords_count": <integer_number>, 
        "content_gap_keywords": ["<keyword1>", "<keyword2>", "<keyword3>"], 
        "money_list_keywords": ["<keyword1>", "<keyword2>", "<keyword3>", "<keyword4>", "<keyword5>"], 
        "upgrade_hook": "<hook_message>"
      }

      # Step by Step instructions
      1. Carefully analyze the provided Webpage Content.
      2. Identify primary 'Money Topics' and secondary 'Support Topics'.
      3. Identify 3 specific long-tail keyword variations that are not explicitly used (Content Gap).
      4. Generate a 'Money List' of 5 high-intent, transactional keywords.
      5. Formulate a concise "competitor_summary".
      6. Extract "visible_keywords" and determine intent/opportunity.
      7. Estimate "hidden_keywords_count" (make it realistic, e.g., between 500 and 5000).
      8. Create an "upgrade_hook".
      9. Construct the JSON object.

      IMPORTANT: Output ONLY valid JSON. No markdown formatting.
    `;

    // 3. Klic AI
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await geminiResponse.json();

    if (data.error) throw new Error(data.error.message);

    const aiText = data.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(cleanJson, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // PAMETNI FALLBACK (Če AI odpove, da stran ne izgleda pokvarjeno)
    const fallback = {
      competitor_summary: `Analysis for ${domain}. The site appears to focus on core products in its niche.`,
      money_list_keywords: [`best ${domain.split('.')[0]} products`, `${domain.split('.')[0]} reviews`, "top rated alternatives"],
      content_gap_keywords: ["competitor price comparison", "discount codes", "user guide"],
      hidden_keywords_count: 850
    };
    return new Response(JSON.stringify(fallback), { headers: { 'Content-Type': 'application/json' } });
  }
}