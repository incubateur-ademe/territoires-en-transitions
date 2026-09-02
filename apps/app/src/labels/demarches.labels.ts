/**
 * Libellés du domaine démarches. Les libellés d'instruction et de dépôt PCAET
 * vivent encore dans `catalog.ts` (dette connue) : les nouveaux arrivent ici, et
 * les anciens y seront repris au fil des passages.
 */
export const demarchesLabels = {
  contexteInstructionTitre: ({
    collectiviteNom,
    instructeurNom,
  }: {
    collectiviteNom: string;
    instructeurNom: string;
  }) => `Vous consultez ${collectiviteNom} au titre de ${instructeurNom}`,

  contexteInstructionRetourDossier: 'Revenir au dossier PCAET',

  contexteInstructionRetour: 'Revenir à mes dossiers à instruire',
};
