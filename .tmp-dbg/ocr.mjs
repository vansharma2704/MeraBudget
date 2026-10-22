import { createWorker } from "tesseract.js";
import { writeFileSync } from "node:fs";
const [, , out, ...imgs] = process.argv;
const worker = await createWorker("eng");
await worker.setParameters({ tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" }); // one uniform block: keeps table rows together
let all = [];
for (const img of imgs) { const { data } = await worker.recognize(img); all.push(...data.text.split("\n")); }
await worker.terminate();
writeFileSync(out, JSON.stringify(all));
console.log(all.filter((l) => /^\s*\d{1,2}\/\d{1,2}\b|balance/i.test(l)).slice(0, 40).join("\n"));
