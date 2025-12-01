export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let targetUrl = url.searchParams.get("url");

  if (!targetUrl) return new Response(JSON.stringify([]), { status: 400 });

  // Clean domain
  let domain = targetUrl.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0];

  // --- TVOJI KLJUČI ---
  const GEMINI_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc";
  const SERPER_KEY = "5ddb9fe661387ffb18f471615704b32ddbec0b13";
  // --------------------

  try {
    // 1. GLOBOKO ISKANJE (Iščemo specifike, ne splošno)
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: `site:${domain} "product" OR "service" OR "model"`, // Iščemo produkte!
        num: 8
      })
    });

    const serperData = await serperResponse.json();

    let siteContext = "";
    if (serperData.organic) {
        serperData.organic.forEach(result => {
            // Ignoriramo strani, ki so samo "Contact Us" ali "About"
            if (!result.title.includes("Contact") && !result.title.includes("About")) {
                siteContext += `Product/Page: ${result.title} | Snippet: ${result.snippet}\n`;
            }
        });
    }

    // 2. "SNIPER" PROMPT (Brutalen filter za kvaliteto)
    const prompt = `
      Act as a World-Class SEO Strategist. 
      I have scraped the domain "${domain}" and found these specific products/services:
      
      ${siteContext}

      YOUR TASK:
      Identify 3 highly specific "Money Keywords" that drive BUYER traffic.
      
      RULES FOR QUALITY (STRICT):
      1.  NO GENERIC TERMS. BANNED words: "best alternatives", "pricing", "review" (unless specific).
      2.  USE SPECIFIC MODEL NAMES found in the text (e.g. if you see "ZR53", use "ZR53", not just "coating").
      3.  Target "Long-Tail User Problems" (4+ words). Example: "how to apply [Product] on glass", "is [Product] safe for pets".
      4.  Target "Direct Competitor Comparison". Example: "[Product] vs [Specific Competitor Model]".

      OUTPUT FORMAT (JSON ONLY):
      [
        {"keyword": "specific long tail keyword 1", "gap": "HIGH"},
        {"keyword": "specific comparison keyword 2", "gap": "MED"},
        {"keyword": "specific problem solving keyword 3", "gap": "HIGH"}
      ]
    `;

    // Uporabi stabilen model
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const geminiData = await geminiResponse.json();

    if (geminiData.error) throw new Error(geminiData.error.message);

    const aiText = geminiData.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(cleanJson, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // FALLBACK SAMO V SKRAJNEM PRIMERU
    // Tudi fallback naredimo bolj specifičen
    const fallback = [
      { keyword: `${domain.split('.')[0]} vs ceramic pro 9h`, gap: "HIGH" },
      { keyword: `how long does ${domain.split('.')[0]} last`, gap: "MED" },
      { keyword: `apply ${domain.split('.')[0]} on plastic trim`, gap: "HIGH" }
    ];

    return new Response(JSON.stringify(fallback), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}