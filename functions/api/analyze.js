export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response(JSON.stringify([{ keyword: "Error: No URL provided", gap: "FAIL" }]), { status: 400 });
  }

  const API_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc"; 

  // PROMPT
  const prompt = `
    Analyze this website URL context: "${targetUrl}".
    Acting as an SEO Expert, suggest 3 highly specific, commercial-intent keywords that this specific website should target.
    Output JSON only: [{"keyword": "...", "gap": "HIGH"}, ...]
  `;

  try {
    // 1. KORAK: DINAMIČNO POIŠČI MODEL
    // Vprašamo Google, kateri modeli so na voljo za ta ključ
    const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const modelsData = await modelsResponse.json();

    if (modelsData.error) {
       throw new Error("API Key Error: " + modelsData.error.message);
    }

    // Poiščemo prvi model, ki podpira 'generateContent' in je 'gemini'
    // (To bo verjetno 'models/gemini-1.5-flash' ali 'models/gemini-pro')
    let activeModel = modelsData.models.find(m => 
        m.name.includes('gemini') && 
        m.supportedGenerationMethods.includes('generateContent')
    );

    // Če ne najde, vzemi čisto prvega, ki generira vsebino
    if (!activeModel) {
        activeModel = modelsData.models.find(m => m.supportedGenerationMethods.includes('generateContent'));
    }

    if (!activeModel) {
        throw new Error("No available generative models found for this API key.");
    }

    // Odstranimo 'models/' iz imena, če je potrebno, čeprav API običajno sprejme polno ime
    const modelName = activeModel.name; 

    // 2. KORAK: IZVEDI ANALIZO Z NAJDENIM MODELOM
    const generateResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const genData = await generateResponse.json();

    if (genData.error) {
      return new Response(JSON.stringify([
        { keyword: "GOOGLE ERROR:", gap: "!!!" },
        { keyword: genData.error.message, gap: "FIX" }
      ]), { headers: { 'Content-Type': 'application/json' } });
    }

    const aiText = genData.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(cleanJson, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify([
      { keyword: "SYSTEM ERROR", gap: "!!!" },
      { keyword: error.message, gap: "LOGS" }
    ]), { headers: { 'Content-Type': 'application/json' } });
  }
}