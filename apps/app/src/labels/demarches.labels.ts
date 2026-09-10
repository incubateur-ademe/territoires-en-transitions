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
   * Les statuts du suivi d'instruction.
   *
   * Un seul vocabulaire pour ce que le modèle porte en deux enums : le statut
   * du dépôt et l'état de la saisine. « Adopté » plutôt que « Publié » — côté
   * service de l'État, ce qui compte est l'acte de la collectivité, pas la mise
   * en ligne.
   *
   * Un statut par étape du cycle, et rien d'autre : le brouillon d'avis dit où
   * en est l'agent et non le dossier, et la révision est un attribut du dépôt,
   * pas une étape — le workflow est linéaire et sans retour.
   */
  instructionStatutAucunDepot: 'Aucun dépôt',
  instructionStatutEnElaboration: 'En élaboration',
  instructionStatutEnInstruction: 'En instruction',
  instructionStatutPasDAvisDepose: 'Pas d’avis déposé',
  instructionStatutInstruit: 'Instruit',
  instructionStatutAdopte: 'Adopté',
  instructionStatutArchive: 'Archivé',

  /**
   * Le vide d'un filtre trop étroit, à distinguer de celui d'un territoire sans
   * dossier : le premier se corrige, le second s'explique.
   */
  instructionListeAucunResultat:
    'Aucun dossier ne correspond à ces filtres',
  instructionListeReinitialiser: 'Réinitialiser les filtres',

  instructionListeColonneRegion: 'Région',
  instructionListeColonneDateLancement: 'Date de lancement',

  /**
   * Un dépôt qui n'a pas été transmis n'a pas d'échéance : elle se calcule à la
   * transmission. Le dire vaut mieux qu'un tiret, qui se lirait comme une
   * donnée manquante.
   */
  instructionListeSansEcheance: 'Pas encore d’échéance',

  /**
   * Une ligne sans dossier consultable, pour deux raisons qu'il ne faut pas
   * confondre : le dépôt est encore en chantier, ou il a bien été transmis mais
   * sans saisir ce service — le cas d'un dossier parti avant que le service
   * n'existe dans la plateforme. Dire « non transmis » du second serait faux.
   */
  instructionListeNonTransmis: 'Dossier non transmis',
  instructionListeNonSaisi: 'Service non saisi',

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
