import { ingestNav } from "./ingestNav";

ingestNav().catch((err) => {
  console.error("Error ingesting NAV:", err);
  process.exit(1);
});
