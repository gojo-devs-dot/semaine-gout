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
      return new Response("Méthode non autorisée", { status: 405 });
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

      // Interrogation du modèle Llama 3 via Cloudflare Workers AI
      const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          {
            role: "system",
            content: "Tu es un expert en gastronomie. L'utilisateur te donne un aliment ou un plat. Réponds UNIQUEMENT par UN SEUL MOT parmi cette liste : sucré, salé, acide, amer, piquant, ou inconnu. Ne fais aucune phrase."
          },
          {
            role: "user",
            content: foodQuery
          }
        ]
      });

      const taste = aiResponse.response.trim().toLowerCase();

      return new Response(JSON.stringify({ taste }), {
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
