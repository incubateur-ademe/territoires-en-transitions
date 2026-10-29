import { z } from 'zod';

/**
 * Requêtes SQL revues, pour les questions récurrentes des esquisses : le
 * modèle n'a plus à écrire de SQL sur ces sujets. Ajouter une requête = une
 * entrée ici, relue par l'équipe data. Les paramètres sont liés en `$1`, `$2`…
 * dans l'ordre de `params`.
 *
 * Tables et colonnes d'après la documentation de la base analytique
 * (`tet://docs/base-analytique`) ; à valider sur la base réelle avec Baptiste
 * avant la mise en service (noms exacts, surtout pour `pap_statut_*`).
 */
export type NamedQueryParam = {
  name: string;
  description: string;
  schema: z.ZodType<string | number>;
};

export type NamedQuery = {
  name: string;
  title: string;
  description: string;
  params: readonly NamedQueryParam[];
  sql: string;
  /** Lignes maximum renvoyées (après lesquelles le résultat est tronqué). */
  maxRows: number;
};

export const NAMED_QUERIES: readonly NamedQuery[] = [
  {
    name: 'collectivites_activees_par_categorie',
    title: 'Collectivités activées, par catégorie',
    description:
      'Nombre de collectivités activées (au moins un membre hors BE, partenaires et conseillers) par catégorie : EPCI, syndicats, communes, départements, régions. Source : public.ct_actives. Activation, pas activité récente.',
    params: [],
    sql: `SELECT categorie, count(*) AS collectivites
      FROM public.ct_actives
      GROUP BY categorie
      ORDER BY collectivites DESC`,
    maxRows: 50,
  },
  {
    name: 'collectivites_actives_periode',
    title: 'Collectivités et utilisateurs actifs sur une période',
    description:
      'Collectivités distinctes et utilisateurs distincts ayant visité ou modifié quelque chose dans les N derniers jours. Source : public.activite_semaine (agents seulement : internes, BE, conseillers et @ademe.fr exclus).',
    params: [
      {
        name: 'jours',
        description:
          'Fenêtre en jours (ex. 90 pour un trimestre), entre 7 et 730.',
        schema: z.coerce.number().int().min(7).max(730),
      },
    ],
    sql: `SELECT count(DISTINCT collectivite_id) AS collectivites_actives,
        count(DISTINCT lower(email)) AS utilisateurs_actifs
      FROM public.activite_semaine
      WHERE to_date(semaine, 'YYYY-MM-DD') >= current_date - make_interval(days => $1::int)`,
    maxRows: 1,
  },
  {
    name: 'plans_actifs_52_semaines',
    title: 'Plans pilotables actifs (North Star publique)',
    description:
      'Nombre de plans avec au moins 5 fiches pilotables modifiées dans les 52 dernières semaines, et de collectivités concernées, sur le dernier mois calculé. Source : public.pap_statut_5_fiches_modifiees_52_semaines.',
    params: [],
    sql: `SELECT count(*) AS plans_actifs,
        count(DISTINCT collectivite_id) AS collectivites
      FROM public.pap_statut_5_fiches_modifiees_52_semaines
      WHERE mois = (SELECT max(mois) FROM public.pap_statut_5_fiches_modifiees_52_semaines)
        AND statut = 'actif'`,
    maxRows: 1,
  },
  {
    name: 'labellisation_actuelle_par_referentiel',
    title: 'Niveau de labellisation actuel, par référentiel',
    description:
      "Nombre de collectivités par niveau d'étoiles actuel (dernière labellisation obtenue par collectivité et par référentiel, CAE et ECI séparés). Source : public.labellisation.",
    params: [],
    sql: `SELECT referentiel, etoiles, count(*) AS collectivites
      FROM (
        SELECT DISTINCT ON (collectivite_id, referentiel) collectivite_id, referentiel, etoiles
        FROM public.labellisation
        ORDER BY collectivite_id, referentiel, obtenue_le DESC
      ) derniere
      GROUP BY referentiel, etoiles
      ORDER BY referentiel, etoiles`,
    maxRows: 50,
  },
];

export function findNamedQuery(name: string): NamedQuery | undefined {
  return NAMED_QUERIES.find((query) => query.name === name);
}
