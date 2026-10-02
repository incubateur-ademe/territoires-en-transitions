'use strict';

/**
 * Questions de l'onglet « Démarche PCAET » de la FAQ, affichées aussi sur la
 * page Démarche PCAET du site.
 *
 * Strapi joue les migrations une seule fois (table `strapi_migrations`), avant
 * de synchroniser le schéma : la table `faqs` existe déjà, l'onglet n'est
 * qu'une valeur de plus de son énumération (une colonne texte en base). Une
 * question retirée ensuite depuis l'admin ne revient donc pas.
 */

const TAB = 'Démarche PCAET';

/** `Rang` reste vide, comme pour les autres questions : l'ordre suit l'id. */
const QUESTIONS = [
  {
    titre: 'Qui doit déposer un PCAET ?',
    contenu:
      "Les EPCI à fiscalité propre de plus de 20 000 habitants sont tenus d'élaborer un PCAET. Les autres collectivités peuvent s'engager volontairement et déposer leur plan sur la plateforme.",
  },
  {
    titre: 'Quels documents dois-je fournir ?',
    contenu:
      "Le diagnostic, la stratégie et ses objectifs, le programme d'actions et le dispositif de suivi, ainsi que les pièces jointes demandées à l'étape « Élaboration ».",
  },
  {
    titre: 'Le plan local de chaleur et de froid est-il pris en compte ?',
    contenu:
      "Oui. Lorsqu'une commune membre de votre EPCI compte plus de 45 000 habitants, le plan local de chaleur et de froid s'ajoute automatiquement aux pièces attendues, puisqu'il est intégré au PCAET. Dans le cas contraire, il ne vous est pas demandé.",
  },
  {
    titre:
      'Un même document couvre plusieurs pièces : faut-il le déposer plusieurs fois ?',
    contenu:
      "Non. Pour les pièces concernées, par exemple une évaluation environnementale intégrée à votre document de PCAET, vous indiquez qu'elles sont incluses dans un document déjà déposé : elles sont alors considérées comme fournies.",
  },
  {
    titre: "Puis-je importer mon programme d'actions existant ?",
    contenu:
      "Oui. Quel que soit son format (PDF, Word ou Excel), importez votre programme d'actions : en quelques minutes, la plateforme en reprend les actions pour constituer votre programme, prêt à être piloté. Plus besoin de tout ressaisir.",
  },
  {
    titre: 'Notre SCoT tient lieu de PCAET (SCoT-AEC) : comment le déposer ?',
    contenu:
      "Si votre collectivité porte la compétence SCoT, la plateforme vous demande au démarrage du dépôt si votre PCAET est un SCoT-AEC. Vous déposez alors un document unique valant schéma de cohérence territoriale et plan climat, identifié comme tel auprès des services de l'État. Ce choix reste modifiable jusqu'à la transmission pour avis.",
  },
  {
    titre:
      'Notre PCAET a déjà été transmis pour avis en dehors de la plateforme : pouvons-nous le déposer ?',
    contenu:
      "Oui. Au démarrage du dépôt, indiquez que votre PCAET a déjà été transmis pour avis hors plateforme : vous arrivez directement à l'étape de finalisation pour déposer votre plan adopté. Vous y renseignez ensuite vos documents, votre diagnostic et votre programme d'actions. Ce choix est définitif.",
  },
  {
    titre: 'Que se passe-t-il après la transmission pour avis ?',
    contenu:
      'Le conseil régional et le préfet de région rendent leur avis. Vous les consultez dans votre espace, puis votre collectivité délibère pour adopter le plan.',
  },
  {
    titre:
      "Notre territoire s'étend sur plusieurs départements ou régions : qui reçoit le dossier ?",
    contenu:
      "À la transmission, les services de l'État de chacun de vos territoires sont saisis et accèdent au dossier. L'avis du préfet de région est rendu par la DREAL de la région de votre siège ; les services des autres territoires consultent le dossier sans se prononcer.",
  },
  {
    titre: 'Pouvons-nous modifier notre plan après les avis ?',
    contenu:
      "Oui. Après réception des avis, vous mettez à jour les pièces que vous reprenez pour en tenir compte ; les autres restent dans leur version transmise. Vous déposez ensuite le mémoire de réponse et la délibération d'adoption.",
  },
  {
    titre: 'Comment déposer un renouvellement de PCAET ?',
    contenu:
      "Depuis votre espace, créez un nouveau dépôt, il apparaît automatiquement comme renouvellement lorsqu'un plan précédent a été déposé. Les documents et l'historique du premier plan restent accessibles.",
  },
  {
    titre: 'Que se passe-t-il une fois le plan adopté ?',
    contenu:
      "Votre programme d'actions devient votre outil de pilotage pour les six ans du plan : suivi des actions, indicateurs et tableaux de bord. Le bilan à mi-parcours et l'évaluation finale se déposent aussi sur la plateforme ; le dépôt de l'évaluation finale clôt le cycle et archive le plan.",
  },
];

module.exports = {
  async up(knex) {
    // Base neuve : la table n'existe qu'après la synchronisation du schéma.
    if (!(await knex.schema.hasTable('faqs'))) return;

    const alreadySeeded = await knex('faqs').where({ onglet: TAB }).first();
    if (alreadySeeded) return;

    const now = new Date();
    await knex('faqs').insert(
      QUESTIONS.map(({ titre, contenu }) => ({
        titre,
        contenu,
        onglet: TAB,
        created_at: now,
        updated_at: now,
        published_at: now,
      }))
    );
  },
};
