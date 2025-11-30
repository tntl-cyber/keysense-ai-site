export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response(JSON.stringify([{ keyword: "Error: No URL provided", gap: "FAIL" }]), { status: 400 });
  }

  // TVOJ API KLJUČ
  const API_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc"; 

  const prompt = `
    You are an SEO Expert. Analyze the URL: "${targetUrl}".
    Based on the domain name, identify the niche.
    Generate 3 specific "money keywords" for this business.
    Output JSON only: [{"keyword": "...", "gap": "HIGH"}, ...]
  `;

  try {
    // SPREMEMBA: Uporabljamo 'gemini-1.5-flash-latest', ki je bolj zanesljiv alias.
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await geminiResponse.json();

    if (data.error) {
      // Če še vedno ne dela, poskusimo s starejšim, ampak 100% delujočim modelom 'gemini-pro'
      console.log("Flash failed, trying Gemini Pro fallback...");
      
      const fallbackResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.error) {
         const errorMsg = fallbackData.error.message || "Unknown API Error";
         return new Response(JSON.stringify([
          { keyword: "GOOGLE ERROR:", gap: "!!!" },
          { keyword: errorMsg, gap: "FIX" }
        ]), { headers: { 'Content-Type': 'application/json' } });
      }
      
      const aiText = fallbackData.candidates[0].content.parts[0].text;
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      return new Response(cleanJson, { headers: { 'Content-Type': 'application/json' } });
    }

    const aiText = data.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(cleanJson, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify([
      { keyword: "SYSTEM ERROR:", gap: "!!!" },
      { keyword: error.message, gap: "FIX" }
    ]), { headers: { 'Content-Type': 'application/json' } });
  }
}