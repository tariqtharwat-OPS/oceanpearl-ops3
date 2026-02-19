const { VertexAI } = require('@google-cloud/vertexai');

async function main() {
    console.log("Testing Vertex AI Connection...");

    try {
        const vertex_ai = new VertexAI({ project: 'oceanpearl-ops', location: 'asia-southeast1' });
        const model = vertex_ai.getGenerativeModel({ model: 'gemini-1.0-pro' });

        console.log("Model initialized. Sending prompt...");
        const result = await model.generateContent("Hello, are you there?");
        console.log("Response received:");
        console.log(result.response.candidates[0].content.parts[0].text);

    } catch (e) {
        console.error("ERROR:", e);
        if (e.response) {
            console.error("Response:", JSON.stringify(e.response, null, 2));
        }
    }
}

main();
