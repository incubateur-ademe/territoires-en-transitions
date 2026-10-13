import type { DemarchePcaetStatus } from '@tet/domain/demarches';
import { plural } from '@tet/ui/labels/plural';

const toDate = (date: string | null) =>
  date ? new Date(date).toLocaleDateString('fr-FR') : 'date inconnue';

const motifs: Record<string, string> = {
  doublon:
    'copie « définitif » d’un dossier déposé : son contenu rejoint le dossier « mise en œuvre »',
  coquille_vide:
    'dossier vide : ni fichier, ni diagnostic, ni action, ni vulnérabilité',
  sans_etat_invisible: 'dossier sans état, jamais visible sur la vitrine',
  elaboration_doublon: 'dossier en élaboration, doublon d’un PCAET déjà adopté',
  elaboration_remplacee:
    'deuxième dossier en élaboration de la collectivité : on garde le plus récent',
  dossier_de_test: 'dossier de test',
  vitrine: 'exemple de la vitrine de T&C, sans dossier',
  orphelin: 'rattaché à une ligne qui n’existe pas dans T&C',
  historique_non_repris: 'historique des modifications : non repris',
  sans_place: 'pas de place dans TeT',
  commentaire_sans_place:
    'commentaire d’onglet : TeT ne commente qu’une valeur',
  elu_referent_texte_libre:
    'élu référent tapé à la main : texte libre, aucun pilote n’en est tiré',
  total_melange:
    'totaux mélangés avec un autre dossier de la collectivité à la même date',
  valeur_vide: 'case vide dans T&C',
  sans_indicateur_cible:
    'aucune ligne pour la recevoir dans TeT (filière sans ligne, potentiel, consommation EnR)',
  objectif_sans_colonne: 'objectif 2021 ou 2026 : TeT n’a pas ces colonnes',
  constat_sans_annee: 'valeur sans année, ou à une année impossible',
  valeur_sans_periode: 'valeur sans période',
  total_recalcule: 'total de polluant déclaré, remplacé par le calcul de TeT',
  avis_sans_transmission:
    'avis d’un dossier jamais transmis : pas d’avis dans TeT',
  avis_sans_fichier: 'aucun fichier de l’avis dans l’archive de T&C',
  avis_sans_pdf: 'avis sans PDF',
  avis_sans_courrier: 'plusieurs PDF, aucun courrier signé',
  avis_anterieur:
    'avis antérieur de plus d’un an à la transmission (PCAET précédent)',
  lien_invalide: 'adresse de site web refusée',
  contact_instructeur:
    'contact DREAL, Région ou ADEME : TeT désigne le service, pas la personne',
  sans_role_repris: 'utilisateur sans rôle sur un dossier repris',
  service_de_tet: 'organisation régionale de T&C : TeT a ses propres services',
  libelle_non_normalise: 'libellé de domaine non reconnu',
  oui_sans_niveau: '« Oui » sans niveau : TeT n’a pas de niveau « concerné »',
  niveau_non_intelligible: 'texte sans mot de niveau',
  non_masque_par_oui: '« Non » effacé par un « Oui » de la même thématique',
  niveau_masque:
    'niveau plus bas qu’un autre domaine de la même thématique : le plus haut est gardé',
  non_concerne_hors_socle:
    '« Non » sous Déchets : pas de thématique pour un « non concerné »',
  objectif_oui_non: '« Oui » ou « Non » à la place d’un objectif',
  texte_sans_place: 'texte après le mot de niveau, non repris',
};

const motifsCourts: Record<string, string> = {
  doublon: 'Copie « définitif » d’un dossier déposé',
  coquille_vide: 'Dossier vide',
  elaboration_doublon: 'En élaboration, doublon d’un PCAET adopté',
  sans_etat_invisible: 'Sans état, jamais visible sur la vitrine',
  elaboration_remplacee: 'Deuxième dossier en élaboration',
  dossier_de_test: 'Dossier de test',
};

const precisions: Record<string, string> = {
  population_couverte: 'population couverte',
  commentaire_statut: 'commentaire de statut',
  commentaire_ges_et_conso: 'commentaire GES et consommation',
  commentaire_polluants: 'commentaire polluants',
  commentaire_enr: 'commentaire énergies renouvelables',
  commentaire_sequestration: 'commentaire séquestration',
  commentaire_vulnerabilite: 'commentaire vulnérabilité',
  elu_referent: 'élu référent',
  fiche_action_associee: 'fiche associée',
  vulnerable: 'niveau',
  objectif_fixe: 'objectif',
  url_site_web: 'site web',
  consommation: 'consommation d’énergies renouvelables',
  avis: 'avis',
};

const etatsTec: Record<string, string> = {
  mise_en_oeuvre: 'Mise en œuvre',
  definitif: 'Définitif',
  depot_pour_avis: 'Dépôt pour avis',
  en_cours_elaboration: 'En cours d’élaboration',
};

const statutsTet: Record<DemarchePcaetStatus, string> = {
  en_elaboration: 'En élaboration',
  transmis_pour_avis: 'Transmis pour avis',
  instruit: 'Instruit',
  instruit_hors_plateforme: 'Instruit hors plateforme',
  publie: 'Publié',
  archive: 'Archivé',
};

const tablesSource: Record<string, string> = {
  demarche: 'Dossier',
  demarche_fichier: 'Documents',
  demarche_utilisateur: 'Personnes',
  demarche_historique: 'Historique du dossier',
  demarche_domaine_vulnerabilite: 'Vulnérabilité',
  demarche_emission_ges: 'Diagnostic : émissions de GES',
  demarche_consommation: 'Diagnostic : consommations',
  demarche_polluants: 'Diagnostic : polluants',
  demarche_polluant_total: 'Diagnostic : total des polluants',
  demarche_enr: 'Diagnostic : énergies renouvelables',
  demarche_enr_prod_et_conso: 'Diagnostic : production et consommation d’EnR',
  demarche_enr_reseaux: 'Diagnostic : réseaux de chaleur',
  demarche_sequestration_estimation: 'Diagnostic : séquestration estimée',
  demarche_sequestration_potentiel: 'Diagnostic : potentiel de séquestration',
  demarche_sequestration_production: 'Diagnostic : production de biomasse',
  demarche_sequestration_renforcement:
    'Diagnostic : renforcement de la séquestration',
  action: 'Actions',
  action_cible: 'Actions : cibles',
  action_collectivite: 'Actions : collectivités',
  action_contact: 'Actions : contacts',
  action_fichier: 'Actions : fichiers',
  action_historique: 'Actions : historique',
  action_image: 'Actions : images',
  action_secteur: 'Actions : secteurs',
  action_secteur_autre: 'Actions : autres secteurs',
  action_type_action: 'Actions : types d’action',
  action_type_porteur: 'Actions : types de porteur',
  action_type_porteur_autre: 'Actions : autres porteurs',
  action_volet: 'Actions : volets',
};

export const repriseTecLabels = {
  repriseTec: 'Reprise T&C',
  repriseTecDescription:
    'Vérifier, collectivité par collectivité, ce que la reprise de Territoires & Climat a amené dans TeT',
  repriseTecSousTitre:
    'Les collectivités porteuses d’un dossier PCAET dans Territoires & Climat',
  repriseTecRechercher: 'Nom, SIREN, ID TeT ou n° T&C',
  repriseTecColonneCollectiviteTec: 'Collectivité T&C',
  repriseTecColonneCollectiviteTet: 'Collectivité TeT',
  repriseTecColonneSiren: 'SIREN',
  repriseTecColonneTerritoire: 'Territoire',
  repriseTecColonnePopulation: 'Habitants',
  repriseTecIdTec: (id: number) => `n° T&C ${id}`,
  repriseTecIdTet: (id: number) => `ID TeT ${id}`,
  repriseTecIntrouvableDansTet: 'Introuvable dans TeT',
  repriseTecAucunResultat: 'Aucune collectivité ne correspond à la recherche',
  repriseTecNombreCollectivites: plural({
    zero: 'Aucune collectivité',
    one: 'collectivité',
    other: 'collectivités',
  }),
  repriseTecRecetteNonConstruite: 'La recette n’est pas encore construite',
  repriseTecRecetteNonConstruiteDescription:
    'Lancer l’étape « construire-recette » du script de reprise sur cette base, puis recharger la page.',

  repriseTecCollectiviteIntrouvable:
    'Cette collectivité ne porte aucun dossier de Territoires & Climat',
  repriseTecSiren: (siren: string) => `SIREN ${siren}`,
  repriseTecHabitants: (population: number) =>
    `${population.toLocaleString('fr-FR')} habitants`,
  repriseTecCollectiviteTec: (nom: string, id: number) =>
    `Dans T&C : ${nom} (n° T&C ${id})`,
  repriseTecOngletDossier: (tecDossierId: number, demarcheId: number | null) =>
    demarcheId === null
      ? `T&C-${tecDossierId}`
      : `TET-${demarcheId} | T&C-${tecDossierId}`,
  repriseTecAucunDossier: 'Aucun dossier dans T&C',
  repriseTecDemarcheTet: (id: number) => `Démarche ID TeT ${id}`,
  repriseTecDossierTec: (id: number) => `Démarche n° T&C ${id}`,
  repriseTecPasDePageDansTet: 'Pas de page dans TeT',
  repriseTecOuvrirDemarche: 'Ouvrir la démarche dans TeT',
  repriseTecEtatTec: (etat: string | null) =>
    etat ? etatsTec[etat] ?? etat : 'Sans état',
  repriseTecEtatTecTitre: 'État dans T&C',
  repriseTecStatutTet: (statut: DemarchePcaetStatus) => statutsTet[statut],
  repriseTecStatutTetTitre: 'Statut d’arrivée dans TeT',
  repriseTecNonRepris: 'Non repris',
  repriseTecMotif: (motif: string) => motifs[motif] ?? motif,
  repriseTecMotifCourt: (motif: string) =>
    motifsCourts[motif] ?? motifs[motif] ?? motif,
  repriseTecPrecision: (precision: string) =>
    precisions[precision] ?? precision,
  repriseTecTableSource: (table: string) => tablesSource[table] ?? table,
  repriseTecSection: (numero: number) => `§${numero}`,
  repriseTecVoirRegle: (numero: number) => `Voir la règle §${numero}`,
  repriseTecLesRegles: 'Les règles de la reprise',

  repriseTecSpecificites: 'Spécificités',
  repriseTecSpecificitesSousTitre:
    'Les règles particulières appliquées à ce dossier',
  repriseTecAucuneSpecificite: 'Aucune règle particulière pour ce dossier.',
  repriseTecJournalEcarts: 'Journal des écarts',
  repriseTecJournalEcartsSousTitre:
    'Les lignes de T&C qui ne sont pas arrivées dans TeT, et pourquoi',
  repriseTecAucunEcart: 'Aucune ligne de ce dossier n’a été écartée.',
  repriseTecColonneBloc: 'Bloc',
  repriseTecColonneMotif: 'Motif',
  repriseTecColonneNombre: 'Lignes',
  repriseTecColonneRegle: 'Règle',
  repriseTecNombreLignes: plural({ one: 'ligne', other: 'lignes' }),

  repriseTecSpecificiteAutreSiren: 'Retrouvée par un autre SIREN',
  repriseTecSpecificiteAutreSirenDetail: (sirenTec: string, sirenTet: string) =>
    `SIREN T&C ${sirenTec}, SIREN TeT ${sirenTet} : la structure a changé de SIREN depuis T&C.`,
  repriseTecSpecificiteCopieFondue: 'Copie « définitif » fondue',
  repriseTecSpecificiteCopieFondueDetail: (copieId: number) =>
    `Le dossier T&C-${copieId} rejoint ce dossier « mise en œuvre » : un seul dossier dans TeT.`,
  repriseTecSpecificiteSansEtat: 'Dossier sans état repris comme PCAET publié',
  repriseTecSpecificiteSansEtatDetail: 'Question ouverte au métier.',
  repriseTecSpecificiteElaborationPublie:
    'En élaboration dans T&C, publié d’après le suivi ADEME',
  repriseTecSpecificiteElaborationPublieDetail: (
    approbationLe: string | null,
    lanceLe: string | null
  ) =>
    `Le suivi ADEME le dit approuvé le ${toDate(
      approbationLe
    )}, après son lancement le ${toDate(lanceLe)}. Le suivi ADEME prime.`,
  repriseTecSpecificiteDepotInstruit: 'Dépôt pour avis arrivé instruit',
  repriseTecSpecificiteDepotInstruitDetail: (approbationLe: string | null) =>
    approbationLe
      ? `Approbation du suivi ADEME le ${toDate(
          approbationLe
        )}, antérieure au dossier : celle d’un PCAET précédent.`
      : 'Pas d’approbation au suivi ADEME : la collectivité doit déposer sa délibération et publier.',
  repriseTecSpecificiteAdoptionSuivi: 'Adoption à la date du suivi ADEME',
  repriseTecSpecificiteAdoptionSuiviDetail: (adopteLe: string | null) =>
    `${toDate(adopteLe)}, date du suivi ADEME, qui prime sur T&C.`,
  repriseTecSpecificiteAdoptionRepli:
    'Adoption à une date de T&C, faute de date au suivi',
  repriseTecSpecificiteAdoptionRepliDetail: (adopteLe: string | null) =>
    `Adopté le ${toDate(
      adopteLe
    )} : dépôt définitif ou dernière mise à jour dans T&C.`,
  repriseTecSpecificiteLancementCorrige: (saisi: string) =>
    `Date de lancement « ${saisi} » corrigée`,
  repriseTecSpecificiteLancementCorrigeDetail: (lanceLe: string | null) =>
    lanceLe
      ? `Lue ${lanceLe.slice(0, 4)} : faute de frappe dans T&C.`
      : 'Date impossible, ignorée.',
  repriseTecSpecificiteTransmissionRamenee:
    'Transmission ramenée avant l’avis de l’État',
  repriseTecSpecificiteTransmissionRameneeDetail: (
    transmisDansTec: string,
    avisEtatLe: string | null,
    transmisLe: string
  ) =>
    `T&C donnait le ${toDate(
      transmisDansTec
    )} ; l’avis de l’État du suivi ADEME est du ${toDate(
      avisEtatLe
    )} : transmission au ${toDate(transmisLe)}.`,
  repriseTecSpecificiteMelange: 'Totaux du diagnostic mélangés',
  repriseTecSpecificiteMelangeDetail:
    'Deux dossiers de la collectivité à la même date : TeT calcule leurs totaux ensemble.',
  repriseTecSpecificiteAucunService: 'Envoyé à aucun service',
  repriseTecSpecificiteAucunServiceDetail:
    'Un dossier en élaboration n’est saisi par personne.',

  repriseTecRecette: 'Recette de la reprise',
  repriseTecRegles: 'Les règles',
  repriseTecReglesSousTitre:
    'Où arrive mon dossier ? La reprise de Territoires & Climat dans Territoires en Transitions',
  repriseTecRegleResume: 'Résumé de « Où arrive mon dossier ? »',
  repriseTecTitreRegle: (numero: number, titre: string) =>
    `§${numero} ${titre}`,

  repriseTecTerritoire: 'Territoire',
  repriseTecFrance: 'France',
  repriseTecFranceEntiere: 'France entière',
  repriseTecSansRegion: 'Sans région',
  repriseTecSansDepartement: 'Sans département',
  repriseTecIntercommunalites: 'Intercommunalités',
  repriseTecAutresPorteurs: 'Autres porteurs',
  repriseTecGroupePetr: 'PETR et pays',
  repriseTecGroupeSyndicat: 'Syndicats',
  repriseTecGroupeCommune: 'Communes',
  repriseTecGroupeAutre: 'Départements et autres',
  repriseTecDepartementsDe: (region: string) => `Départements de ${region}`,
  repriseTecPorteursDe: (departement: string) => `Porteurs de ${departement}`,
  repriseTecMasquerPanneau: 'Masquer le panneau Territoire',
  repriseTecAfficherPanneau: 'Afficher le panneau Territoire',
  repriseTecTerritoireCourant: (lieu: string) => `Territoire · ${lieu}`,

  repriseTecChercher: 'Chercher',
  repriseTecRechercheGlobale:
    'Région, département, collectivité, SIREN, ID TeT ou n° T&C',
  repriseTecTypeRegion: 'Région',
  repriseTecTypeDepartement: 'Département',
  repriseTecTypeCollectivite: 'Collectivité',
  repriseTecTypeDossier: 'Dossier',
  repriseTecAucunResultatRecherche: 'Aucun résultat.',
  repriseTecDetailCollectivite: (siren: string | null, idTet: number | null) =>
    [`SIREN ${siren ?? 'aucun'}`, idTet === null ? null : `ID TeT ${idTet}`]
      .filter(Boolean)
      .join(' · '),

  repriseTecCollectiviteIdTet: 'Collectivité ID TeT',
  repriseTecCopierIdCollectivite: 'Copier l’ID TeT de la collectivité',
  repriseTecDemarcheIdTet: 'Démarche ID TeT',
  repriseTecDemarcheIdTec: 'Démarche ID T&C',
  repriseTecCopierIdDemarche: 'Copier l’ID TeT de la démarche',
  repriseTecCopierIdTec: 'Copier le n° T&C d’origine',
  repriseTecCopie: 'Copié',
  repriseTecInfosCollectivite: 'Informations sur la collectivité',
  repriseTecInfoSiren: 'SIREN',
  repriseTecInfoTerritoire: 'Territoire',
  repriseTecInfoHabitants: 'Habitants',
  repriseTecAucun: 'aucun',
  repriseTecInconnu: 'inconnu',

  repriseTecDossiersTec: 'Dossiers T&C',
  repriseTecIdOnglet: 'ID :',
  repriseTecIdTetOnglet: (id: number) => `TET-${id}`,
  repriseTecIdTecOnglet: (id: number) => `T&C-${id}`,
  repriseTecStatutTec: 'Statut T&C',
  repriseTecStatutArriveeTet: 'Statut d’arrivée TeT',
  repriseTecCopierInfosDossier: 'Copier infos du dossier',
  repriseTecCopierIdentifiants: 'Les identifiants',
  repriseTecCopierLien: 'Le lien du dossier',
  repriseTecCopierTicket: (avecLien: boolean) =>
    `Nom, ID, dossier${avecLien ? ' et lien' : ''} (pour un ticket)`,
  repriseTecTexteCollectiviteIdTet: (id: number) =>
    `Collectivité ID TeT : ${id}`,
  repriseTecTexteDemarcheIdTet: (id: number) => `Démarche ID TeT : ${id}`,
  repriseTecTexteDemarcheIdTec: (id: number, nonRepris: boolean) =>
    `Démarche n° T&C : ${id}${nonRepris ? ' (non repris)' : ''}`,
  repriseTecTexteEtat: (etat: string, statut: string) => `${etat} → ${statut}`,

  repriseTecDossierNonRepris: 'Dossier non repris :',
  repriseTecNombreReglesParticulieres: plural({
    zero: 'aucune règle particulière',
    one: 'règle particulière',
    other: 'règles particulières',
  }),
  repriseTecCasGeneral:
    'Aucune règle particulière : le cas général s’applique.',
  repriseTecDatesEtSource: 'Les dates et leur source',
  repriseTecDateLancement: 'Lancement',
  repriseTecDateReceptionProjet: 'Réception du projet',
  repriseTecDateAvisEtat: 'Avis de l’État',
  repriseTecDateApprobation: 'Approbation',
  repriseTecDateTransmission: 'Transmis pour avis',
  repriseTecDateAdoption: 'Adoption',
  repriseTecDatePublication: 'Publication',
  repriseTecSourceTec: 'T&C',
  repriseTecSourceSuivi: 'Suivi ADEME',
  repriseTecSourceTet: 'TeT',
  repriseTecNombreLignesEcartees: plural({
    zero: 'aucune ligne écartée',
    one: 'ligne écartée',
    other: 'lignes écartées',
  }),
  repriseTecNombreEcarts: plural({ one: 'écart', other: 'écarts' }),
  repriseTecRegleDe: (numero: number, titre: string) =>
    `Règle §${numero} : ${titre}`,

  repriseTecVueEnsemble: 'Vue d’ensemble',
  repriseTecCollectivites: 'Collectivités',
  repriseTecCasTypes: 'Cas types',
  repriseTecDecisions: 'Décisions',
  repriseTecPartieRegles: 'Où arrive mon dossier ?',
  repriseTecPartieCorrespondance: 'Correspondance des champs',

  repriseTecVueEnsembleSousTitre:
    'Où sont arrivés les dossiers de Territoires & Climat dans TeT',
  repriseTecEntonnoirTotal: (total: number, repris: number) =>
    `${total.toLocaleString(
      'fr-FR'
    )} dossiers dans T&C → ${repris.toLocaleString(
      'fr-FR'
    )} dossiers PCAET dans TeT`,
  repriseTecEntonnoirEtat: 'État dans T&C',
  repriseTecEntonnoirArrivee: 'Arrivée dans TeT',
  repriseTecEntonnoirNonReprisPour: (motif: string) => `Non repris : ${motif}`,
  repriseTecVoirCasTypes: 'Voir les cas types',
  repriseTecVoirDecisions: 'Voir les décisions à valider',

  repriseTecCasTypesSousTitre:
    'Les chemins d’un dossier dans la reprise, avec un exemple à ouvrir pour chacun',
  repriseTecCasTypesRepris: 'Les dossiers repris',
  repriseTecCasTypesNonRepris: 'Les dossiers non repris',
  repriseTecParticularites: 'Les cas particuliers',
  repriseTecParticularitesSousTitre:
    'Un dossier repris peut en cumuler plusieurs, en plus de son cas type',
  repriseTecOuvrirExemple: 'Ouvrir l’exemple',
  repriseTecVoirTous: (nombre: number) =>
    `Voir les ${nombre.toLocaleString('fr-FR')} dossiers`,
  repriseTecMasquerListe: 'Masquer la liste',
  repriseTecNombreDossiers: plural({
    zero: 'aucun dossier',
    one: 'dossier',
    other: 'dossiers',
  }),
  repriseTecCasType: (code: string) => casTypesTextes[code]?.titre ?? code,
  repriseTecCasTypeDetail: (code: string) => casTypesTextes[code]?.detail ?? '',
  repriseTecCasTypeChemin: (code: string) => casTypesTextes[code]?.chemin ?? '',
  repriseTecParticularite: (code: string) => particularitesTextes[code] ?? code,

  repriseTecDecisionsSousTitre:
    'Les règles appliquées par la reprise, avec les dossiers qu’elles touchent : à faire valider par le métier',
  repriseTecDecisionsOuvertes: 'Encore ouvertes',
  repriseTecDecisionsPrises: 'Prises par la reprise, à valider',
  repriseTecDecisionOuverte: 'Ouverte',
  repriseTecDecisionPrise: 'Prise par la reprise',
  repriseTecDecision: (code: string) => decisionsTextes[code]?.titre ?? code,
  repriseTecDecisionRegle: (code: string) => decisionsTextes[code]?.regle ?? '',
  repriseTecDecisionQui: (code: string) => decisionsTextes[code]?.qui ?? '',
  repriseTecDecisionTouche: (dossiers: number, lignes: number | null) =>
    lignes === null
      ? `${dossiers.toLocaleString('fr-FR')} dossiers`
      : `${lignes.toLocaleString('fr-FR')} lignes, ${dossiers.toLocaleString(
          'fr-FR'
        )} dossiers`,
  repriseTecExemples: 'Exemples',

  repriseTecCorrespondanceSousTitre:
    'Dans quoi est arrivé chaque champ de T&C, et chaque valeur',
  repriseTecRechercherChamp: 'Chercher un champ, une valeur, une table',
  repriseTecAucunChamp: 'Aucun champ ne correspond à la recherche.',
};

const casTypesTextes: Record<
  string,
  { titre: string; chemin: string; detail: string }
> = {
  C1: {
    titre: 'Dossier déposé, adopté à la date du suivi ADEME',
    chemin: 'mise en œuvre → publié',
    detail:
      'Sa copie « définitif » le rejoint ; la date d’approbation du suivi ADEME devient la date d’adoption.',
  },
  C2: {
    titre: 'Dossier déposé, adopté à une date de T&C',
    chemin: 'mise en œuvre → publié',
    detail:
      'Faute de date au suivi ADEME, l’adoption prend le dépôt définitif ou la dernière mise à jour de T&C.',
  },
  C3: {
    titre: 'Dossier sans état, adopté à la date du suivi ADEME',
    chemin: 'sans état → publié',
    detail:
      'Ancien PCET, Cit’ergie, TEPOS ou CTE visible sur la vitrine : repris comme PCAET publié, question ouverte au métier.',
  },
  C4: {
    titre: 'Dossier sans état, adopté à une date de T&C',
    chemin: 'sans état → publié',
    detail:
      'Le même, sans date au suivi ADEME : l’adoption prend une date de T&C.',
  },
  C5: {
    titre: 'Dépôt pour avis, approuvé d’après le suivi ADEME',
    chemin: 'dépôt pour avis → publié',
    detail:
      'Le suivi ADEME donne une approbation récente : le dossier arrive publié, même resté en dépôt pour avis dans T&C.',
  },
  C6: {
    titre: 'Dépôt pour avis sans approbation récente',
    chemin: 'dépôt pour avis → instruit',
    detail:
      'Les avis sont tenus pour rendus ; la collectivité doit encore déposer sa délibération d’adoption et publier.',
  },
  C7: {
    titre: 'En élaboration, approuvé au suivi après son lancement',
    chemin: 'en élaboration → publié',
    detail: 'Le suivi ADEME prime sur l’état de T&C.',
  },
  C8: {
    titre: 'En élaboration, pas approuvé',
    chemin: 'en élaboration → en élaboration',
    detail:
      'La collectivité remplit son dossier ; il n’est envoyé à aucun service.',
  },
  C9: {
    titre: 'Copie « définitif » d’un dossier déposé',
    chemin: 'définitif → non repris',
    detail:
      'Ce n’est pas un dossier de plus : son contenu rejoint le dossier « mise en œuvre ».',
  },
  C10: {
    titre: 'Dossier vide',
    chemin: '→ non repris',
    detail:
      'Ni fichier, ni diagnostic, ni action, ni vulnérabilité : rien à reprendre.',
  },
  C11: {
    titre: 'En élaboration, doublon d’un PCAET déjà adopté',
    chemin: 'en élaboration → non repris',
    detail: 'Le PCAET adopté de la collectivité arrive déjà.',
  },
  C12: {
    titre: 'Sans état, jamais visible sur la vitrine',
    chemin: 'sans état → non repris',
    detail: 'Jamais utilisé.',
  },
  C13: {
    titre: 'Cas isolés',
    chemin: '→ non repris',
    detail:
      'Deuxième dossier en élaboration d’une collectivité (on garde le plus récent), dossier de test.',
  },
};

const particularitesTextes: Record<string, string> = {
  P1: 'Totaux du diagnostic mélangés avec un autre dossier',
  P2: 'Transmission ramenée avant l’avis de l’État',
  P3: 'Date de lancement saisie avant 2000, corrigée',
  P4: 'Collectivité retrouvée par un autre SIREN',
};

const decisionsTextes: Record<
  string,
  { titre: string; regle: string; qui: string }
> = {
  D1: {
    titre: 'Les dossiers sans état (anciens PCET, Cit’ergie, TEPOS, CTE)',
    regle: 'Repris comme PCAET publiés.',
    qui: 'À trancher par le métier',
  },
  D2: {
    titre: 'Un dossier en élaboration que le suivi dit approuvé',
    regle: 'Publié, adopté à la date du suivi ADEME.',
    qui: 'Prise par la reprise',
  },
  D3: {
    titre: 'Un dépôt pour avis sans approbation récente',
    regle: 'Instruit : les avis sont tenus pour rendus.',
    qui: 'Prise par la reprise',
  },
  D4: {
    titre: 'Deux dossiers en élaboration dans une collectivité',
    regle: 'On garde le plus récent.',
    qui: 'Prise par la reprise',
  },
  D5: {
    titre: 'Un dossier en élaboration doublon d’un PCAET adopté',
    regle: 'Non repris.',
    qui: 'Prise par la reprise',
  },
  D6: {
    titre: 'La date d’adoption',
    regle:
      'Le suivi ADEME ; à défaut, le dépôt définitif ou la dernière mise à jour de T&C (les dossiers comptés ici).',
    qui: 'Prise par la reprise',
  },
  D7: {
    titre: 'La date de transmission',
    regle: 'Jamais après l’avis de l’État du suivi ADEME.',
    qui: 'Prise par la reprise',
  },
  D8: {
    titre: 'Une date saisie « 0023 »',
    regle: 'Lue 2023 ; une date impossible est ignorée.',
    qui: 'Prise par la reprise',
  },
  D9: {
    titre: '« Modifié le » des dossiers repris',
    regle: 'Le jour de l’import.',
    qui: 'À trancher par l’équipe produit',
  },
  D10: {
    titre: 'L’obligation absente du dossier',
    regle:
      'Le suivi ADEME, sinon le seuil de 20 000 habitants, sinon volontaire.',
    qui: 'Prise par la reprise',
  },
  D11: {
    titre:
      'Les avis sans PDF, sans courrier signé, antérieurs ou d’un dossier jamais transmis',
    regle: 'Non repris comme avis ; leurs fichiers restent au dossier.',
    qui: 'Prise par la reprise',
  },
  D12: {
    titre: 'L’élu référent tapé à la main',
    regle: 'Non repris : un texte libre ne fait pas un pilote.',
    qui: 'Prise par la reprise',
  },
  D13: {
    titre: 'Les contacts DREAL, Région, ADEME',
    regle: 'Non repris : TeT désigne le service, pas la personne.',
    qui: 'Prise par la reprise',
  },
  D14: {
    titre: 'Les objectifs 2021 et 2026 du diagnostic',
    regle: 'Non repris : TeT n’a pas ces colonnes.',
    qui: 'Prise par la reprise',
  },
  D15: {
    titre: 'Le total des particules PM10',
    regle:
      'Recalculé par TeT, sans le transport routier : plus bas que le total déclaré.',
    qui: 'Prise par la reprise',
  },
  D16: {
    titre: 'Deux dossiers d’une collectivité à la même date',
    regle: 'Leurs totaux du diagnostic se mélangent.',
    qui: 'Prise par la reprise',
  },
  D17: {
    titre: 'Les commentaires d’onglet du diagnostic',
    regle: 'Non repris : TeT ne commente qu’une valeur.',
    qui: 'Prise par la reprise',
  },
  D18: {
    titre: '« Oui » sans niveau dans la vulnérabilité',
    regle: 'Non repris : TeT n’a pas de niveau « concerné ».',
    qui: 'Prise par la reprise',
  },
  D19: {
    titre: 'Un libellé de vulnérabilité non reconnu',
    regle: 'Non repris, listé.',
    qui: 'Prise par la reprise',
  },
  D20: {
    titre: 'La population couverte et la fiche associée d’une action',
    regle: 'Non reprises : une fiche n’a pas ces champs.',
    qui: 'Prise par la reprise',
  },
};
