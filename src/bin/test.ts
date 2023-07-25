import { getPDFContent } from "./utils.js";
import { smartSplit } from "../utils.js";

for await (const chunk of smartSplit(
  getPDFContent(
    "./assets/A_Versatile_Analytical_Method_of_Investigating_MMF_Harmonics_of_Armature_Windings.pdf"
  ),
  {
    locales: "en",
    maxByteLength: 2000,
    granularity: "sentence",
  }
)) {
  console.log(chunk);
}
