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

    if (request.method !== "POST") {
      return new Response("Méthode non autorisée", { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const foodQuery = body.food;

      if (!foodQuery) {
        return new Response(JSON.stringify({ error: "Aliment manquant" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const prompt = `Tu es un gourmand expressif et bavard. L'utilisateur te donne un aliment ou un plat.
Détermine sa saveur principale parmi : sucré, salé, acide, amer, piquant, umami, ou inconnu.

Réponds UNIQUEMENT avec un objet JSON au format exact suivant :
{"taste": "VALEUR", "message": "TA_RÉPLIQUE"}

Consignes :
- "taste" doit être exactement l'un des mots suivants : sucré, salé, acide, amer, piquant, umami, inconnu.
- "message" est ta réaction vivante et courte (1 à 2 phrases) au goût de cet aliment.
Aliment : ${foodQuery}`;

      // Utilisation de Llama 3.3 70B
      const aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
        messages: [
          { role: "user", content: prompt }
        ]
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
          } catch (e) {
            // Ignorer l'erreur de parsing
          }
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

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
