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
      // 1. Verification du binding AI
      if (!env.AI) {
        throw new Error("Binding AI absente dans env. Vérifie wrangler.jsonc.");
      }

      // 2. Extraction du corps de la requete
      const body = await request.json().catch(() => ({}));
      const foodQuery = body.food || "pomme";

      // 3. Appel du modele Llama 3.1
      const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: "user", content: foodQuery }
        ]
      });

      return new Response(JSON.stringify({ taste: aiResponse.response }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      // Renvoie l'erreur sous forme de texte dans la bulle pour identifier la cause
      return new Response(JSON.stringify({ error: `[DIAGNOSTIC] ${err.name}: ${err.message}` }), {
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
