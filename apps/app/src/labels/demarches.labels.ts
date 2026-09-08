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

  /**
   * Le même repère, quand le dossier ne vient au service que par un territoire
   * qu'il ne préside pas : l'EPCI déborde chez lui, l'avis revient au service du
   * siège. Le dire évite de chercher un bouton de dépôt qui n'apparaîtra pas.
   */
  contexteInstructionLectureSeule:
    'Ce dossier vous est communiqué pour information : il relève d’un territoire limitrophe, et l’avis revient au service dont il dépend.',

  contexteInstructionRetourDossier: 'Revenir à l’instruction',

  contexteInstructionRetour: 'Revenir à mes dossiers PCAET',

  /**
   * L'accueil d'un agent que son fournisseur d'identité vient de rattacher à
   * son service : personne ne l'a invité, il n'a rien choisi, et rien ne lui
   * dirait où il est ni ce qu'il peut faire.
   *
   * « ProConnect » et jamais « MonCompteAdeme », même quand c'est ce dernier qui
   * a émis le jeton : côté utilisateur, la marque est ProConnect (décision
   * produit du 28/07/2026).
   *
   * Sans territoire, comme le reste de l'écran d'instruction : la modale sert
   * les cinq familles, dont les périmètres diffèrent — région, département, ou
   * aucun pour un service national.
   */
  accueilRattachementTitre: 'Bienvenue sur Territoires en Transitions',

  accueilRattachementService: ({ nom }: { nom: string }) =>
    `Votre compte a été automatiquement rattaché à ${nom} via ProConnect.`,

  accueilRattachementIntro:
    'Voici la page d’accueil de votre service : les dépôts PCAET qui vous concernent y seront listés dès leur transmission.',

  accueilRattachementConsulter:
    'Consulter les PCAET transmis pour avis et leurs échéances',

  /** Suit la famille, comme le titre de la liste : seules la DREAL et la région instruisent. */
  accueilRattachementSuivre: ({ deposeAvis }: { deposeAvis: boolean }) =>
    deposeAvis
      ? 'Suivre l’état d’instruction de chaque dossier'
      : 'Suivre l’avancement de chaque dossier',

  accueilRattachementVueEnsemble:
    'Avoir une vue d’ensemble de tous les PCAET de vos collectivités',

  accueilRattachementAction: 'Découvrir mon espace',
};
