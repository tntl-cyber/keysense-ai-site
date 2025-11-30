export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response(JSON.stringify([{ keyword: "Error: No URL provided", gap: "FAIL" }]), { status: 400 });
  }

  // TVOJ API KLJUČ
  const API_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc"; 

  // PROMPT - To je točno to, kar počne Opal v ozadju
  const prompt = `
    Analyze this specific website URL context: "${targetUrl}".
    
    Acting as an SEO Expert, suggest 3 highly specific, commercial-intent keywords that this specific website should target to get more traffic.
    Do not give generic advice. Be specific to the niche of the URL.
    
    Format EXACTLY as JSON:
    [
      {"keyword": "keyword 1", "gap": "HIGH"},
      {"keyword": "keyword 2", "gap": "MED"},
      {"keyword": "keyword 3", "gap": "HIGH"}
    ]
  `;

  try {
    // Kličemo 'gemini-1.5-flash'. To je trenutno standard.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    // --- DIAGNOSTIKA ---
    // Če Google vrne napako, jo vrnemo direktno tebi, da vidiva, kaj je narobe.
    if (data.error) {
      return new Response(JSON.stringify([
        { keyword: "GOOGLE API ERROR:", gap: "!!!" },
        { keyword: data.error.message, gap: "FIX" }
      ]), { headers: { 'Content-Type': 'application/json' } });
    }
    // -------------------

    const aiText = data.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(cleanJson, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Če pride do napake v omrežju/strežniku
    return new Response(JSON.stringify([
      { keyword: "SYSTEM ERROR", gap: "!!!" },
      { keyword: error.message, gap: "CHECK LOGS" }
    ]), { headers: { 'Content-Type': 'application/json' } });
  }
}