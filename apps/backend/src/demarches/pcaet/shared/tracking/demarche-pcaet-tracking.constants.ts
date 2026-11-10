/**
 * Événements PostHog du dépôt PCAET émis par le serveur, source de vérité des
 * faits métier. Le front n'émet que les intentions et les interactions
 * (`Event.demarches.pcaet` dans `@tet/ui`).
 *
 * Nommage `domaine:sous-domaine:action`, action au participe passé : chaque
 * événement constate un fait acquis, capturé après le succès de l'opération.
 */
export const DemarchePcaetEventEnum = {
  CREEE: 'demarches:pcaet:creee',
  MODIFIEE: 'demarches:pcaet:modifiee',
  SUPPRIMEE: 'demarches:pcaet:supprimee',
  TRANSITION: 'demarches:pcaet:transition',
  TRANSITION_REFUSEE: 'demarches:pcaet:transition_refusee',
  TRANSMISE: 'demarches:pcaet:transmise',
  PUBLIEE: 'demarches:pcaet:publiee',
  DOCUMENT_DEPOSE: 'demarches:pcaet:document:depose',
  DOCUMENT_RETIRE: 'demarches:pcaet:document:retire',
  DOCUMENT_INCLUSION_DECLAREE: 'demarches:pcaet:document:inclusion_declaree',
  DOCUMENT_ADDITIONNEL_AJOUTE: 'demarches:pcaet:document:additionnel_ajoute',
  DOCUMENT_ADDITIONNEL_MODIFIE: 'demarches:pcaet:document:additionnel_modifie',
  DOCUMENT_ADDITIONNEL_RETIRE: 'demarches:pcaet:document:additionnel_retire',
  DIAGNOSTIC_VALEURS_SAISIES: 'demarches:pcaet:diagnostic:valeurs_saisies',
  DIAGNOSTIC_ANNEE_REFERENCE_DEFINIE:
    'demarches:pcaet:diagnostic:annee_reference_definie',
  VULNERABILITE_THEMATIQUE_AJOUTEE:
    'demarches:pcaet:vulnerabilite:thematique_ajoutee',
  VULNERABILITE_THEMATIQUE_MODIFIEE:
    'demarches:pcaet:vulnerabilite:thematique_modifiee',
  VULNERABILITE_THEMATIQUE_RETIREE:
    'demarches:pcaet:vulnerabilite:thematique_retiree',
  VULNERABILITE_LIGNE_SAISIE: 'demarches:pcaet:vulnerabilite:ligne_saisie',
  PLAN_RATTACHE: 'demarches:pcaet:plan:rattache',
  PLAN_DISSOCIE: 'demarches:pcaet:plan:dissocie',
  SAISINE_DATE_AJOUTEE: 'demarches:pcaet:saisine:date_ajoutee',
  AVIS_BROUILLON: 'demarches:pcaet:avis:brouillon',
  AVIS_VALIDE: 'demarches:pcaet:avis:valide',
  AVIS_SUPPRIME: 'demarches:pcaet:avis:supprime',
  INSTRUCTION_CLOSE: 'demarches:pcaet:instruction:close',
  REFERENT_AJOUTE: 'demarches:pcaet:referent:ajoute',
  REFERENT_RETIRE: 'demarches:pcaet:referent:retire',
  NOTIFICATION_ENVOYEE: 'demarches:pcaet:notification:envoyee',
  DOSSIER_TELECHARGE: 'demarches:pcaet:dossier:telecharge',
  PUBLIC_CONSULTEE: 'demarches:pcaet:public:consultee',
  SNAPSHOT: 'demarches:pcaet:snapshot',
} as const;

export type DemarchePcaetEvent =
  (typeof DemarchePcaetEventEnum)[keyof typeof DemarchePcaetEventEnum];

/**
 * Qui agit. `systeme` couvre le cron et les bascules constatées (avis tous
 * rendus, délai échu, PCAET suivant adopté) ; `public` la lecture d'un dossier
 * publié par qui n'en édite pas les démarches.
 */
export const DemarchePcaetActeurEnum = {
  COLLECTIVITE: 'collectivite',
  INSTRUCTEUR: 'instructeur',
  PUBLIC: 'public',
  SYSTEME: 'systeme',
} as const;

export type DemarchePcaetActeur =
  (typeof DemarchePcaetActeurEnum)[keyof typeof DemarchePcaetActeurEnum];
