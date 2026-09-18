/**
 * Libellés du domaine démarches — dépôt et instruction PCAET compris.
 *
 * `catalog.ts` reste le seul point d'entrée public (`appLabels`) : il agrège ce
 * fichier, et les composants n'importent jamais d'ici directement.
 */
import {
  collectiviteTypeEnum,
  type CollectiviteType,
} from '@tet/domain/collectivites';
import type {
  DemarcheDocumentEtape,
  DemarchePcaetGuardId,
  DemarcheType,
} from '@tet/domain/demarches';
import { plural } from '@tet/ui/labels/plural';

/** Libellés d'un type de démarche, interpolés par les vues partagées. */
export type DemarcheTypeLabels = {
  nom: string;
  complement: string;
  possessif: string;
};

export const demarchesLabels = {
  /**
   * Sans le nom de la collectivité : il est déjà affiché juste au-dessus, dans
   * le sélecteur de contexte du header. Ce que la bannière ajoute, c'est la
   * casquette — à quel titre on est là.
   */
  contexteInstructionTitre: ({ instructeur }: { instructeur: string }) =>
    `Vous naviguez sur l’espace de cette collectivité au titre de ${instructeur}`,

  /**
   * La casquette dite comme l'agent la nomme, article compris : « au titre de la
   * DREAL » se lit, « au titre de DREAL » non.
   *
   * Le nom propre du service reste le repli — il porte déjà son type (« DREAL
   * Bretagne ») — pour les types qui instruisent sans figurer ici.
   */
  contexteInstructionCasquette: {
    [collectiviteTypeEnum.DREAL]: 'la DREAL',
    [collectiviteTypeEnum.DDT]: 'la DDT',
    [collectiviteTypeEnum.DR_ADEME]: 'la Direction régionale de l’ADEME',
    [collectiviteTypeEnum.REGION]: 'la Région',
  } as Partial<Record<CollectiviteType, string>>,

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
  instructionStatutDepotHorsPlateforme: 'Dépôt hors plateforme',
  demarcheAvanceEtapeHorsPlateforme:
    'Réalisée hors plateforme : rien à y faire ici',
  demarcheCreerHorsPlateforme:
    'PCAET déjà transmis pour avis hors plateforme',
  demarcheCreerHorsPlateformeDescription:
    'En activant ceci, vous arriverez directement à l’étape de finalisation de votre dépôt PCAET adopté. Les documents, les volets du diagnostic et le plan d’actions y restent à renseigner. Ce choix est définitif.',
  instructionStatutEnInstruction: 'En instruction',
  instructionStatutPasDAvisDepose: 'Pas d’avis déposé',
  instructionStatutInstruit: 'Instruit',
  instructionStatutAdopte: 'Adopté',
  instructionStatutArchive: 'Archivé',

  /**
   * Le vide d'un filtre trop étroit, à distinguer de celui d'un territoire sans
   * dossier : le premier se corrige, le second s'explique.
   */
  instructionListeAucunResultat: 'Aucun dossier ne correspond à ces filtres',
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

  /**
   * Libellés propres à chaque type de démarche. Les vues partagées (stepper,
   * documents…) les interpolent au lieu d'écrire « PCAET » en dur : ajouter un
   * type de démarche suffit à les faire fonctionner.
   */
  demarcheTypeLabels: {
    pcaet: {
      /** Nom court, employé seul : « PCAET ». */
      nom: 'PCAET',
      /** Complément de nom : « du PCAET », « de la labellisation »… */
      complement: 'du PCAET',
      /** Nature du dossier : « votre PCAET », « votre labellisation ». */
      possessif: 'votre PCAET',
    },
  } satisfies Record<DemarcheType, DemarcheTypeLabels>,

  demarchePilotesLabel: 'Pilotes :',
  demarcheAccesDescription: ({ type }: { type: DemarcheTypeLabels }) =>
    `Ce plan est lié à une démarche ${type.nom} réglementaire.`,
  demarcheAcceder: ({ type }: { type: DemarcheTypeLabels }) =>
    `Accéder à la démarche ${type.nom}`,
  demarcheCreerTitre: ({ type }: { type: DemarcheTypeLabels }) =>
    `Commencer le dépôt ${type.complement}`,
  demarcheCreerCadreReglementaire:
    "Les collectivités devant mettre en œuvre un PCAET au titre de l'article L229-26 du code de l'environnement ont la possibilité de déposer leur projet de PCAET, et l'obligation de déposer leur plan climat-air-énergie territoriaux adopté dans cet espace.", // Cadre légal propre au PCAET : non paramétrable.
  demarcheCreerChampsObligatoiresLegende:
    'Les champs marqués d’un astérisque (*) sont obligatoires.',
  demarcheCreerPilotes: 'Pilotes *',
  demarcheCreerRechercherPilote: 'Rechercher un pilote…',
  demarcheCreerDateLancement: 'Date de lancement *',
  demarcheCreerDateLancementRequise: 'La date de lancement est requise',
  demarcheCreerSoumettre: 'Commencer le dépôt',
  demarcheCreerPilotesRequis: 'Au moins un pilote est requis',
  demarcheDetailDocumentsTitre: 'Ajouter les documents attendus',
  /** Même écran à l'aval, mais il y montre d'abord les avis reçus. */
  demarcheDetailAvisEtDocumentsTitre: 'Avis reçus et documents attendus',
  demarcheDetailDocumentsDescription: 'Déposer les pièces usuelles attendues.',
  /** Après la clôture de l'instruction : les avis sont là, le dossier se finalise. */
  demarcheDetailDocumentsAvalDescription:
    'Consultez les avis reçus et déposez ou mettez à jour les pièces réglementaires du dossier.',
  demarcheDocumentsAucunAvisTitre: 'Aucun avis reçu',
  demarcheDocumentsAucunAvisDescription:
    'Les instances consultatives n’ont rendu aucun avis sur cette plateforme. Elles ont pu le faire par un autre canal, ou le délai a pu s’écouler sans réponse.',
  demarcheDetailPublieeTitre: 'Démarche publiée',
  demarcheDetailPublieeDescription:
    'Le dossier est adopté : il passe en lecture seule. Les actions et les indicateurs du plan restent modifiables pendant sa mise en œuvre.',
  demarcheContactsTitre: 'Contacts',
  demarcheContactsDescription:
    'Interlocuteurs désignés pour le suivi de votre démarche.',
  demarcheMenuTitre: 'Actions',
  demarcheContactDreal: 'Contacts DREAL',
  demarcheContactCr: 'Contacts Conseil régional',
  demarcheContactDrealSituation:
    'Dépôt réglementaire, vérification de conformité et suivi administratif de votre PCAET.',
  demarcheContactCrSituation:
    'Avis du conseil régional et questions liées à la politique climat-air-énergie régionale.',
  demarcheAvanceTitre: 'Les étapes de votre démarche',
  demarcheAvancePanneauBouton: 'Étapes',
  demarcheAvanceSectionDocumentsDescription:
    'Déposez les pièces usuelles du dossier (ou un PCAET global).',
  demarcheAvanceSectionDocumentsAvalDescription:
    'Déposez les pièces usuelles du dossier attendues après les avis.',
  demarcheAvanceSectionDiagnosticDescription: ({
    type,
  }: {
    type: DemarcheTypeLabels;
  }) => `Renseignez les indicateurs et objectifs par volet ${type.complement}.`,
  demarcheAvanceSectionPlanDescription:
    "Rattachez ou créez un plan d'actions dans la plateforme.",
  // Les deux rappels de la finalisation. Ces libellés servent à la fois la
  // sous-étape du stepper et le titre de l'écran qu'elle ouvre : c'est le même
  // rappel, il ne doit pas changer de nom en cours de route.
  demarcheAvanceRappelDiagnosticLabel: 'Rappel du diagnostic et des objectifs',
  demarcheAvanceRappelDiagnosticDescription:
    'Relisez le diagnostic et les objectifs tels qu’ils ont été transmis.',
  demarcheAvanceRappelPlanLabel: ({ type }: { type: DemarcheTypeLabels }) =>
    `Rappel du programme d’actions ${type.nom}`,
  demarcheAvanceRappelPlanDescription:
    'Relisez le programme d’actions rattaché à la démarche.',
  demarcheRappelPlanAucun:
    'Aucun programme d’actions n’est rattaché à cette démarche.',
  demarcheRappelPlanErreur: 'Le programme d’actions n’a pas pu être chargé.',
  demarcheAvanceEtapeCreationLabel: 'Démarrage de la démarche de dépôt',
  demarcheAvanceEtapeCreationDescription: ({
    type,
  }: {
    type: DemarcheTypeLabels;
  }) =>
    `Renseignez l'intitulé, les pilotes et la date de lancement pour lancer le dépôt de ${type.possessif}.`,
  demarcheAvanceEtapeElaborationLabel: 'Élaboration',
  demarcheAvanceEtapeElaborationDescription:
    "Dépôt du diagnostic, des objectifs, du programme d’actions et des pièces jointes par la collectivité, jusqu'à la transmission pour avis.",
  demarcheAvanceEtapeTransmisLabel: 'Transmis pour avis',
  demarcheAvanceEtapeTransmisDescription:
    'Consultations auprès du conseil régional, du préfet de région et de la MRAe.',
  demarcheAvanceEtapeTransmisInfo:
    'Ces services déconcentrés vont rendre leurs avis directement sur cette plateforme ou hors plateforme (par exemple par email…), dans un délai de 3 mois',
  demarcheAvanceEtapeFinalisationLabel: 'Finalisation de la démarche de dépôt',
  demarcheAvanceEtapeFinalisationDescription:
    'Consultez les avis rendus, déposez le mémoire de réponse et la délibération d’adoption, puis publiez votre démarche.',
  demarcheAvanceEtapeFinalisationHorsPlateformeDescription:
    'Renseignez les documents, les volets du diagnostic et le plan d’actions, déposez la délibération d’adoption, puis publiez votre démarche.',
  demarcheAvanceEtapePublieLabel: 'Adopté, publié et en cours de mise en œuvre',
  demarcheAvanceEtapePublieDescription: ({
    type,
  }: {
    type: DemarcheTypeLabels;
  }) =>
    `${type.nom} en vigueur et mis à disposition du public, pilotage des actions et indicateurs associés sur 6 ans. Un bilan à mi-parcours et l’évaluation finale pourront être déposés sur la plateforme.`,
  demarcheAvanceEtapeArchiveLabel: 'Archivé',
  demarcheAvanceEtapeArchiveDescription:
    'Évaluation finale déposée, cycle clos.',
  demarcheAvanceNouvelleDemarche: 'Nouvelle démarche',
  demarcheAvanceValiderDepot: 'Valider le dépôt pour avis',
  demarcheTransmettreConfirmationTitre:
    'Votre dossier va être transmis pour avis',
  demarcheTransmettreConfirmationProcessus: ({ mois }: { mois: number }) =>
    `Votre dossier sera transmis aux instances consultatives, qui disposent de ${mois} mois pour rendre leurs avis. Il sera figé pendant toute la durée de l'instruction : vous ne pourrez plus modifier le diagnostic ni les pièces déposées, jusqu'à la fin de celle-ci.`,
  demarcheTransmettreConfirmationSuite:
    "Vous reprendrez la main à l'étape suivante, pour déposer les pièces attendues après les avis et adopter votre PCAET.",
  demarchePublierConfirmationTitre: 'Valider le dépôt final',
  demarchePublierConfirmationProcessus: ({
    type,
  }: {
    type: DemarcheTypeLabels;
  }) =>
    `Une fois validé, ${type.complement.replace(
      'du ',
      'le '
    )} sera automatiquement publié et consultable par le grand public sur la plateforme. Cette action ne peut pas être annulée après coup.`,
  demarchePublierDateAdoption: 'Date d’adoption *',
  demarchePublierDateAdoptionAide: ({
    type,
    ans,
  }: {
    type: DemarcheTypeLabels;
    ans: number;
  }) =>
    `Cette date sert de référence pour le suivi de la validité de ${type.possessif}, qui doit être renouvelé tous les ${ans} ans.`,
  demarchePublierDateAdoptionRequise: 'Renseignez la date d’adoption.',
  demarchePublierDateAdoptionFuture:
    'La date d’adoption ne peut pas être dans le futur.',
  demarchePublierConfirmer: 'Valider et publier',
  /**
   * Ce qui retient une transition, un message par guard du workflow : le
   * serveur dit lequel bloque, le front le traduit.
   */
  demarcheTransitionBlocage: {
    estPilote: 'Seul un pilote de la démarche peut réaliser cette action.',
    dossierComplet:
      'Complétez les documents, le diagnostic et le programme d’actions pour valider le dépôt.',
    avisTousRendus:
      'Les instances consultatives n’ont pas encore rendu tous leurs avis.',
    delaiAvisEcoule:
      'Le délai légal de remise des avis n’est pas encore écoulé.',
    evaluationFinaleDeposee:
      'Déposez l’évaluation finale pour archiver la démarche.',
    documentsAvalComplets:
      'Complétez les pièces attendues après les avis (délibération d’adoption…) pour publier votre démarche.',
  } satisfies Record<DemarchePcaetGuardId, string>,
  demarcheAvanceTransmisEcheance: 'Échéance remise des avis :',
  demarcheAvanceTransmisDepasse: 'Délai dépassé',
  demarcheStepsNavPrevious: 'Étape précédente',
  demarcheStepsNavNext: 'Étape suivante',
  /** Étiquette du `<nav>` de la barre d'étapes, lue par les lecteurs d'écran. */
  demarcheStepsNavAriaLabel: 'Navigation entre les étapes du dépôt',
  /**
   */
  demarcheVulnerabiliteThematiques: 'Thématiques',
  demarcheVulnerabiliteDiagMaintenant: 'Vulnérabilité actuelle',
  demarcheVulnerabiliteDiag2050: 'Vulnérabilité 2050',
  demarcheVulnerabiliteDiag2100: 'Vulnérabilité 2100',
  demarcheVulnerabiliteObjectifs2050: 'Objectifs 2050',
  demarcheVulnerabiliteObjectifs2100: 'Objectifs 2100',
  /** Aide affichée en infobulle sur les deux colonnes d'objectifs. */
  demarcheVulnerabiliteObjectifsAide:
    'Ex. : « Réduire de 25 % la consommation d’eau potable en période de tension ». Une phrase concrète, si possible mesurable.',
  demarcheVulnerabiliteObjectifs: 'Saisir vos objectifs',
  /** Affordance des cellules de niveau vides, atténuée au repos. */
  demarcheVulnerabiliteAjouterNiveau: '+ niveau',
  demarcheVulnerabiliteNiveauNonRenseigne: 'non renseigné',
  demarcheVulnerabiliteTableauAriaLabel:
    'Niveaux de vulnérabilité du territoire par thématique',
  /** Nom accessible d'une cellule de niveau : sans lui, 48 cellules homonymes. */
  demarcheVulnerabiliteCelluleNiveau: ({
    thematique,
    horizon,
    niveau,
  }: {
    thematique: string;
    horizon: string;
    niveau: string;
  }) => `${thematique}, ${horizon} : ${niveau}`,
  demarcheVulnerabiliteCelluleObjectifs: ({
    thematique,
    horizon,
    renseigne,
  }: {
    thematique: string;
    horizon: string;
    renseigne: boolean;
  }) =>
    `${thematique}, objectifs ${horizon} : ${
      renseigne ? 'renseignés' : 'non renseignés'
    }`,
  demarcheVulnerabiliteCelluleThematique: ({ label }: { label: string }) =>
    `Renommer la thématique ${label}`,
  demarcheVulnerabiliteAjouterThematique: 'Ajouter une thématique',
  demarcheVulnerabiliteNomThematique: 'Nom de la thématique',
  demarcheVulnerabiliteThematiqueSupprime: 'Thématique supprimée',
  demarcheVulnerabiliteSupprimerThematique: 'Supprimer cette thématique',
  demarcheVulnerabiliteSupprimerThematiqueNomme: ({
    label,
  }: {
    label: string;
  }) => `Supprimer la thématique ${label}`,
  demarcheVulnerabiliteSupprimerThematiqueTitre: 'Retirer cette thématique ?',
  demarcheVulnerabiliteSupprimerThematiqueDescription: ({
    label,
  }: {
    label: string;
  }) =>
    `« ${label} » sera retirée de cette démarche, avec les niveaux et objectifs qui y ont été saisis. Les autres démarches de la collectivité la conservent.`,
  demarcheVulnerabiliteSupprimerThematiqueConfirmer: 'Retirer',
  demarcheVulnerabiliteThematiqueDejaExistant:
    'Une thématique porte déjà ce nom dans cette démarche',
  demarcheVulnerabiliteDescription:
    'Évaluez le niveau de vulnérabilité du territoire pour chaque thématique, aux horizons actuel, 2050 et 2100, puis décrivez les objectifs associés.',
  demarcheDiagnosticTitre: 'Compléter le diagnostic et les objectifs',
  demarcheDiagnosticDescription:
    'Consultez et complétez les indicateurs par volet du PCAET : tableau des valeurs, données par secteur et graphique.',
  /** Complétude d'une étape du dépôt, rendue par `DemarcheCompletionBadge`. */
  demarcheCompletionComplete: 'Complété',
  demarcheCompletionAComplete: 'À compléter',
  demarcheCompletionOptionnel: 'Optionnel',
  demarcheDiagnosticErreurChargement: 'Impossible de charger le diagnostic',
  demarcheDocumentsBadgeObligatoire: 'Obligatoire',
  demarcheDocumentsBadgeOptionnel: 'Optionnel',
  demarcheDocumentsRemplacerDocument: 'Remplacer le document',
  /** Reprise d'une pièce transmise : on met à jour, on ne remplace pas. */
  demarcheDocumentsMettreAJourDocument: 'Mettre à jour',
  demarcheDocumentsTelechargerVersionOriginale:
    'Télécharger la version originale',
  demarcheDocumentsTeleverser: 'Déposer un document',
  demarcheDocumentsCouvertPar: ({ nom }: { nom: string }) =>
    `Couvert par « ${nom} »`,
  demarcheDocumentsInclusDans: ({ nom }: { nom: string }) =>
    `Inclus dans « ${nom} »`,
  demarcheDocumentsCaption: ({
    type,
    etape,
  }: {
    type: DemarcheTypeLabels;
    etape: DemarcheDocumentEtape;
  }) =>
    etape === 'amont'
      ? `Dépôt des pièces du dossier ${type.nom}`
      : `Dépôt des pièces du dossier ${type.nom} attendues après les avis`,
  demarcheDocumentsColonneNom: 'Nom du document',
  demarcheDocumentsColonneType: 'Type',
  demarcheDocumentsColonneDocuments: 'Documents liés',
  demarcheDocumentsSupprimerDocument: 'Supprimer le document',
  demarcheDocumentsModaleTitre: ({ type }: { type: DemarcheTypeLabels }) =>
    `Déposer un document du dossier ${type.nom}`,
  demarcheDocumentsErreurChargement: ({ type }: { type: DemarcheTypeLabels }) =>
    `Impossible de charger les pièces du dossier ${type.nom}`,
  demarcheDocumentsDeposeSucces: 'Document déposé',
  demarcheDocumentsDeposeErreur: 'Échec du dépôt du document',
  demarcheDocumentsSuppressionSucces: 'Document supprimé',
  demarcheDocumentsSuppressionErreur: 'Échec de la suppression du document',
  demarcheDocumentsCouvertureSucces: 'Couverture de la pièce mise à jour',
  demarcheDocumentsCouvertureErreur:
    'Échec de la mise à jour de la couverture de la pièce',
  demarcheDocumentsAdditionalAjouter: 'Ajouter un document',
  demarcheDocumentsAdditionalTitreLabel: 'Titre du document',
  demarcheDocumentsAdditionalTitrePlaceholder:
    'Ex : étude acoustique du territoire',
  demarcheDocumentsAdditionalSaisirNom: 'Saisissez un nom pour ce document',
  demarcheDocumentsAdditionalRenommer: 'Renommer le document',
  demarcheDocumentsAdditionalSupprimer: 'Supprimer le document',
  demarcheDocumentsAdditionalCreationErreur: 'Échec de l’ajout du document',
  demarcheDocumentsAdditionalTitreErreur: 'Échec de l’enregistrement du titre',
  demarcheDocumentsAdditionalSuppressionSucces: 'Document retiré du dossier',
  demarcheDocumentsAdditionalSuppressionErreur: 'Échec du retrait du document',
  demarcheProgrammeTitre: 'Renseigner le programme d’actions',
  demarcheProgrammeChargement:
    'Chargement des plans existants dans la plateforme…',
  demarcheProgrammeNoPlanIntro: ({
    typeLabel,
  }: {
    typeLabel: string;
  }): string =>
    `Aucun plan de type « ${typeLabel} » trouvé pour cette collectivité.`,
  demarcheProgrammeRattachementIntro: ({
    type,
  }: {
    type: DemarcheTypeLabels;
  }) =>
    `Lier votre programme d’actions à un plan ${type.nom} existant de votre collectivité dans la plateforme, ou créez-en un nouveau.`,
  demarcheProgrammeDetacher: 'Détacher',
  demarcheProgrammeLectureSeule:
    'La démarche n’est plus en élaboration : le programme d’actions n’est plus modifiable.',
  demarcheProgrammePlanParDefaut: ({ id }: { id: number }): string =>
    `Plan #${id}`,
  demarcheProgrammeLierCePlan: 'Lier ce plan',
  demarcheProgrammePlanDejaRattache: ({ titre }: { titre: string }): string =>
    `Déjà rattaché à la démarche « ${titre} »`,
  demarchePlanCree: 'Plan d’action créé',
  demarchePlanCreationErreur: 'Échec de la création du plan',
  demarcheProgrammeCreerPlan: 'Créer un plan',
  demarcheProgrammeImporterPlan: 'Importer un plan',
  demarcheProgrammeColonneNom: 'Nom du plan',
  demarcheProgrammeColonneNombreActions: 'Nombre d’actions',
  demarcheProgrammeNombreActions: plural({
    zero: 'Aucune action',
    one: 'action',
    other: 'actions',
  }),
  demarcheProgrammeCreerNouveauPlanFromZero: 'Créer un plan à partir de zéro',
  demarcheHeaderDateLancement: 'Date de lancement',
  demarcheHeaderDemarcheCreatedAt: 'Créé le',
  demarcheHeaderModifieLe: 'Modifié le',
  demarcheObligationObligatoire: 'Obligatoire',
  demarcheObligationVolontaire: 'Volontaire',
  demarcheBadgePubliee: 'Publiée',
  demarcheHeaderPiloteSingulier: 'Pilote',
  demarcheHeaderPilotePluriel: 'Pilotes',
  demarchePilotesTooltip:
    'Ces personnes recevront les notifications mails liées à la démarche',
  demarcheListeTitre: ({ type }: { type: DemarcheTypeLabels }) =>
    `Démarches ${type.nom}`,
  demarcheListeCommencerDepot: 'Commencer un dépôt',
  demarcheListeCreationBloquee: ({ type }: { type: DemarcheTypeLabels }) =>
    `Une démarche est déjà en cours — un nouveau dépôt sera possible une fois ${type.complement.replace(
      'du ',
      'le '
    )} adopté ou archivé`,
  demarcheListeVideTitre: ({ type }: { type: DemarcheTypeLabels }) =>
    `Aucune démarche ${type.nom}`,
  demarcheListeVideDescription: ({ type }: { type: DemarcheTypeLabels }) =>
    `Commencez le dépôt réglementaire de ${type.possessif} pour suivre ses étapes dans la plateforme.`,
  demarcheListeColonneTitre: 'Titre',
  demarcheListeColonnePilotes: 'Pilotes',
  demarcheListeColonneStatut: 'Statut',
  demarcheListeColonneCreation: 'Créée le',
  demarcheListeColonneLancement: 'Date de lancement',
  demarcheListeColonneModification: 'Modifiée le',
  demarcheListeActionsMenu: 'Actions sur la démarche',
  demarcheActionContinuerSaisie: 'Continuer la saisie',
  demarcheActionConsulter: 'Consulter',
  demarcheActionSupprimer: 'Supprimer',
  demarcheSupprimerModaleTitre: 'Supprimer la démarche',
  demarcheSupprimerModaleDescription: ({ titre }: { titre: string }) =>
    `La démarche « ${titre} » et l’ensemble de sa saisie seront définitivement supprimés.`,
  demarcheTransitionArchiver: 'Archiver',
  demarcheTransitionPublier: 'Valider le dépôt final',
  erreurAccesTitre: 'Accès non autorisé',
  erreurAccesMessage: 'Vous n’avez pas accès à cette page.',
  retourTableauDeBord: 'Retour au tableau de bord',
  retourPagePrecedente: 'Revenir à la page précédente',
  instructionBonjour: ({ prenom }: { prenom: string }) => `Bonjour ${prenom} !`,
  /**
   * Sans variante de lecture : les compteurs ne s'affichent qu'aux services qui
   * déposent un avis — la DREAL et le conseil régional. La DDT, la DR ADEME et
   * les services nationaux reçoivent le dossier en lecture : ils n'ont pas de
   * charge à mesurer, et un délai moyen d'instruction qu'ils ne mènent pas ne
   * dirait rien d'eux. Le titre de la liste, lui, suit toujours la famille.
   */
  instructionStatATraiter: 'PCAET à instruire',
  instructionStatInstruits: plural({
    one: 'PCAET instruit',
    other: 'PCAET instruits',
  }),
  instructionStatDelaiMoyen: plural({
    one: 'jour de délais moyens d’instruction',
    other: 'jours de délais moyens d’instruction',
  }),
  /** Au-delà du plafond, la valeur affichée n'est plus la moyenne exacte. */
  instructionStatDelaiMoyenPlafonne: ({ plafond }: { plafond: number }) =>
    `jours ou plus de délais moyens d’instruction (plafond à ${plafond})`,
  instructionStatDelaiMoyenAucun: 'Aucune instruction encore achevée',
  instructionListeTitre: ({ deposeAvis }: { deposeAvis: boolean }) =>
    deposeAvis
      ? 'Instructions dont je suis en charge'
      : 'Dépôts PCAET que je suis',
  /**
   * Sans territoire : l'écran sert les cinq familles d'instructeurs, dont les
   * périmètres diffèrent — région pour une DREAL ou un conseil régional,
   * département pour une DDT, aucun pour un service national comme la DGEC. Ne
   * pas y réintroduire « de votre région ». Et « transmis » plutôt que
   * « à instruire » : seules la DREAL et la région déposent un avis, les autres
   * reçoivent le dossier en lecture.
   *
   * Suit la même famille que le titre juste au-dessus : annoncer des dépôts
   * « transmis » à une DREAL, qui en est l'instructrice, décrirait le travail
   * d'un autre.
   */
  instructionListeVide: ({ deposeAvis }: { deposeAvis: boolean }) =>
    deposeAvis
      ? 'Les instructions dont vous avez la charge apparaîtront ici.'
      : 'Les dépôts PCAET qui vous sont transmis apparaîtront ici.',
  /**
   * Nom accessible du tableau : il suit la même famille que le titre visible
   * juste au-dessus, sinon un lecteur d'écran annonce à une DREAL la formulation
   * réservée aux destinataires en lecture.
   */
  instructionListeIntitule: ({ deposeAvis }: { deposeAvis: boolean }) =>
    deposeAvis
      ? 'Instructions dont je suis en charge'
      : 'Dépôts PCAET qui vous sont transmis',
  instructionListeColonneCollectivite: 'Collectivité',
  /**
   * « Pilotes » et non « Contact » : les personnes affichées sont celles qui
   * portent le PCAET dans la collectivité — ses administratrices sur la
   * plateforme —, pas une adresse de contact générique. Au pluriel, parce
   * qu'une collectivité peut en compter plusieurs.
   */
  instructionListeColonnePilotes: 'Pilotes',
  instructionListeColonneStatut: 'Statut',
  instructionListeColonneEcheance: 'Échéance avis',
  instructionListeColonneActions: 'Actions',
  instructionListeConsulter: 'Consulter le PCAET',
  instructionListeVoirInstruction: 'Voir l’instruction',
  instructionListeSansPilote: 'Aucun pilote renseigné',
  instructionEtatATraiter: 'À instruire',
  /**
   * Le même état, dit à un destinataire en lecture : « À instruire » lui
   * demanderait un travail qu'il n'a pas à faire — une DDT, une DR ADEME et un
   * service national ne déposent aucun avis, ils suivent le dossier.
   */
  instructionEtatInstructionEnCours: 'Instruction en cours',
  instructionEtatBrouillonEnCours: 'Brouillon en cours',
  instructionEtatAvisRendu: 'Instruit',
  instructionEtatDelaiEcoule: 'Pas d’avis déposé',
  instructionEtatClos: 'Archivé',
  instructionDossierMetaCollectivite: 'Collectivité',
  instructionDossierMetaTransmis: 'Transmis le',
  instructionDossierMetaEcheance: 'Échéance des avis',
  instructionDossierMetaInstruitLe: 'Instruit le',
  instructionDossierMetaEcheanceDepassee: ({ date }: { date: string }) =>
    `${date} (délai écoulé)`,
  instructionDossierEtapesTitre: 'Les étapes de l’instruction',
  instructionDossierPanneauBouton: 'Étapes',
  instructionDossierEtapeDocuments: 'Documents déposés',
  instructionDossierEtapeDocumentsDescription:
    'Consultez les pièces déposées par la collectivité pour ce dépôt de PCAET.',
  instructionDossierEtapeDiagnostic: 'Diagnostic',
  instructionDossierEtapeDiagnosticDescription:
    'Consultez les indicateurs par volet du PCAET : tableau des valeurs et données par secteur.',
  instructionDossierEtapePlan: 'Programme d’actions',
  instructionDossierEtapePlanDescription:
    'Consultez le programme d’actions rattaché à ce PCAET.',
  instructionDossierPlanAucun:
    'Aucun programme d’actions n’est rattaché à ce dossier.',
  demarchePlanContenuPlanSansNom: 'Plan sans nom',
  /**
   * Nom du plan et son décompte sur une seule ligne : le `subtitle` de
   * l'accordéon passerait à la ligne (son `line-clamp-1` en fait un bloc), ce
   * qui désalignerait la flèche du titre.
   */
  demarchePlanContenuPlanTitre: ({
    nom,
    actions,
  }: {
    nom: string;
    actions: string;
  }) => `${nom} · ${actions}`,
  demarchePlanContenuAxeSansNom: 'Axe sans nom',
  demarchePlanContenuFicheSansTitre: 'Action sans titre',
  demarchePlanContenuPlanVide:
    'Ce plan ne contient encore aucun axe ni aucune action.',
  demarchePlanContenuAxeVide: 'Aucune action dans cet axe.',
  instructionDossierInstruitLe: ({ date }: { date: string }) =>
    `Instruit le ${date}`,
  instructionDossierAvisTelecharger: 'Rapport',
  instructionDossierAvisTelechargerAria: ({ titre }: { titre: string }) =>
    `Télécharger le rapport de l’avis au titre de ${titre}`,
  /**
   * « Rendus » et non « reçus » : la liste mêle les avis des autres
   * destinataires et, pour une DREAL ou un conseil régional, les siens — qu'il
   * a rendus, pas reçus.
   */
  instructionDossierAvisRendusTitre: 'Avis rendus sur ce dossier',
  instructionDossierAvisRenduLe: ({ date }: { date: string }) =>
    `Avis rendu le ${date}`,
  instructionDossierAvisBrouillonDepuis: ({ date }: { date: string }) =>
    `Brouillon déposé le ${date}`,
  instructionFinaliserBouton: 'Finaliser l’instruction du PCAET',
  instructionFinaliserAvisDejaDepose:
    'L’avis a déjà été déposé : il n’y a plus rien à finaliser.',
  instructionFinaliserVerrouille:
    'La fenêtre d’avis est fermée : l’instruction ne peut plus être finalisée.',
  instructionFinaliserTitre: 'Finaliser l’instruction',
  instructionFinaliserAjouterRapport: 'Ajouter le rapport d’instruction',
  /**
   * Ce que l'instructeur doit savoir de la portée de son acte : la
   * réglementation n'oblige pas la collectivité à suivre l'avis rendu.
   */
  instructionFinaliserAvisConsultatif:
    'Cet avis est consultatif : la collectivité n’est pas tenue de le prendre en compte et peut adopter son PCAET sans le suivre.',
  instructionFinaliserAvertissement:
    'Attention, une fois finalisée, l’instruction ne pourra plus être modifiée ou annulée !',
  instructionFinaliserValider: 'Valider',
  instructionFinaliserRetirerFichier: 'Retirer le fichier',
  instructionFinaliserFichierRefuse:
    'Le fichier doit être un PDF de 20 Mo maximum.',
  instructionFinaliserErreur: 'Le dépôt de l’avis a échoué',
  instructionFinaliseeTitre: 'Le pilote du PCAET va être notifié !',
  instructionFinaliseeBravo:
    'Bravo, vous venez de finaliser votre instruction.',
  instructionFinaliseeNotification:
    'Le pilote du PCAET va être notifié automatiquement par la plateforme.',
  instructionFinaliseeFermer: 'Fermer',
  demarchePcaetAvisAuTitreDeLabels: {
    prefet_region: 'Préfet de région',
    president_region: 'Président de région',
  },
  pcaetDiagnosticAnneeReferenceBasculee:
    'Année de référence mise à jour, les valeurs saisies ont suivi.',
  pcaetDiagnosticAnneeReferenceEchec:
    "L'année de référence n'a pas pu être modifiée.",
};
