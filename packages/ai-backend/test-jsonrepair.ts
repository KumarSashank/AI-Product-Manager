import { jsonrepair } from 'jsonrepair';
const truncated = '{"executiveSummary": "This is a summary", "items": [{"title": "task 1"}, {"title": "task 2"';
console.log("Original:", truncated);
console.log("Repaired:", jsonrepair(truncated));
