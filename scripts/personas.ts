/**
 * Prints top 3 matched resources for the 12 PRD personas (SC-2).
 * Forces AI off so results stay deterministic for demos.
 */
import { loadEnvLocal } from "../lib/load-env-local";

loadEnvLocal();
process.env.AI_ENABLED = "false";

async function main() {
  const { closeDb } = await import("../lib/db");
  const { runSearch } = await import("../lib/search/run-search");

  const personas: { name: string; text: string; postal?: string }[] = [
    {
      name: "Night-shift parent",
      text: "I work nights and need affordable childcare for my 4 year old",
      postal: "T2R",
    },
    {
      name: "Newcomer parent",
      text: "Food help and English language parent groups nearby",
      postal: "T2A",
    },
    {
      name: "Teen caregiver",
      text: "Activities and mentoring for my 14 year old after school",
      postal: "T3A",
    },
    {
      name: "Housing stress",
      text: "Rent help and housing navigation before eviction",
      postal: "T2E",
    },
    {
      name: "Financial squeeze",
      text: "Child care subsidy and income support applications",
      postal: "T2N",
    },
    {
      name: "Isolated parent",
      text: "Ways to meet other parents and share chores nearby",
      postal: "T3E",
    },
    {
      name: "Infant care",
      text: "Licensed daycare for an infant under 1 year",
      postal: "T2B",
    },
    {
      name: "School-age camps",
      text: "Free weekend activities and coding clubs for kids 8 to 12",
      postal: "T2W",
    },
    {
      name: "Legal questions",
      text: "Free legal advice about custody and child support",
      postal: "T2G",
    },
    {
      name: "Health support",
      text: "Counselling for my child and parenting coaching",
      postal: "T2S",
    },
    {
      name: "Food insecurity",
      text: "Food bank and meal programs for a family of three",
      postal: "T2C",
    },
    {
      name: "Shift worker",
      text: "Flexible after-school care for a 7 year old",
      postal: "T3C",
    },
  ];

  for (const persona of personas) {
    const result = await runSearch({
      text: persona.text,
      postal: persona.postal,
      radiusKm: 20,
    });
    const top = result.results
      .slice(0, 3)
      .map((r, i) => `${i + 1}. ${r.name}`);
    console.log(`\n${persona.name}`);
    console.log(`  query: ${persona.text}`);
    console.log(
      top.length
        ? top.map((line) => `  ${line}`).join("\n")
        : "  (no matches)",
    );
  }

  await closeDb();
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  try {
    const { closeDb } = await import("../lib/db");
    await closeDb();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
