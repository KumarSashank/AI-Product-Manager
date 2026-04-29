import { aiService } from './src/services/gemini.service.js';

async function run() {
  try {
    const mom = await aiService.generateMoMWithSeedItems("John: We need to finish the API documentation by Friday.\nSarah: I'll handle the frontend updates.\nJohn: There's a blocker with the database migration.");
    console.log("MoM:", JSON.stringify(mom, null, 2));
  } catch (err) {
    console.error("ERROR:", err);
  }
}
run();
