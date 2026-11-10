/**
 * Évalue l'extraction d'un document local selon son profil.
 *
 * Les profils générique et Électrification peuvent appeler le fournisseur
 * configuré : lancement humain uniquement
 * (cf. "Paid external AI calls" dans le CLAUDE.md racine).
 *
 *   make ai-import-eval f=plan.pdf [ref=eval-out/reference.json] [out=…]
 *
 * `--lecture-seule` sur un tableur s'exécute sans démarrer Nest ni aucun
 * modèle. Électrification initialise le modèle uniquement si nécessaire.
 */
import { print } from './eval-output';
import { evaluateImport } from './evaluate-import';
import { readEvalInput } from './read-eval-input';

// Une promesse qui n'aboutit jamais vide la boucle d'évènements : Node sort
// alors en code 0 sans un mot. On veut au moins savoir où on en était.
let lastStep = 'démarrage';
let finished = false;
process.on('beforeExit', () => {
  if (!finished) {
    print(
      `✗ Arrêt avant la fin : plus rien n'attend de réponse (dernière étape : ${lastStep}).`
    );
    process.exitCode = 1;
  }
});
process.on('unhandledRejection', (reason) => {
  print(
    `✗ Rejet non traité : ${
      reason instanceof Error ? reason.stack : String(reason)
    }`
  );
  process.exitCode = 1;
});

const main = async (): Promise<number> => {
  const input = await readEvalInput();
  if (input.mode === 'exit') {
    print(input.message);
    return input.code;
  }
  return evaluateImport(input, (step) => {
    lastStep = step;
  });
};

// Pas de process.exit : il tronque ce qui reste à écrire sur la sortie.
main().then(
  (code) => {
    finished = true;
    process.exitCode = code;
  },
  (error: unknown) => {
    finished = true;
    print(
      `✗ ${
        error instanceof Error ? error.stack ?? error.message : String(error)
      }`
    );
    process.exitCode = 1;
  }
);
