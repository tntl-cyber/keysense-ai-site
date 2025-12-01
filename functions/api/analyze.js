export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let targetUrl = url.searchParams.get("url");

  if (!targetUrl) return new Response(JSON.stringify({ error: "No URL" }), { status: 400 });
  if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

  // --- KLJUČI ---
  const GEMINI_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc";
  const SERPER_KEY = "5ddb9fe661387ffb18f471615704b32ddbec0b13";
  // --------------

  try {
    // 1. KORAK: PRIDOBI CELOTNO VSEBINO STRANI (Kot Opal "Get Webpage")
    // Uporabljamo r.jina.ai, ki prebere celo stran in vrne čist tekst.
    let fullPageContent = "";
    
    try {
      const scrapeResponse = await fetch(`https://r.jina.ai/${targetUrl}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'KeySenseAI/1.0',
          'X-With-Images-Summary': 'false',
          'X-With-Links-Summary': 'false'
        }
      });
      
      if (scrapeResponse.ok) {
        const text = await scrapeResponse.text();
        // Vzamemo prvih 15.000 znakov (dovolj za AI, da dojame bistvo)
        fullPageContent = text.substring(0, 15000); 
      }
    } catch (e) {
      console.log("Scrape failed, falling back to Serper");
    }

    // 2. KORAK: FALLBACK NA SERPER (Če Jina ne dela ali stran blokira)
    // Če je Jina vrnila prazno, uporabimo Google Search podatke
    if (fullPageContent.length < 500) {
       const serperResponse = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: `site:${targetUrl}`, num: 6 })
       });
       const serperData = await serperResponse.json();
       if (serperData.organic) {
          serperData.organic.forEach(r => fullPageContent += `Title: ${r.title}\nDesc: ${r.snippet}\n`);
       }
    }

    // 3. OPAL PROMPT (Tvoj originalni recept)
    // Sedaj AI dobi dejanski tekst strani, zato bodo rezultati specifični.
    const prompt = `
      You are KeySense AI, an elite SEO strategist.
      Your task: Analyze 'webpage_content' to reverse-engineer keyword strategy.

      TARGET URL: "${targetUrl}"
      WEBPAGE CONTENT:
      """
      ${fullPageContent}
      """

      INSTRUCTIONS:
      1. Analyze the content deeply. Identify specific products, models, and unique selling points.
      2. Generate 3 specific "Content Gap" keywords (High opportunity, not used in text).
      3. Generate a 'Money List' of 5 high-intent transactional keywords using SPECIFIC PRODUCT NAMES found in text.
      4. If the site is in a specific language (e.g. Slovenian), output keywords in that language.
      
      OUTPUT FORMAT (Strict JSON):
      {
        "competitor_summary": "Short analysis of their strategy...",
        "money_list_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
        "content_gap_keywords": ["gap_keyword1", "gap_keyword2", "gap_keyword3"],
        "hidden_keywords_count": 1250
      }
    `;

    // 4. KLIC GEMINI AI
    // Uporabljamo model Flash (001), ker je hiter in podpira veliko teksta
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await geminiResponse.json();

    if (data.error) {
      // Zadnji obrambni zid: Če AI odpove, vrnemo pameten fallback
      throw new Error("AI Quota or Error");
    }

    const aiText = data.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(cleanJson, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // FALLBACK (Da uporabnik nikoli ne vidi napake)
    let domain = targetUrl.replace('https://', '').replace('www.', '').split('/')[0];
    const fallback = {
      competitor_summary: `Could not deep-scan ${domain}, but analyzing market position...`,
      money_list_keywords: [`best alternatives to ${domain}`, `${domain} pricing`, `buy ${domain.split('.')[0]} online`],
      content_gap_keywords: ["competitor comparisons", "user reviews", "discount codes"],
      hidden_keywords_count: 500
    };
    return new Response(JSON.stringify(fallback), { headers: { 'Content-Type': 'application/json' } });
  }
}