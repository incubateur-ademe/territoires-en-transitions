import type { Core } from '@strapi/strapi';
import { createHmac } from 'node:crypto';

/**
 * Seed d'un token API read-only pour le dev local.
 *
 * `strapi transfer` (make cms-pull) importe le contenu mais pas les tokens
 * API (ce sont des secrets runtime), et le token commité dans apps/site/.env
 * appartient à l'instance Strapi Cloud distante → l'instance locale le rejette
 * en 401 et le site plante (data null). On (re)crée donc à chaque boot un
 * token dont la valeur en clair est fixe (STRAPI_LOCAL_READONLY_TOKEN), pour
 * que le site (NEXT_PUBLIC_STRAPI_KEY, même valeur dans apps/site/.env) puisse
 * lire l'API locale sans manip manuelle.
 *
 * La variable n'est définie que dans la stack docker locale (docker-compose) :
 * en prod elle est absente → aucun seed.
 */
const seedLocalReadonlyToken = async (strapi: Core.Strapi) => {
  const token = process.env.STRAPI_LOCAL_READONLY_TOKEN;
  if (!token) return;

  const name = 'local-dev-readonly';
  // Strapi hache les access keys en HMAC-SHA512 avec admin.apiToken.salt ; on
  // reproduit le même hachage pour que le token en clair envoyé par le site
  // corresponde à la ligne stockée.
  const salt = strapi.config.get('admin.apiToken.salt') as string;
  const accessKey = createHmac('sha512', salt).update(token).digest('hex');

  const existing = await strapi.db
    .query('admin::api-token')
    .findOne({ where: { name } });

  if (existing) {
    if (existing.accessKey !== accessKey) {
      await strapi.db.query('admin::api-token').update({
        where: { id: existing.id },
        data: { accessKey, type: 'read-only' },
      });
      strapi.log.info(`[bootstrap] token API local « ${name} » mis à jour`);
    }
    return;
  }

  await strapi.db.query('admin::api-token').create({
    data: {
      name,
      description: 'Token read-only seedé pour le dev local (app site)',
      type: 'read-only',
      accessKey,
      lifespan: null,
      expiresAt: null,
    },
  });
  strapi.log.info(`[bootstrap] token API local « ${name} » seedé (read-only)`);
};

/**
 * Référencement initial de la page Démarche PCAET, créé une seule fois : une
 * fois l'entrée en place, l'admin en est seul maître.
 */
const seedDemarchePcaetSeo = async (strapi: Core.Strapi) => {
  const uid = 'api::page-demarche-pcaet.page-demarche-pcaet';
  const existing = await strapi.documents(uid).findFirst();
  if (existing) return;

  await strapi.documents(uid).create({
    data: {
      seo: {
        metaTitle: 'Déposer votre PCAET (Plan Climat-Air-Énergie Territorial)',
        metaDescription:
          "Déposez votre Plan Climat sur Territoires en Transitions : un parcours de dépôt du PCAET guidé étape par étape, de l'élaboration à l'adoption, et un outil de pilotage pour suivre vos actions.",
      },
    },
    status: 'published',
  });
  strapi.log.info('[bootstrap] référencement de la page Démarche PCAET créé');
};

const FAQ_TAB = 'Démarche PCAET';

/**
 * `Rang` reste vide, comme pour les autres questions : à rang égal, le site
 * trie par date de création, que la publication conserve (l'`id` change).
 */
const FAQ_QUESTIONS = [
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

/**
 * Questions de l'onglet « Démarche PCAET » de la FAQ, affichées aussi sur la
 * page Démarche PCAET du site.
 *
 * Seed joué une seule fois, mémorisé dans le core store : une question retirée
 * ensuite depuis l'admin ne revient pas. Il ne se joue pas non plus si la
 * migration knex qui le portait sous Strapi 4 est passée (même règle : ses
 * questions ont pu être retirées depuis). Création transactionnelle : jamais
 * d'onglet à moitié rempli.
 */
const LEGACY_FAQ_MIGRATION = '2026.10.02T00.00.00.add-demarche-pcaet-faq.js';

const seedDemarchePcaetFaq = async (strapi: Core.Strapi) => {
  const store = strapi.store({ type: 'core', name: 'tet' });
  const key = 'faq-demarche-pcaet-seeded';
  if (await store.get({ key })) return;

  const knex = strapi.db.connection;
  const seededByV4Migration =
    (await knex.schema.hasTable('strapi_migrations')) &&
    !!(await knex('strapi_migrations')
      .where({ name: LEGACY_FAQ_MIGRATION })
      .first());

  const uid = 'api::faq.faq';
  const existing = await strapi
    .documents(uid)
    .findFirst({ filters: { onglet: FAQ_TAB } });

  if (!seededByV4Migration && !existing) {
    await strapi.db.transaction(async () => {
      for (const { titre, contenu } of FAQ_QUESTIONS) {
        await strapi.documents(uid).create({
          data: { Titre: titre, Contenu: contenu, onglet: FAQ_TAB },
          status: 'published',
        });
      }
    });
    strapi.log.info(
      `[bootstrap] ${FAQ_QUESTIONS.length} questions de la FAQ « ${FAQ_TAB} » créées`
    );
  }
  await store.set({ key, value: true });
};

/**
 * Les URLs publiques des actualités portaient l'`id` numérique de Strapi 4.
 * En Strapi 5, publier recrée la ligne publiée sous un nouvel `id` : on fige
 * donc, une seule fois et juste après la migration (les lignes publiées ont
 * encore leur `id` v4), cet `id` dans le champ caché `legacy_id` du brouillon
 * comme de la version publiée. La publication recopiant le brouillon, la
 * valeur survit aux republications ; le site s'en sert pour rediriger les
 * anciennes URLs `/actus/<id>/…`.
 */
const seedActualiteLegacyIds = async (strapi: Core.Strapi) => {
  const store = strapi.store({ type: 'core', name: 'tet' });
  const key = 'actualite-legacy-ids-seeded';
  if (await store.get({ key })) return;

  const { tableName } = strapi.db.metadata.get('api::actualite.actualite');
  const updated = await strapi.db.connection.raw(
    `update ?? as a set legacy_id = p.id
       from ?? as p
      where p.document_id = a.document_id
        and p.published_at is not null
        and a.legacy_id is null`,
    [tableName, tableName]
  );
  strapi.log.info(
    `[bootstrap] ancien id figé sur ${
      updated.rowCount ?? 0
    } lignes d'actualités`
  );
  await store.set({ key, value: true });
};

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await seedLocalReadonlyToken(strapi);
    await seedDemarchePcaetSeo(strapi);
    await seedDemarchePcaetFaq(strapi);
    await seedActualiteLegacyIds(strapi);
  },
};
