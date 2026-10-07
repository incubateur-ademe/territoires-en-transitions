/** Les écarts : chaque fichier de dossier de T&C, écrit ou écarté avec son motif ; et la raison d'un avis qui n'est pas écrit. */

import { PoolClient } from 'pg';
import type { Ecart, Ligne } from '../import-fiches/ecarts';
import type { buildAvis } from './avis';
import type { Contenu } from './archive';
import type { Piece } from './pieces';

const TABLE = 'demarche_fichier';
const PRECISION_AVIS = 'avis';

/** Lit tous les fichiers de dossier de la copie ; rend les lignes lues, écrites (copies fondues comprises) et les écarts. */
export const loadEcarts = async (
  client: PoolClient,
  pieces: readonly Piece[],
  avis: ReturnType<typeof buildAvis>,
  contenus: ReadonlyMap<number, Contenu>
) => {
  const { rows: lues } = await client.query<{
    id: number;
    dossier: number;
    motifDossier: string | null;
  }>(
    `select f.id::int, f.demarche_id::int as dossier,
            (select e.motif from reprise_tec.ecarts e
              where e.table_source = 'demarche' and e.tec_id = f.demarche_id
                and e.precision = '') as "motifDossier"
       from reprise_tec.staging_demarche_fichier f
      order by f.id`
  );

  const retenus = new Set(
    avis.ecrits.map(
      (a) => `${a.retenu.demarcheId}|${a.retenu.contenu.empreinte}`
    )
  );
  // une liste : le bilan voit une ligne écrite deux fois
  const ecrites = [
    ...pieces.flatMap((p) => p.fichiers.map((f) => f.tecId)),
    ...[...avis.ecrits, ...avis.ecartes]
      .flatMap((a) => a.fichiers)
      .filter((f) =>
        retenus.has(`${f.demarcheId}|${contenus.get(f.tecId)?.empreinte}`)
      )
      .map((f) => f.tecId),
  ];
  const sontEcrites = new Set(ecrites);

  return {
    lues: lues.map((l): Ligne => ({ table: TABLE, id: l.id, precision: '' })),
    ecrites: ecrites.map((id): Ligne => ({ table: TABLE, id, precision: '' })),
    ecarts: [
      ...lues.flatMap((l): Ecart[] => {
        if (sontEcrites.has(l.id)) {
          return [];
        }
        if (l.motifDossier === null) {
          throw new Error(
            `Fichier T&C ${l.id} ni écrit ni sur un dossier écarté (dossier ${l.dossier}).`
          );
        }
        return [
          { table: TABLE, id: l.id, precision: '', motif: l.motifDossier },
        ];
      }),
      ...avis.ecartes.flatMap((a) =>
        a.fichiers.map(
          (f): Ecart => ({
            table: TABLE,
            id: f.tecId,
            precision: PRECISION_AVIS,
            motif: a.motif,
          })
        )
      ),
    ],
  };
};
