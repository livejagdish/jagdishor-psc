// GET /api/questions - डेटाबेसबाट सबै प्रश्नहरू ल्याउने
export async function onRequestGet(context) {
    const { env } = context;
    // PSC_DATA भनिने KV Storage बाट डेटा तान्ने
    const data = await env.PSC_DATA.get("psc_questions");
    return new Response(data || "{}", {
        headers: { "Content-Type": "application/json;charset=UTF-8" }
    });
}

// POST /api/questions - एडमिन प्यानलबाट नयाँ प्रश्न सुरक्षित गर्ने
export async function onRequestPost(context) {
    const { request, env } = context;
    
    // सुरक्षा जाँच (Адmin Token Authentication)
    const token = request.headers.get("Authorization");
    // हामीले Cloudflare Environment Variable मा राख्ने SECRET_TOKEN सँग रूजु गर्ने
    if (!token || token !== env.ADMIN_SECRET_TOKEN) {
        return new Response("Unauthorized Token Access Denied.", { status: 401 });
    }

    try {
        const { category, question, answer } = await request.json();
        if (!category || !question || !answer) {
            return new Response("Missing Required Fields", { status: 400 });
        }

        // साविकको डेटा तान्ने
        let currentDataRaw = await env.PSC_DATA.get("psc_questions");
        let currentData = currentDataRaw ? JSON.parse(currentDataRaw) : {};

        // नयाँ विधा (Category) ट्याब छ भने सुरु गर्ने
        if (!currentData[category]) {
            currentData[category] = [];
        }

        // डेटा थप्ने
        currentData[category].push({
            id: Date.now().toString(),
            question: question,
            answer: answer,
            created_at: new Date().toISOString()
        });

        // KV Database मा पुन: सुरक्षित गर्ने
        await env.PSC_DATA.put("psc_questions", JSON.stringify(currentData));

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response("Server Write Error: " + err.message, { status: 500 });
    }
}
