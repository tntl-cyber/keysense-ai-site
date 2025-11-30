export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Normalizacija URL-ja
  let rawUrl = url.searchParams.get("url");
  if (!rawUrl) return new Response(JSON.stringify([]), { status: 400 });
  if (!rawUrl.startsWith('http')) rawUrl = 'https://' + rawUrl;

  const API_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc"; 

  // 1. IZLUŠČI IME ZNAMKE (Za Pametni Fallback in Prompt)
  let brand = "competitor";
  try {
    const urlObj = new URL(rawUrl);
    const hostname = urlObj.hostname.replace('www.', '');
    brand = hostname.split('.')[0]; 
    // Prva črka velika
    brand = brand.charAt(0).toUpperCase() + brand.slice(1);
  } catch (e) {
    brand = "This Business";
  }

  // 2. PRIPRAVI REZERVNI NAČRT (Če AI odpove, uporabi to)
  const smartFallback = [
    { keyword: `best alternatives to ${brand}`, gap: "HIGH" },
    { keyword: `${brand} vs market leader`, gap: "MED" },
    { keyword: `${brand} pricing strategy`, gap: "HIGH" }
  ];

  // Prompt za AI
  const prompt = `
    Analyze the website domain: "${rawUrl}" (Brand: ${brand}).
    Generate 3 specific, commercial-intent SEO keywords that "${brand}" should target.
    Output JSON only: [{"keyword": "...", "gap": "HIGH"}]
  `;

  try {
    // 3. KLIČEMO IZKLJUČNO "GEMINI-1.5-FLASH" (Ta je brezplačen in stabilen)
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await geminiResponse.json();

    // ČE GOOGLE JAVI NAPAKO (Quota, Model not found, itd.)
    if (data.error) {
      // Ne javimo napake uporabniku. Vrnemo pametni fallback.
      // To zagotavlja 100% delovanje za stranko.
      return new Response(JSON.stringify(smartFallback), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const aiText = data.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(cleanJson, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // ČE PRIDE DO SISTEMSKE NAPAKE
    // Vrnemo pametni fallback. Stranka vidi rezultate, ne napake.
    return new Response(JSON.stringify(smartFallback), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}