import { PoolClient } from 'pg';
import type { Ecart } from '../import-fiches/ecarts';
import { loadMotifsDossiers } from '../import-fiches/ecarts';
import type { Valeur } from './fusion';
import type { Ligne } from './lignes';

const TABLE = 'demarche_domaine_vulnerabilite';

export const loadEcarts = async (
  client: PoolClient,
  valeurs: readonly Valeur[]
) => {
  const { rows: lues } = await client.query<{ id: number; dossier: number }>(
    `select id::int, demarche_id::int as dossier
       from reprise_tec.staging_demarche_domaine_vulnerabilite
      order by id`
  );
  const getMotifDossier = await loadMotifsDossiers(client);
  const parLigne = new Map(
    valeurs.flatMap((valeur) =>
      valeur.lignes.map(({ ligne, ecrite }) => [
        ligne.id,
        { ligne, ecrite, valeur },
      ])
    )
  );

  const ecarts = lues.flatMap(({ id, dossier }): Ecart[] => {
    const motifDossier = getMotifDossier(dossier);
    if (motifDossier !== null) {
      return [{ table: TABLE, id, precision: '', motif: motifDossier }];
    }
    const lue = parLigne.get(id);
    if (lue === undefined) {
      return [
        { table: TABLE, id, precision: '', motif: 'libelle_non_normalise' },
      ];
    }
    if (!lue.ecrite) {
      return [{ table: TABLE, id, precision: '', motif: decideLigne(lue) }];
    }
    return listPartiesPerdues(lue).map(([precision, motif]) => ({
      table: TABLE,
      id,
      precision,
      motif,
    }));
  });

  return {
    lues: lues.map(({ id }) => ({ table: TABLE, id, precision: '' })),
    ecrites: [...parLigne.values()]
      .filter((l) => l.ecrite)
      .map(({ ligne }) => ({ table: TABLE, id: ligne.id, precision: '' })),
    ecarts,
  };
};

type LigneLue = { ligne: Ligne; valeur: Valeur };

const decideLigne = ({ ligne, valeur }: LigneLue) => {
  const { niveau, oui, texte } = ligne.vulnerable;
  if (niveau === 'non_concerne') {
    if ('label' in valeur.thematique) {
      return 'non_concerne_hors_socle';
    }
    if (valeur.niveau === null) {
      return 'non_masque_par_oui';
    }
  }
  if (niveau !== null) {
    return 'niveau_masque';
  }
  if (oui) {
    return 'oui_sans_niveau';
  }
  return texte === null ? 'valeur_vide' : 'niveau_non_intelligible';
};

const listPartiesPerdues = ({
  ligne,
  valeur,
}: LigneLue): (readonly [string, string])[] => {
  const { niveau, oui, texte } = ligne.vulnerable;
  const vulnerable =
    niveau !== null && niveau !== valeur.niveau
      ? niveau === 'non_concerne' && valeur.niveau === null
        ? 'non_masque_par_oui'
        : 'niveau_masque'
      : oui
      ? 'oui_sans_niveau'
      : texte === null
      ? null
      : niveau === null
      ? 'niveau_non_intelligible'
      : 'texte_sans_place';
  return [
    ...(vulnerable === null ? [] : [['vulnerable', vulnerable] as const]),
    ...(ligne.objectif.motif === null
      ? []
      : [['objectif_fixe', ligne.objectif.motif] as const]),
  ];
};
