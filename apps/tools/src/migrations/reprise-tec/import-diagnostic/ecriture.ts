/** L'écriture : le diagnostic rangé dans son dossier, et sa trace pour l'annulation. */

import { ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS } from '@tet/domain/demarches';
import { PoolClient } from 'pg';
import type { Valeur } from './diagnostic';
import type { Dossier } from './dossiers';

/** La source que l'écran du diagnostic lit, la même que `PCAET_COLLECTIVITE_SOURCE_ID` du backend. */
const SOURCE_PCAET = {
  id: 'pcaet-collectivite',
  libelle: 'PCAET collectivité',
};

/** Écrit le diagnostic de chaque dossier qui a au moins une valeur ; rend le nombre de dossiers écrits. */
export const createDiagnostics = async (
  client: PoolClient,
  dossiers: Map<number, Dossier>,
  valeurs: readonly Valeur[]
) => {
  const indicateurs = await loadIndicateurs(client);
  await client.query(
    `insert into public.indicateur_source (id, libelle) values ($1, $2)
     on conflict (id) do nothing`,
    [SOURCE_PCAET.id, SOURCE_PCAET.libelle]
  );

  const parDossier = new Map<number, Valeur[]>();
  for (const v of valeurs) {
    const liste = parDossier.get(v.dossier) ?? [];
    liste.push(v);
    parDossier.set(v.dossier, liste);
  }
  for (const [tecId, valeursDuDossier] of parDossier) {
    const dossier = dossiers.get(tecId);
    if (!dossier) {
      throw new Error(`Dossier T&C ${tecId} absent de la correspondance.`);
    }
    await createDiagnostic(
      client,
      dossier,
      valeursDuDossier,
      indicateurs.getId
    );
  }
  return parDossier.size;
};

const createDiagnostic = async (
  client: PoolClient,
  { tecId, demarcheId, collectiviteId }: Dossier,
  valeurs: readonly Valeur[],
  getIndicateurId: (identifiant: string) => number
) => {
  await client.query(
    `with metadonnee as (
       insert into public.indicateur_source_metadonnee (source_id, date_version)
       values ($1, now())
       returning id
     ), lien as (
       insert into public.demarche_pcaet_source_metadonnee
         (demarche_id, collectivite_id, metadonnee_id)
       select $2, $3, id from metadonnee
     ), valeurs as (
       insert into public.indicateur_valeur
         (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat, objectif)
       select v.indicateur_id, $3, make_date(v.annee, 1, 1), m.id, v.resultat, v.objectif
         from unnest($4::int[], $5::int[], $6::float8[], $7::float8[])
                as v(indicateur_id, annee, resultat, objectif),
              metadonnee m
       returning id
     ), correspondance as (
       insert into reprise_tec.correspondance (table_cible, tec_id, tet_id)
       select 'indicateur_source_metadonnee', $8, id from metadonnee
     )
     insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
     select 'indicateur_source_metadonnee', id from metadonnee
     union all
     select 'demarche_pcaet_source_metadonnee', $2 from metadonnee
     union all
     select 'indicateur_valeur', id from valeurs`,
    [
      SOURCE_PCAET.id,
      demarcheId,
      collectiviteId,
      valeurs.map((v) => getIndicateurId(v.identifiant)),
      valeurs.map((v) => v.annee),
      valeurs.map((v) => (v.champ === 'resultat' ? v.valeur : null)),
      valeurs.map((v) => (v.champ === 'objectif' ? v.valeur : null)),
      tecId,
    ]
  );
};

/** L'id en base de chaque indicateur de la grille. */
const loadIndicateurs = async (client: PoolClient) => {
  const { rows } = await client.query<{ id: number; identifiant: string }>(
    `select id, identifiant_referentiel as identifiant
       from public.indicateur_definition
      where identifiant_referentiel = any($1)`,
    [ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS]
  );
  const ids = new Map(rows.map((r) => [r.identifiant, r.id]));
  return {
    /** L'id de l'indicateur qui porte ce code `cae_*` ; arrête s'il n'est pas en base. */
    getId: (identifiant: string) => {
      const id = ids.get(identifiant);
      if (id === undefined) {
        throw new Error(`Indicateur ${identifiant} absent de la base.`);
      }
      return id;
    },
  };
};
