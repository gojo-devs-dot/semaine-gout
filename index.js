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
      if (!env.AI) {
        throw new Error("Binding AI non configuré dans wrangler.jsonc");
      }

      const body = await request.json();
      
      const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [{ role: "user", content: body.food || "pomme" }]
      });

      return new Response(JSON.stringify({ taste: aiResponse.response }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      // Renvoie l'erreur sous forme de texte lisible
      return new Response(JSON.stringify({ error: err.message || err.toString() }), {
        status: 200, // Forcé à 200 pour lire le message directement dans la bulle
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
