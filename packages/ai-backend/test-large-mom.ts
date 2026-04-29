import { aiService } from './src/services/gemini.service.js';

// Create a large dummy transcript
const transcript = Array.from({ length: 500 }).map((_, i) => `John: Point number ${i}. We need to make sure this is tracked.\nSarah: I agree, let's put it in the backlog.`).join('\n');

const context = {
  openItems: [],
  recentMeetingSummaries: [],
  openItemsSummary: [],
  accountabilityAlerts: [],
  readinessSignals: [],
  projectPriority: 'medium' as any,
  contextSummary: 'No project context.'
};

async function run() {
  console.log("Generating MoM for large transcript...");
  try {
    const start = Date.now();
    const mom = await aiService.generateMoMWithSeedItems(transcript, context, []);
    console.log("Success! Time:", Date.now() - start);
    console.log(JSON.stringify(mom).slice(0, 500) + '...');
  } catch (err: any) {
    console.error("ERROR:", err.message);
    if (err.stack) console.error(err.stack);
  }
}
run();
