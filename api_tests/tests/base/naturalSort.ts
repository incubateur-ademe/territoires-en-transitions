import { assertEquals } from "https://deno.land/std@0.196.0/assert/assert_equals.ts";

await new Promise((r) => setTimeout(r, 0));

/**
 * Regex dont le premier groupe revoie les suites de nombres
 * et le deuxième le reste.
 */
const regex = /0*([0-9]+)|([^0-9]+)/g;

/**
 * Transforme un texte en un texte dont la comparaison permettra
 * un ordonnancement naturel.
 */
function comparable(text: string): string {
  return [...text.matchAll(regex)]
    .map((m) =>
      m[2]
        ? m[2]
        : m[0].length.toString().length.toString() +
          m[0].length.toString() +
          m[0],
    )
    .join("");
}

/**
 * Une chose avec un titre, pourrait être un axe ou une fiche.
 */
type chose = {
  titre: string;
};

/**
 * La fonction de comparaison utilisée par la fonction "sort".
 */
function compare(a: chose, b: chose) {
  const ca = comparable(a.titre);
  const cb = comparable(b.titre);
  if (ca < cb) {
    return -1;
  }
  if (ca > cb) {
    return 1;
  }
  return 0;
}

Deno.test("Ordonnancement naturel", async () => {
  const choses = [
    { titre: "A2 Un titre" },
    { titre: "A10 Un autre titre" },
    { titre: "A9 Encore un titre" },
    { titre: "A1 Un titre ou rien" },
  ];
  choses.sort(compare);
  assertEquals(
    JSON.stringify(choses),
    `[{"titre":"A1 Un titre ou rien"},{"titre":"A2 Un titre"},{"titre":"A9 Encore un titre"},{"titre":"A10 Un autre titre"}]`,
  );
});
