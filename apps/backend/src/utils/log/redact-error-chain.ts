/**
 * Retire en place, de chaque erreur d'une chaîne de causes, les valeurs
 * saisies par l'utilisateur. Modifier `message` et `stack` à la source couvre
 * d'un coup tous les débouchés de l'erreur : logs, PostHog, réponse HTTP ou
 * tRPC.
 *
 * - `Failed query: <requête>\nparams: <valeurs>` d'un DrizzleQueryError,
 *   recopié tel quel par les erreurs qui l'enveloppent (TRPCError : message
 *   et stack). Les valeurs ne sont jamais analysées : on coupe au marqueur.
 * - Les messages pg de classe 22 (data exception), qui citent la valeur
 *   refusée (`invalid input syntax for type uuid: "…"`). On masque du premier
 *   au dernier guillemet : la valeur peut elle-même contenir des guillemets.
 *
 * Idempotent, ne boucle pas sur une chaîne cyclique et ne lève jamais : une
 * erreur exotique ne doit pas casser le traitement de l'erreur.
 */
const PARAMS_MARKER = '\nparams: ';

export function maskParamsToEnd(message: string) {
  const index = message.indexOf(PARAMS_MARKER);
  return index === -1
    ? message
    : `${message.slice(0, index)}${PARAMS_MARKER}[masqués]`;
}

function maskMessage(error: Error) {
  const { code } = error as { code?: unknown };
  return typeof code === 'string' && code.startsWith('22')
    ? error.message.replace(/".*"/s, '"[masqué]"')
    : maskParamsToEnd(error.message);
}

/** De l'erreur à sa cause la plus profonde, sans boucler. */
export function listErrorChain(error: unknown): Error[] {
  const chain: Error[] = [];
  for (let e = error; e instanceof Error && !chain.includes(e); e = e.cause) {
    chain.push(e);
  }
  return chain;
}

export function redactErrorChain(error: unknown) {
  try {
    const chain = listErrorChain(error);
    const replacements = chain
      .map((e) => [e.message, maskMessage(e)] as const)
      .filter(([original, masked]) => original !== masked);
    if (replacements.length === 0) return;
    const redact = (text: string) =>
      replacements.reduce(
        (redacted, [original, masked]) => redacted.split(original).join(masked),
        text
      );
    for (const e of chain) {
      e.message = redact(e.message);
      if (e.stack) e.stack = redact(e.stack);
    }
  } catch {
    // message non textuel, erreur figée… : on logue telle quelle
  }
}
