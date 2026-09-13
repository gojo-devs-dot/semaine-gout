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

      // Consigne système pour forcer un format JSON strict avec réplique personnalisée et umami
      const prompt = `Tu es un gourmand expressif et bavard. L'utilisateur te donne un aliment ou un plat.
Analyse sa saveur principale parmi cette liste exacte : sucré, salé, acide, amer, piquant, umami, ou inconnu.

Réponds UNIQUEMENT sous la forme d'un objet JSON strict avec cette structure, sans aucun autre texte ni balise Markdown :
{"taste": "VALEUR", "message": "TA_RÉPLIQUE"}

Consignes :
- "taste" doit être STRICTEMENT l'un des mots suivants : sucré, salé, acide, amer, piquant, umami, inconnu.
- "message" est ta réaction vivante, amusante et courte (1 à 2 phrases max) sur cet aliment.
Exemple pour "sauce soja" : {"taste": "umami", "message": "Ouh là, cette sauce soja déborde d'umami et de savory ! Un vrai régal pour les papilles !"}`;

      const aiResponse = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Aliment : ${foodQuery}` }
        ]
      });

      let result = { taste: "inconnu", message: `Mmm, ${foodQuery}... C'est un goût bien particulier !` };

      if (aiResponse && aiResponse.response) {
        try {
          // Extraction du JSON au cas où le modèle ajoute du texte autour
          const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error("Erreur de parsing JSON:", e);
        }
      }

      return new Response(JSON.stringify(result), {
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
