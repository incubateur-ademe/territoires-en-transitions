import type { ElectrificationFichesConfig } from './electrification-fiches.config';

/** Ressources liées aux actions du référentiel livré ; une URL absente reste explicite. */
export const electrificationAides = {
  'DOC-002': {
    titre: "Guide de l'autopartage pour les territoires",
    url: 'https://www.asso-autopartage.fr/guide-destination-collectivites/',
  },
  'DOC-004': {
    titre: 'Centre de ressources bâti scolaire',
    url: 'https://www.renovation-bati-scolaire.fr/',
  },
  'DOC-005': {
    titre:
      'Observatoire national des contrats de performance énergétique (CPE)',
    url: 'https://www.observatoirecpe.fr/',
  },
  'DOC-006': {
    titre: 'Site ressources sur les pompes à chaleur (PAC)',
    url: 'https://cepac-experts.org/',
  },
  'DOC-007': {
    titre:
      'Guide pratique pour les dirigeants de TPE, PME et ETI industrielles : 5 étapes clés pour engager et réussir votre décarbonation et votre électrification',
    url: 'https://www.entreprises.gouv.fr/la-dge/publications/guide-pratique-pour-les-dirigeants-de-tpe-pme-et-eti-industrielles-5-etapes',
  },
  'DSP-001': {
    titre: "Ingénierie d'aide à la décision",
    url: 'https://www.banquedesterritoires.fr/produits-services/ingenierie-territoriale/ingenierie-aide-decision',
  },
  'DSP-003': {
    titre: 'Leasing social',
    url: 'https://www.ecologie.gouv.fr/leasing-social',
  },
  'DSP-005': {
    titre: 'Ma Prime Rénov',
    url: 'https://france-renov.gouv.fr/aides/maprimerenov',
  },
  'DSP-006': {
    titre: 'Eco-PTZ',
    url: 'https://www.economie.gouv.fr/particuliers/gerer-mon-argent/emprunter-et-sassurer/leco-pret-taux-zero-eco-ptz-pouvez-vous-en-beneficier',
  },
  'DSP-007': {
    titre: 'Offre intégrée pompes à chaleur (PAC)',
    url: 'https://www.electrifions-la-france.gouv.fr/jinstalle-une-pompe-chaleur#1087',
  },
  'DSP-008': {
    titre: 'Slime +',
    url: 'https://programme-slime.fr/',
  },
  'DSP-009': {
    titre: 'EduRénov',
    url: 'https://www.banquedesterritoires.fr/edurenov',
  },
  'DSP-010': {
    titre: 'ACTEE',
    url: 'https://programme-cee-actee.fr/',
  },
  'DSP-011': {
    titre: 'DecarbFlash 2025-2027 - volet industrie',
    url: 'https://agirpourlatransition.ademe.fr/entreprises/aides-financieres/catalogue/aap/decarb-flash-2025-2027',
  },
  'DSP-012': {
    titre: 'DecarbInd',
    url: 'https://agirpourlatransition.ademe.fr/entreprises/aides-financieres/catalogue/aap/decarbonation-de-lindustrie-decarb-ind-25-2-releve',
  },
  'DSP-014': {
    titre: 'Zones industrielles bas carbone',
    url: 'https://agirpourlatransition.ademe.fr/entreprises/aides-financieres/catalogue/aap/favoriser-le-developpement-de-zones-industrielles-bas-carbone-zibac-phase-2-accompagnement',
  },
  'DSP-015': {
    titre: "Mon Parcours Économie d'Énergie (MPEE)",
    url: 'https://monparcourseconomiesdenergie.ademe.fr/',
  },
  'DSP-016': {
    titre: 'Eco-PLS',
    url: 'https://www.banquedesterritoires.fr/produits-services/prets-long-terme/pret-eco-pret',
  },
  'DSP-017': {
    titre: "Prêt à l'amélioration (PAM)",
    url: 'https://www.banquedesterritoires.fr/produits-services/prets-long-terme/pret-pam',
  },
  'DSP-018': {
    titre: 'E-Trans - volet agriculture',
    url: 'https://agirpourlatransition.ademe.fr/entreprises/aides-financieres/catalogue/2026/engins-agricoles-electriques-programme-cee-e-trans',
  },
  'DSP-019': {
    titre: "Prêt Flash'Electrique",
    url: 'https://flash.bpifrance.fr/electrique',
  },
  'DSP-020': {
    titre: "Aide à l'acquisition de bus et autocars électriques",
    url: null,
  },
  'DSP-021': {
    titre: 'ADVENIR',
    url: 'https://advenir.mobi/',
  },
  'DSP-022': {
    titre: 'Accélérer le basculement vers une mobilité décarbonée',
    url: 'https://www.banquedesterritoires.fr/offres/accelerer-basculement-mobilite-decarbonee#segment-13071',
  },
  'DSP-023': {
    titre:
      'Mobilités durables en territoires ruraux et moyennement denses - Fonds Vert',
    url: 'https://aides-territoires.beta.gouv.fr/aides/developper-les-mobilites-durables-en-territoires-ruraux-et-moyennement-denses/',
  },
  'DSP-025': {
    titre: 'Fonds Chaleur',
    url: 'https://fondschaleur.ademe.fr/',
  },
  'DSP-026': {
    titre: 'Rénovation énergétique des bâtiments publics locaux - Fonds Vert',
    url: 'https://www.ecologie.gouv.fr/sites/default/files/documents/FV_Cahier_Axe1_Renovation.pdf',
  },
  'DSP-027': {
    titre: 'Ingénierie - Fonds Vert',
    url: 'https://www.ecologie.gouv.fr/sites/default/files/documents/FV_Cahier_Ingenierie.pdf',
  },
  'DSP-028': {
    titre: 'Dispositif d’accompagnement au déploiement de vélis',
    url: 'https://xd.ademe.fr/deploiement-2026',
  },
  'DSP-029': {
    titre:
      "ELENA (European Local Energy Assistance) - Mécanisme européen d'assistance technique pour les projets énergétiques locaux",
    url: 'https://www.eib.org/fr/products/advisory-services/elena/index.htm',
  },
  'DSP-030': {
    titre: 'Electrification Poids Lourds',
    url: 'https://www.edf.fr/entreprises/transition-energetique/mobilite-electrique/mobilite-lourde',
  },
  'DSP-031': {
    titre: 'Booster financement IRVE copropriétés',
    url: null,
  },
  'DSP-032': {
    titre:
      "CEE Véhicules Utilitaires Légers (VUL) - fiche d'opération standardisée",
    url: null,
  },
  'DSP-034': {
    titre: 'Économes de flux et conseil en énergie partagé',
    url: null,
  },
  'DSP-036': {
    titre: 'Coup de pouce "Chauffage des bâtiments résidentiels"',
    url: 'https://www.ecologie.gouv.fr/politiques-publiques/coup-pouce-chauffage-batiments-residentiels-collectifs-tertiaires',
  },
  'DSP-037': {
    titre: 'DecarbFlash Artisan',
    url: 'https://agirpourlatransition.ademe.fr/entreprises/aides-financieres/catalogue/aap/decarb-flash-artisan',
  },
  'DSP-038': {
    titre: 'PACTE Industrie',
    url: 'https://pacte-industrie.ademe.fr/',
  },
  'DSP-040': {
    titre: 'E-Trans - Engins de chantiers électriques',
    url: null,
  },
  'DSP-041': {
    titre: 'Fiche CEE PAC Serre',
    url: null,
  },
  'DSP-042': {
    titre: 'Ingénierie transition énergétique territoriale',
    url: 'https://www.federation-flame.org/les-alecs/',
  },
  'DSP-043': {
    titre: 'Diagnostic LISE',
    url: 'https://www.cci.fr/offre/evaluation-carbone-simplifiee-lise-mesurez-et-reduisez-vos-emissions-de-co2',
  },
  'DSP-044': {
    titre: 'CAP décarbonation',
    url: 'https://mission-transition-ecologique.beta.gouv.fr/aides-entreprise/cap-decarbonation',
  },
  'DSP-045': {
    titre: 'VIsite énergie',
    url: 'https://mission-transition-ecologique.beta.gouv.fr/aides-entreprise/visite-energie',
  },
  'DSP-046': {
    titre: 'Prêt Vert',
    url: 'https://www.bpifrance.fr/catalogue-offres/pret-vert',
  },
  'DSP-047': {
    titre: "Cellules régionales d'appui France Mobilités",
    url: 'https://www.francemobilites.fr/regions',
  },
  'DSP-049': {
    titre: 'Prime Coup de Pouce VE',
    url: 'https://calculateur-cee.ademe.fr/user/fiches/TRA',
  },
  'OUT-001': {
    titre: 'Verdir Ma Flotte',
    url: 'https://verdirmaflotte.fr/',
  },
  'OUT-002': {
    titre: 'Diagnostic mobilité',
    url: 'https://diagnostic-mobilite.fr/',
  },
  'OUT-003': {
    titre: 'Observatoire de la donnée de recharge',
    url: 'https://observatoire.advenir.mobi/',
  },
  'OUT-004': {
    titre: 'Observatoire des SDIE',
    url: null,
  },
  'OUT-005': {
    titre:
      "Inventaire du patrimoine public, de l'énergie et de la rénovation (IPPER)",
    url: 'https://ipper.fr/',
  },
  'OUT-006': {
    titre: 'BatEnr',
    url: 'https://reseaux-chaleur.cerema.fr/espace-documentaire/batenr',
  },
  'OUT-007': {
    titre: 'Ressources réseaux de chaleur',
    url: 'https://france-chaleur-urbaine.beta.gouv.fr/',
  },
  'OUT-008': {
    titre: 'Wattwatchers',
    url: 'https://www.wattwatchers.fr/',
  },
  'OUT-009': {
    titre: 'Base de données OPERAT',
    url: 'https://operat.ademe.fr/public/home',
  },
  'OUT-012': {
    titre: 'Base de données nationale des bâtiments (BDNB)',
    url: 'https://bdnb.io/',
  },
  'DSP-050': {
    titre: "Espaces conseil France Rénov' (ECFR)",
    url: 'https://france-renov.gouv.fr/espaces-conseil-fr',
  },
  'DSP-051': {
    titre:
      'Coup de pouce "Chauffage des bâtiments résidentiels collectifs et tertiaires"',
    url: 'https://www.ecologie.gouv.fr/politiques-publiques/coup-pouce-chauffage-batiments-residentiels-collectifs-tertiaires',
  },
  'OUT-013': {
    titre: 'PrioRéno Logement social',
    url: 'https://www.banquedesterritoires.fr/produits-services/services-digitaux/service-prioreno-renovation-logements-sociaux',
  },
  'DOC-008': {
    titre:
      "Collectivités : méthode pour construire son plan d'investissement aligné climat",
    url: 'https://www.i4ce.org/publication/collectivites-methode-construire-plan-investissement-aligne-climat-guide-methodologique/',
  },
  'DOC-009': {
    titre: 'Réseau Synapse',
    url: 'https://www.reseau-synapse.org/',
  },
  'DSP-052': {
    titre:
      'Ingénierie spécifique concernant le réseau de gaz des 100 Territoires',
    url: null,
  },
  'OUT-014': {
    titre: 'Go Rénove (CSTB)',
    url: 'https://gorenove.fr/',
  },
  'PAR-001': {
    titre: 'Anah',
    url: 'https://www.anah.gouv.fr/',
  },
  'PAR-002': {
    titre: 'ANCT',
    url: 'https://agence-cohesion-territoires.gouv.fr/',
  },
  'PAR-003': {
    titre: 'Banque des Territoires',
    url: 'https://www.banquedesterritoires.fr/',
  },
  'PAR-004': {
    titre: 'Bpifrance',
    url: 'https://www.bpifrance.fr/',
  },
  'PAR-005': {
    titre: 'Cerema',
    url: 'https://www.cerema.fr/',
  },
  'PAR-006': {
    titre: 'FNCCR et programme ACTEE',
    url: 'https://www.fnccr.asso.fr/',
  },
  'PAR-007': {
    titre: "Agences locales de l'énergie et du climat (FLAME)",
    url: 'https://www.federation-flame.org/',
  },
  'PAR-008': {
    titre: 'Enedis',
    url: 'https://www.enedis.fr/',
  },
  'PAR-009': {
    titre: 'RTE',
    url: 'https://www.rte-france.com/',
  },
  'PAR-010': {
    titre: 'GRDF',
    url: 'https://www.grdf.fr/',
  },
  'PAR-011': {
    titre: 'Entreprises locales de distribution (ELE, UNELEG)',
    url: null,
  },
  'PAR-012': {
    titre: "Union sociale pour l'habitat (USH)",
    url: 'https://www.union-habitat.org/',
  },
  'PAR-013': {
    titre: 'CLCV',
    url: 'https://www.clcv.org/',
  },
  'PAR-014': {
    titre: 'Logivolt',
    url: null,
  },
  'PAR-015': {
    titre: 'Amorce',
    url: 'https://amorce.asso.fr/',
  },
  'PAR-016': {
    titre: 'FEDENE',
    url: 'https://www.fedene.fr/',
  },
  'PAR-017': {
    titre: 'CEPAC',
    url: 'https://cepac-experts.org/',
  },
  'PAR-018': {
    titre: 'Ressorts',
    url: 'https://ressorts.life/communs/',
  },
  'PAR-019': {
    titre: 'Watt Watchers',
    url: 'https://www.wattwatchers.fr/',
  },
  'PAR-020': {
    titre: 'La Poste',
    url: 'https://www.lapostegroupe.com/',
  },
  'PAR-021': {
    titre: 'Avere-France',
    url: 'https://www.avere-france.org/',
  },
  'PAR-022': {
    titre: 'ChargeFrance',
    url: null,
  },
  'PAR-023': {
    titre: 'FFIE',
    url: 'https://www.ffie.fr/',
  },
  'PAR-024': {
    titre: 'MEDEF',
    url: 'https://www.medef.com/',
  },
  'PAR-025': {
    titre: "Chambre de commerce et d'industrie (CCI)",
    url: 'https://www.cci.fr/',
  },
  'PAR-026': {
    titre: "Chambre de métiers et de l'artisanat (CMA)",
    url: 'https://www.artisanat.fr/',
  },
  'PAR-027': {
    titre: "Chambres d'agriculture",
    url: 'https://chambres-agriculture.fr/',
  },
  'PAR-028': {
    titre: 'FNCUMA',
    url: 'https://www.cuma.fr/',
  },
  'PAR-029': {
    titre: 'Régions de France',
    url: 'https://regions-france.org/',
  },
  'OUT-015': {
    titre: "(A venir) Outil numérique d'aller-vers",
    url: null,
  },
  'PAR-030': {
    titre: "Espaces conseil France Rénov'",
    url: 'https://france-renov.gouv.fr/espaces-conseil-fr',
  },
  'PAR-031': {
    titre: 'ADEME',
    url: 'https://www.ademe.fr/',
  },
  'PAR-032': {
    titre: 'ATEE',
    url: 'https://atee.fr/',
  },
  'DSP-053': {
    titre: "Mon Accompagnateur Rénov'",
    url: 'https://france-renov.gouv.fr/',
  },
  'DSP-054': {
    titre: 'Electrifab',
    url: 'https://atee.fr/',
  },
  'DSP-055': {
    titre: 'Audit énergétique volontaire (ADEME)',
    url: 'https://agirpourlatransition.ademe.fr/entreprises/',
  },
  'DSP-056': {
    titre: 'PROREFEI',
    url: 'https://www.prorefei.org/',
  },
  'DSP-057': {
    titre: 'Fiches CEE industrie : chaleur fatale et chaudière électrique',
    url: 'https://www.ecologie.gouv.fr/politiques-publiques/operations-standardisees-deconomies-denergie',
  },
  'OUT-016': {
    titre: 'Prio-Fioul (FNCCR – programme ACTEE)',
    url: 'https://programme-cee-actee.fr/base-de-donnees-prio-fioul/',
  },
  'DOC-010': {
    titre: "Retour d'expérience du programme Actimmo (CLER, 2019-2021)",
    url: 'https://cler.org/wp-content/uploads/2022/06/Rapport-final-Actimmo.pdf',
  },
  'DSP-058': {
    titre: 'Fiche CEE PAC Géothermiques',
    url: null,
  },
  'DSP-059': {
    titre: "(à venir) Fiche CEE Véhicule d'occasion",
    url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054666103',
  },
  'DSP-060': {
    titre:
      "(à venir) Prime allant jusqu'à 1000€/logement pour la sortie du gaz dans les zones identifiées comme pertinentes",
    url: null,
  },
  'DSP-061': {
    titre:
      "(à venir) Dispositif d'aller-vers centré sur les ménages chauffés au fioul",
    url: null,
  },
} satisfies Record<
  string,
  NonNullable<ElectrificationFichesConfig['actions']>[number]['aides'][number]
>;
