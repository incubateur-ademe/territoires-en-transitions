/**
 * Le recalcul, au vrai run : TeT calcule les totaux que l'écriture directe en base ne déclenche pas.
 * On inscrit ce que ça change : les totaux de polluants déclarés remplacés, les dossiers mélangés.
 */

import type { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { PoolClient } from 'pg';
import { sleep } from '../../../utils/sleep.utils';
import type { Dossiers } from './dossiers';
import { createEcarts, type Ecart } from './ecarts';
import type { Valeur } from './tables-grille';

/** Vrai run seulement, après le commit (le backend lit la base par sa propre connexion) : recalcule, constate, inscrit les écarts. */
export const lancerRecalcul = async (
  client: PoolClient,
  dossiers: Dossiers,
  valeurs: readonly Valeur[],
  aPartirDe = 1
) => {
  const {
    rows: [{ debut }],
  } = await client.query<{ debut: string }>('select now()::text as debut');
  const collectivites = [
    ...new Set(valeurs.map((v) => dossiers.get(v.dossier).collectiviteId)),
  ];
  await recomputeCollectivites(collectivites, aPartirDe);

  const enBase = await loadTotauxEnBase(client, collectivites, valeurs);
  const totauxRecalcules = listTotauxRemplaces(valeurs, (v) =>
    enBase.get(toCle(v, v.identifiant, v.champ))
  );
  const dossiersMelanges = listDossiersMelanges(valeurs, dossiers);
  await client.query('begin');
  try {
    await client.query(
      `delete from reprise_tec.ecarts where motif in ('total_recalcule', 'total_melange')`
    );
    await createEcarts(client, [
      ...totauxRecalcules.map(ecartTotal),
      ...dossiersMelanges.map(ecartMelange),
    ]);
    await client.query('commit');
  } catch (e) {
    await client.query('rollback');
    throw e;
  }

  const reecrits = await countTotauxReecrits(client, collectivites, debut);
  console.log(
    `\nRecalcul fait pour ${collectivites.length} collectivités ; ${reecrits} totaux réécrits sur leurs autres sources (non annulables)`
  );
  return { totauxRecalcules, dossiersMelanges };
};

/** Les totaux de polluants déclarés dont la valeur après recalcul (prévue ou lue en base) n'est plus la même. */
export const listTotauxRemplaces = (
  valeurs: readonly Valeur[],
  getApres: (total: Valeur) => number | null | undefined
) =>
  valeurs.filter((v) => {
    if (v.ligne.table !== 'demarche_polluant_total') {
      return false;
    }
    const apres = getApres(v);
    return apres != null && isDifferent(v.valeur, apres);
  });

/** Règle : les dossiers d'une même collectivité à la même date ; le recalcul les regroupe, leurs totaux se mélangent. */
export const listDossiersMelanges = (
  valeurs: readonly Valeur[],
  dossiers: Dossiers
) => {
  const parDate = new Map<string, Set<number>>();
  for (const v of valeurs) {
    const cle = `${dossiers.get(v.dossier).collectiviteId}|${v.annee}`;
    parDate.set(cle, (parDate.get(cle) ?? new Set()).add(v.dossier));
  }
  return [
    ...new Set(
      [...parDate.values()].filter((d) => d.size > 1).flatMap((d) => [...d])
    ),
  ].sort((a, b) => a - b);
};

// ---------------------------------------------------------------------------
// Recalculer : TeT fait le calcul, le script relit.
// ---------------------------------------------------------------------------

/** Appelle le recalcul du backend pour chaque collectivité à partir du rang donné ; un nouvel essai après 5 s, puis arrêt en donnant le rang de reprise. */
const recomputeCollectivites = async (
  collectivites: number[],
  aPartirDe: number
) => {
  const api = getApi();
  for (const [index, collectiviteId] of collectivites.entries()) {
    const rang = index + 1;
    if (rang < aPartirDe) {
      continue;
    }
    const recompute = () =>
      api.indicateurs.valeurs.recompute.query({ collectiviteId });
    await recompute()
      .catch(() => sleep(5_000).then(recompute))
      .catch((e) => {
        throw new Error(
          `arrêt au rang ${rang} / ${collectivites.length} (${
            e instanceof Error ? e.message : e
          }) : relancer recalculer.ts --a-partir-de ${rang}`
        );
      });
    if (rang % 50 === 0 || rang === collectivites.length) {
      console.log(
        `  recalcul : ${rang} / ${collectivites.length} collectivités`
      );
    }
  }
};

/** Les totaux de polluants des dossiers repris, lus en base après le recalcul, par dossier, indicateur, année et champ. */
const loadTotauxEnBase = async (
  client: PoolClient,
  collectivites: number[],
  valeurs: readonly Valeur[]
) => {
  const identifiants = [
    ...new Set(
      valeurs
        .filter((v) => v.ligne.table === 'demarche_polluant_total')
        .map((v) => v.identifiant)
    ),
  ];
  const { rows } = await client.query<{
    dossier: number;
    identifiant: string;
    annee: number;
    resultat: number | null;
    objectif: number | null;
  }>(
    `select c.tec_id::int as dossier, d.identifiant_referentiel as identifiant,
            extract(year from v.date_valeur)::int as annee, v.resultat, v.objectif
       from public.indicateur_valeur v
       join public.demarche_pcaet_source_metadonnee l
         on l.metadonnee_id = v.metadonnee_id and l.collectivite_id = v.collectivite_id
       join reprise_tec.correspondance c
         on c.table_cible = 'demarche' and c.tet_id = l.demarche_id
       join public.indicateur_definition d on d.id = v.indicateur_id
      where v.collectivite_id = any($1) and d.identifiant_referentiel = any($2)`,
    [collectivites, identifiants]
  );
  return new Map(
    rows.flatMap((r) => [
      [toCle(r, r.identifiant, 'resultat'), r.resultat],
      [toCle(r, r.identifiant, 'objectif'), r.objectif],
    ])
  );
};

/** Les totaux réécrits par le recalcul depuis `debut` sous les autres sources des collectivités : ils ne s'annulent pas. */
const countTotauxReecrits = async (
  client: PoolClient,
  collectivites: number[],
  debut: string
) => {
  const {
    rows: [{ n }],
  } = await client.query<{ n: number }>(
    `select count(*)::int as n
       from public.indicateur_valeur v
      where v.collectivite_id = any($1) and v.calcul_auto and v.modified_at >= $2::timestamptz
        and not exists (
          select from public.demarche_pcaet_source_metadonnee l
            join reprise_tec.correspondance c
              on c.table_cible = 'demarche' and c.tet_id = l.demarche_id
           where l.metadonnee_id = v.metadonnee_id)`,
    [collectivites, debut]
  );
  return n;
};

/** Le client de l'API TeT, avec le jeton service role ; en https, sauf sur la machine locale. */
const getApi = () => {
  const apiUrl = process.env.TET_API_URL;
  const apiToken = process.env.TET_API_TOKEN;
  if (!apiUrl || !apiToken) {
    throw new Error(
      'TET_API_URL et TET_API_TOKEN sont requis pour le recalcul.'
    );
  }
  const url = new URL(apiUrl);
  const enLocal = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !enLocal) {
    throw new Error(
      `TET_API_URL doit être en https (reçu : ${url.protocol}//${url.hostname})`
    );
  }
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${apiUrl}/trpc`,
        headers: () => ({ authorization: `Bearer ${apiToken}` }),
      }),
    ],
  });
};

// ---------------------------------------------------------------------------
// Commun : la comparaison et les écarts.
// ---------------------------------------------------------------------------

/** Écart sous lequel un total est le même : un arrondi de calcul, pas un remplacement. */
const TOLERANCE = 1e-6;

const isDifferent = (declare: number, apres: number) =>
  Math.abs(declare - apres) > TOLERANCE * Math.max(1, Math.abs(declare));

/** L'adresse d'un chiffre : dossier, indicateur, année, constat ou objectif. */
export const toCle = (
  { dossier, annee }: { dossier: number; annee: number },
  identifiant: string,
  champ: string
) => `${dossier}|${identifiant}|${annee}|${champ}`;

const ecartTotal = (v: Valeur): Ecart => ({
  table: v.ligne.table,
  id: v.ligne.id,
  precision: v.ligne.precision,
  motif: 'total_recalcule',
});

const ecartMelange = (tecId: number): Ecart => ({
  table: 'demarche',
  id: tecId,
  precision: '',
  motif: 'total_melange',
});
