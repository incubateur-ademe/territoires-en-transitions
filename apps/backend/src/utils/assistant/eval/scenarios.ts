import { defineScenario, Scenario } from './scenario';

/**
 * Scénarios d'évaluation, tirés de `utils/mcp/eval/questions-esquisse.md`.
 * `metier` tourne sur la collectivité de fixture créée par le run ;
 * `analytique` exige la base de l'équipe data (ignoré sans
 * ANALYTICS_DATABASE_URL propre) ; `posthog`, la clé PostHog.
 */
export const SCENARIOS: readonly Scenario[] = [
  defineScenario({
    id: 'fiche-collectivite',
    tags: ['metier'],
    say: 'Que sait-on de la collectivité n°{collectivite.id} ?',
    expect: {
      tools: [
        {
          name: 'get_collectivite',
          args: { collectiviteId: { ref: 'collectivite.id' } },
        },
      ],
      answer: { contains: [{ ref: 'collectivite.nom' }] },
    },
    // Question ouverte : plans et scores en plus de la fiche sont légitimes.
    maxModelCalls: 6,
  }),
  defineScenario({
    id: 'plans-actifs',
    tags: ['metier'],
    say: "Combien de plans d'action a la collectivité n°{collectivite.id}, et lesquels ont bougé ces trois derniers mois ?",
    expect: {
      tools: [
        {
          name: 'list_plans',
          args: { collectiviteId: { ref: 'collectivite.id' } },
        },
      ],
      answer: { contains: [{ ref: 'plan.nom' }] },
    },
    maxModelCalls: 4,
  }),
  defineScenario({
    id: 'pilote-pcaet',
    tags: ['metier'],
    say: 'Où en est la démarche PCAET de la collectivité n°{collectivite.id}, et qui la pilote ?',
    expect: {
      tools: [
        {
          name: 'get_demarche_pcaet',
          args: { collectiviteId: { ref: 'collectivite.id' } },
        },
      ],
      answer: { contains: [['élaboration', 'elaboration']] },
    },
    maxModelCalls: 4,
  }),
  defineScenario({
    id: 'pcaet-bloque',
    tags: ['metier'],
    say: "La collectivité n°{collectivite.id} n'arrive pas à transmettre son PCAET pour avis : pourquoi ?",
    expect: {
      tools: [
        {
          name: 'get_demarche_pcaet',
          args: { collectiviteId: { ref: 'collectivite.id' } },
        },
      ],
      answer: { contains: [['pièce', 'document', 'dossier']] },
    },
    maxModelCalls: 5,
  }),
  defineScenario({
    id: 'score-cae',
    tags: ['metier'],
    say: 'Quel est le score Climat-Air-Énergie de la collectivité n°{collectivite.id} ?',
    expect: {
      tools: [
        {
          name: 'get_referentiel_scores',
          args: {
            collectiviteId: { ref: 'collectivite.id' },
            referentielId: 'cae',
          },
        },
      ],
    },
    maxModelCalls: 4,
  }),
  defineScenario({
    id: 'utilisateur',
    tags: ['metier'],
    say: 'Dans quelles collectivités travaille {membre.email}, et avec quel rôle ?',
    expect: {
      tools: [{ name: 'find_user', args: { email: { ref: 'membre.email' } } }],
      answer: { contains: [{ ref: 'collectivite.nom' }] },
    },
    maxModelCalls: 4,
  }),
  defineScenario({
    id: 'parcours-utilisateur',
    tags: ['posthog'],
    say: "Qu'a fait {membre.email} sur la plateforme ces sept derniers jours ?",
    expect: { anyTool: ['list_recent_events', 'find_user'] },
    maxModelCalls: 5,
  }),
  defineScenario({
    id: 'refus-sans-mode-super-admin',
    tags: ['refus'],
    viewer: 'support-sans-mode',
    say: 'Que sait-on de la collectivité n°{collectivite.id} ?',
    expect: {
      tools: [{ name: 'get_collectivite' }],
      answer: { contains: [['super admin', 'super-admin', 'superadmin']] },
    },
    maxModelCalls: 4,
  }),
  defineScenario({
    id: 'activation-par-categorie',
    tags: ['analytique'],
    say: 'Combien de collectivités sont activées sur la plateforme, par catégorie ?',
    expect: {
      tools: [
        {
          name: 'run_named_query',
          args: { name: 'collectivites_activees_par_categorie' },
        },
      ],
    },
    maxModelCalls: 5,
  }),
  defineScenario({
    id: 'plans-actifs-52-semaines',
    tags: ['analytique'],
    say: "Combien de plans d'action pilotables sont actifs sur 52 semaines, et dans combien de collectivités ?",
    expect: {
      tools: [
        { name: 'run_named_query', args: { name: 'plans_actifs_52_semaines' } },
      ],
    },
    maxModelCalls: 5,
  }),
  defineScenario({
    id: 'fiches-par-statut',
    tags: ['analytique'],
    say: 'Combien de fiches action par statut, hors sous-actions et fiches supprimées ?',
    expect: {
      tools: [
        {
          name: 'run_sql_query',
          args: { sql: { matches: 'parent_id\\s+is\\s+null' } },
        },
      ],
    },
    maxModelCalls: 6,
  }),
  defineScenario({
    id: 'catalogue-tables',
    tags: ['analytique'],
    say: 'Quelles tables de statistiques existent, et quelles sont les colonnes de la table ct_actives ?',
    expect: {
      tools: [{ name: 'list_tables' }, { name: 'describe_table' }],
    },
    maxModelCalls: 5,
  }),
  defineScenario({
    id: 'catalogue-requetes',
    tags: ['analytique'],
    say: 'Quelles questions récurrentes sais-tu chiffrer sans écrire de SQL ?',
    expect: { tools: [{ name: 'list_named_queries' }] },
    maxModelCalls: 3,
  }),
  defineScenario({
    id: 'pages-consultees',
    // L'exclusion des comptes internes lit leur liste dans la base analytique.
    tags: ['posthog', 'analytique'],
    say: "Quelles pages de l'application ont été les plus consultées ces 30 derniers jours ?",
    expect: { tools: [{ name: 'run_hogql_query' }] },
    maxModelCalls: 5,
  }),
  defineScenario({
    id: 'support-plans',
    tags: ['support'],
    viewer: 'support-sans-mode',
    support: {},
    say: 'Combien de plans a sa collectivité ?',
    expect: {
      tools: [
        {
          name: 'list_plans',
          args: { collectiviteId: { ref: 'collectivite.id' } },
        },
      ],
      answer: { contains: [{ ref: 'plan.nom' }] },
    },
    maxModelCalls: 3,
  }),
  defineScenario({
    id: 'support-blocage',
    tags: ['support'],
    viewer: 'support-sans-mode',
    support: {
      visitorMessages: [
        "Bonjour, je n'arrive pas à transmettre notre PCAET pour avis, le bouton reste grisé.",
      ],
    },
    say: 'Pourquoi est-il bloqué ?',
    expect: {
      tools: [
        {
          name: 'get_demarche_pcaet',
          args: { collectiviteId: { ref: 'collectivite.id' } },
        },
      ],
      answer: { contains: [['pièce', 'document', 'dossier', 'diagnostic']] },
    },
    maxModelCalls: 4,
  }),
  defineScenario({
    id: 'support-suite',
    tags: ['support'],
    viewer: 'support-sans-mode',
    support: {
      history: [
        { role: 'user', text: 'Pour quelle collectivité travaille-t-il ?' },
        {
          role: 'assistant',
          text: 'Il est administrateur de {collectivite.nom} (n°{collectivite.id}).',
        },
      ],
    },
    say: 'Et où en est sa démarche PCAET ?',
    expect: {
      tools: [
        {
          name: 'get_demarche_pcaet',
          args: { collectiviteId: { ref: 'collectivite.id' } },
        },
      ],
      answer: { contains: [['élaboration', 'elaboration']] },
    },
    maxModelCalls: 3,
  }),
  defineScenario({
    id: 'esquisse-activation',
    tags: ['esquisse'],
    mode: 'esquisse',
    esquisse: {
      sujet: "améliorer l'activation des communes de moins de 5 000 habitants",
      appetit: 'petite',
    },
    say: "Rédige l'esquisse.",
    expect: {
      answer: {
        contains: [
          ['Problème'],
          ['Appétit'],
          ['Pièges'],
          ['Hors périmètre'],
          ['Inconnues'],
        ],
      },
    },
    maxModelCalls: 8,
  }),
];
