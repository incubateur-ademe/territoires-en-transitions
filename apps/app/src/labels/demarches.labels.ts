/**
 * Libellés du domaine démarches. Les libellés d'instruction et de dépôt PCAET
 * vivent encore dans `catalog.ts` (dette connue) : les nouveaux arrivent ici, et
 * les anciens y seront repris au fil des passages.
 */
export const demarchesLabels = {
  /**
   * Sans le nom de la collectivité : il est déjà affiché juste au-dessus, dans
   * le sélecteur de contexte du header. Ce que la bannière ajoute, c'est la
   * casquette — à quel titre on est là.
   */
  contexteInstructionTitre: ({ instructeurNom }: { instructeurNom: string }) =>
    `Vous naviguez ici au titre de ${instructeurNom}`,

  contexteInstructionRetourDossier: 'Revenir à l’instruction',

  contexteInstructionRetour: 'Revenir à mes dossiers PCAET',
};
