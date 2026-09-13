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
      // Vérification que le binding AI est bien présent
      if (!env.AI) {
        throw new Error("Le binding 'AI' est introuvable. Vérifie ton fichier wrangler.jsonc.");
      }

      const body = await request.json();
      const foodQuery = body.food;

      if (!foodQuery) {
        return new Response(JSON.stringify({ error: "Aliment manquant" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Appel à l'IA
      const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          {
            role: "system",
            content: "Tu es un expert en gastronomie. L'utilisateur te donne un aliment. Réponds UNIQUEMENT par UN SEUL MOT parmi : sucré, salé, acide, amer, piquant, inconnu."
          },
          {
            role: "user",
            content: foodQuery
          }
        ]
      });

      const taste = aiResponse && aiResponse.response ? aiResponse.response.trim().toLowerCase() : 'inconnu';

      return new Response(JSON.stringify({ taste }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (error) {
      // Renvoie le message d'erreur précis pour le voir dans le jeu
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
