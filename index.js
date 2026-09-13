export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const body = await request.json().catch(() => ({}));
      const foodQuery = body.food || "sauce soja";

      const prompt = `Tu es un gourmand expressif et bavard. L'utilisateur te donne un aliment ou un plat.
Détermine sa saveur principale parmi : sucré, salé, acide, amer, piquant, umami, ou inconnu.

Réponds UNIQUEMENT avec un objet JSON :
{"taste": "VALEUR", "message": "TA_RÉPLIQUE"}

Consignes :
- "taste" doit être exactement l'un des mots suivants : sucré, salé, acide, amer, piquant, umami, inconnu.
- "message" est ta réaction vivante et courte (1 à 2 phrases) au goût de cet aliment.
Aliment : ${foodQuery}`;

      // Utilisation de llama-3.1-8b-instruct
      const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: "user", content: prompt }]
      });

      let taste = "inconnu";
      let message = `Mmm, ${foodQuery}... Je n'arrive pas bien à définir ce goût !`;

      if (aiResponse && aiResponse.response) {
        const rawText = aiResponse.response;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.taste) taste = parsed.taste.toLowerCase();
            if (parsed.message) message = parsed.message;
          } catch (e) {}
        }

        if (taste === "inconnu") {
          const lowerText = rawText.toLowerCase();
          if (lowerText.includes("umami")) taste = "umami";
          else if (lowerText.includes("sucré") || lowerText.includes("sucre")) taste = "sucré";
          else if (lowerText.includes("salé") || lowerText.includes("sale")) taste = "salé";
          else if (lowerText.includes("acide")) taste = "acide";
          else if (lowerText.includes("amer")) taste = "amer";
          else if (lowerText.includes("piquant")) taste = "piquant";

          if (message.includes("Je n'arrive pas bien")) {
            message = rawText.replace(/```json|```|\{|\}/g, '').trim();
          }
        }
      }

      return new Response(JSON.stringify({ taste, message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ 
        error: `[ERREUR AI] ${err.name || 'Error'}: ${err.message || err.toString()}` 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
