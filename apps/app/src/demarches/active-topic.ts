/**
 * Topic actif du diagnostic : celui que désigne le paramètre d'URL s'il est
 * connu, le premier de la liste sinon.
 *
 * Les topics arrivent de l'API, donc rien n'est sélectionnable au montage : la
 * résolution se refait dès que la liste est là. Les onglets du diagnostic et la
 * navigation pas-à-pas doivent l'appliquer à l'identique, faute de quoi
 * « précédent / suivant » se calcule depuis un autre topic que l'onglet visible.
 */
export const resolveActiveTopic = <T>(
  topics: readonly T[],
  currentCode: string | null,
  toCode: (topic: T) => string
): T | null =>
  topics.find((topic) => toCode(topic) === currentCode) ?? topics[0] ?? null;
