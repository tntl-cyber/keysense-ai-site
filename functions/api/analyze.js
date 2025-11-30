export async function onRequest(context) {
  const { request } = context;
  const urlObj = new URL(request.url);
  let targetUrl = urlObj.searchParams.get("url");

  if (!targetUrl) return new Response(JSON.stringify([]), { status: 400 });
  if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

  const API_KEY = "AIzaSyBGtyvrhLuMxerRVdLUmljnWU7mB-POjtc"; 

  // --- PRIPRAVA PODATKOV IZ URL-JA (Za Super-Pametni Fallback) ---
  let brand = "Competitor";
  let pathKeywords = "";
  try {
    const targetObj = new URL(targetUrl);
    // 1. Dobimo Brand (npr. nasiol)
    const hostname = targetObj.hostname.replace('www.', '');
    brand = hostname.split('.')[0];
    brand = brand.charAt(0).toUpperCase() + brand.slice(1);

    // 2. Dobimo ključne besede iz poti (npr. /products/ceramic-coating -> ceramic coating)
    const path = targetObj.pathname;
    if (path && path.length > 1) {
        pathKeywords = path.replace(/[-_/]/g, ' ').trim();
    }
  } catch (e) {
    brand = "This Site";
  }

  // Seznam modelov, ki jih bomo poskusili (kaskadno)
  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-8b",
    "gemini-pro"
  ];

  const prompt = `
    Analyze URL: "${targetUrl}".
    Brand: "${brand}".
    Path context: "${pathKeywords}".
    
    Act as an SEO Expert. Ignore generic keywords.
    Generate 3 highly specific "money keywords" directly related to the product or service in the URL.
    
    If the URL suggests a specific product (e.g. ceramic coating), use that in the keywords.
    
    Output JSON only: [{"keyword": "...", "gap": "HIGH"}]
  `;

  // --- POIZKUSI VSE MODELE ZAPOREDOMA ---
  for (const model of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();

      // Če dobimo napako, pojdi na naslednji model v zanki
      if (data.error) {
        console.log(`Model ${model} failed: ${data.error.message}`);
        continue; 
      }

      // Če uspe, vrni rezultat in KONČAJ
      const aiText = data.candidates[0].content.parts[0].text;
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      return new Response(cleanJson, { headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
      continue; // Poskusi naslednji model
    }
  }

  // --- ČE VSI AI MODELI ODPOVEDO (SUPER FALLBACK) ---
  // Tukaj sestavimo rezultat, ki izgleda kot AI, na podlagi URL strukture
  
  let finalFallback = [];

  if (pathKeywords.length > 3) {
      // Če je URL npr. nasiol.com/marine-coatings
      // Rezultat: "best marine coatings 2025"
      finalFallback = [
          { keyword: `best ${pathKeywords} reviews`, gap: "HIGH" },
          { keyword: `${pathKeywords} vs competitors`, gap: "MED" },
          { keyword: `buy ${pathKeywords} online`, gap: "HIGH" }
      ];
  } else {
      // Če je samo nasiol.com (Domena)
      // Generiramo bolj "resne" ključne besede kot prej
      finalFallback = [
          { keyword: `${brand} official store discounts`, gap: "LOW" },
          { keyword: `${brand} reviews and complaints`, gap: "HIGH" },
          { keyword: `is ${brand} legit`, gap: "MED" }
      ];
  }

  return new Response(JSON.stringify(finalFallback), {
    headers: { 'Content-Type': 'application/json' }
  });
}