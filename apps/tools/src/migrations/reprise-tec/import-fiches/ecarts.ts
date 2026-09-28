/** Les écarts : chaque ligne des tables d'action de T&C, écrite ou écartée avec son motif, et la preuve que rien ne se perd. */

import { PoolClient } from 'pg';

export type Ligne = {
  table: string;
  id: number;
  precision: string;
};

export type Ecart = Ligne & {
  motif: string;
};

type LigneLue = Ligne & { action: number; dossier: number | null };

/**
 * Lit toutes les lignes des tables d'action, dossiers repris ou non ; rend les lignes lues, les écrites et les écarts.
 * Les actions écrites ne sont pas rendues : ce sont les fiches, comptées par le bilan.
 */
export const loadEcarts = async (client: PoolClient) => {
  const { rows: lues } = await client.query<LigneLue>(`
    select 'action' as "table", id::int, '' as precision,
           id::int as action, demarche_id::int as dossier
      from reprise_tec.staging_action
    union all ${satellite('action_volet', 'action_id', "'volet ' || volet_id")}
    union all ${satellite('action_cible', 'action_id', "'cible ' || cible_id")}
    union all ${satellite('action_secteur', 'id', "''")}
    union all ${satellite('action_secteur_autre', 'id', "''")}
    union all ${satellite(
      'action_type_action',
      'action_id',
      "'type_action ' || type_action_id"
    )}
    union all ${satellite(
      'action_type_porteur',
      'action_id',
      "'type_porteur ' || type_porteur_id"
    )}
    union all ${satellite('action_type_porteur_autre', 'id', "''")}
    union all ${satellite(
      'action_collectivite',
      'action_id',
      "'collectivite ' || collectivite_id"
    )}
    union all ${satellite('action_historique', 'id', "''")}
    order by 1, 2, 3`);
  const getMotifDossier = await loadMotifsDossiers(client);

  const motifsAction = new Map(
    lues
      .filter((l) => l.table === 'action')
      .map((l) => [
        l.id,
        l.dossier === null ? 'vitrine' : getMotifDossier(l.dossier),
      ])
  );
  const decisions = lues
    .filter((l) => l.table !== 'action' || motifsAction.get(l.id) !== null)
    .map((l) => ({ ligne: l, motif: decideLigne(l, motifsAction) }));

  return {
    lues: lues.map(({ table, id, precision }) => ({ table, id, precision })),
    ecrites: decisions
      .filter((d) => d.motif === null)
      .map(({ ligne: { table, id, precision } }) => ({ table, id, precision })),
    ecarts: [
      ...decisions.flatMap(({ ligne: { table, id, precision }, motif }) =>
        motif === null ? [] : [{ table, id, precision, motif }]
      ),
      ...(await listSansPlace(client)),
    ],
  };
};

/**
 * Règle : une action sans dossier est une vitrine, celle d'un dossier écarté prend son motif ; une ligne satellite suit son action.
 * Le journal des actions n'est jamais repris ; une ligne satellite sans action est orpheline.
 */
const decideLigne = (
  l: LigneLue,
  motifsAction: ReadonlyMap<number, string | null>
) => {
  if (l.table === 'action') {
    return motifsAction.get(l.id) ?? null;
  }
  if (!motifsAction.has(l.action)) {
    return 'orphelin';
  }
  return (
    motifsAction.get(l.action) ??
    (l.table === 'action_historique' ? 'historique_non_repris' : null)
  );
};

/** Les lignes d'une table satellite, repérées par leur numéro ou, sans numéro, par leur action et leur valeur (« volet 2 »). */
const satellite = (table: string, id: string, precision: string) => `
  select '${table}', ${id}::int, ${precision}, action_id::int, null::int
    from reprise_tec.staging_${table}`;

/** Le motif pour lequel l'import des dossiers a écarté un dossier T&C, `null` s'il l'a repris ; arrête s'il n'a fait ni l'un ni l'autre. */
const loadMotifsDossiers = async (client: PoolClient) => {
  const { rows } = await client.query<{ tecId: number; motif: string | null }>(`
    select tec_id::int as "tecId", null as motif
      from reprise_tec.correspondance where table_cible = 'demarche'
    union all
    select tec_id::int, motif
      from reprise_tec.ecarts
     where table_source = 'demarche' and precision = ''
       and motif in ('doublon', 'coquille_vide', 'sans_etat_invisible', 'elaboration_remplacee')`);
  const motifs = new Map(rows.map((r) => [r.tecId, r.motif]));
  return (dossier: number) => {
    const motif = motifs.get(dossier);
    if (motif === undefined) {
      throw new Error(
        `Dossier T&C ${dossier} ni repris ni écarté par l'import des dossiers.`
      );
    }
    return motif;
  };
};

/** Les valeurs sans place dans une fiche, sur les actions reprises : la population couverte et le drapeau « fiche action associée » (une par colonne). */
const listSansPlace = async (client: PoolClient) => {
  const { rows } = await client.query<Ecart>(`
    select 'action' as "table", a.id::int as id, c.colonne as precision,
           'sans_place' as motif
      from reprise_tec.staging_action a
      join reprise_tec.correspondance d
        on d.table_cible = 'demarche' and d.tec_id = a.demarche_id
      cross join lateral (
        select 'population_couverte' as colonne where a.population_couverte is not null
        union all
        select 'fiche_action_associee' where a.fiche_action_associee
      ) c
     order by a.id, c.colonne`);
  return rows;
};

const toCle = ({ table, id, precision }: Ligne) =>
  `${table}|${id}|${precision}`;

/**
 * Arrête avant toute écriture si une ligne lue n'est pas écrite ou écartée exactement une fois ; rend le bilan par table.
 * Un écart de partie de ligne (population couverte, drapeau) n'entre pas dans le compte des lignes.
 */
export const validateBilan = (
  lues: readonly Ligne[],
  ecrites: readonly Ligne[],
  ecarts: readonly Ecart[]
) => {
  const traitements = new Map<string, number>(lues.map((l) => [toCle(l), 0]));
  for (const cle of [...ecrites, ...ecarts].map(toCle)) {
    if (traitements.has(cle)) {
      traitements.set(cle, (traitements.get(cle) ?? 0) + 1);
    }
  }
  const enAnomalie = [...traitements].filter(([, n]) => n !== 1);
  const ecartsEnDouble = ecarts.length - new Set(ecarts.map(toCle)).size;

  const bilan = [...new Set(lues.map((l) => l.table))].map((table) => ({
    table,
    lues: lues.filter((l) => l.table === table).length,
    ecrites: ecrites.filter((l) => l.table === table).length,
    ecartees: ecarts.filter(
      (e) => e.table === table && traitements.has(toCle(e))
    ).length,
  }));

  if (enAnomalie.length > 0 || ecartsEnDouble > 0) {
    throw new Error(
      `Bilan faux, l'import est arrêté avant toute écriture : ${enAnomalie.length} lignes ` +
        `ni écrites ni écartées, ou les deux (ex. ${enAnomalie
          .slice(0, 3)
          .map(([cle]) => cle)
          .join(', ')}) ; ${ecartsEnDouble} écarts en double.`
    );
  }
  return bilan;
};

/** Écrit les écarts dans `reprise_tec.ecarts`, par paquets de 10 000. */
export const createEcarts = async (
  client: PoolClient,
  ecarts: readonly Ecart[]
) => {
  for (let debut = 0; debut < ecarts.length; debut += 10_000) {
    const paquet = ecarts.slice(debut, debut + 10_000);
    await client.query(
      `insert into reprise_tec.ecarts (table_source, tec_id, precision, motif)
       select * from unnest($1::text[], $2::bigint[], $3::text[], $4::text[])`,
      [
        paquet.map((e) => e.table),
        paquet.map((e) => e.id),
        paquet.map((e) => e.precision),
        paquet.map((e) => e.motif),
      ]
    );
  }
};
