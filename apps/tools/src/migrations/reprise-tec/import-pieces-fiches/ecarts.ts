/** Les écarts : chaque fichier et « site web » des actions de T&C, écrit ou écarté avec son motif. */

import { PoolClient } from 'pg';
import type { Ecart, Ligne } from '../import-fiches/ecarts';
import type { Fichier, UrlSiteWeb } from './pieces';
import type { UrlSiteWebValide } from './url-site-web';

// Un « site web » est une colonne de l'action : il est repéré par l'action et cette précision.
const PRECISION_URL = 'url_site_web';

type LigneLue = Ligne & {
  action: number;
  actionExiste: boolean;
  actionReprise: boolean;
  // le motif que l'import des fiches a donné à l'action
  motifAction: string | null;
};

/** Lit tous les fichiers et « site web » de la copie, actions reprises ou non ; rend les lignes lues, les écrites et les écarts. */
export const loadEcarts = async (
  client: PoolClient,
  fichiers: readonly Fichier[],
  urlsSiteWeb: {
    valides: readonly UrlSiteWebValide[];
    refuses: readonly UrlSiteWeb[];
  }
) => {
  const { rows: lues } = await client.query<LigneLue>(
    `with lues as (
       select 'action_fichier' as "table", id, '' as precision, action_id
         from reprise_tec.staging_action_fichier
       union all
       select 'action_image', id, '', action_id
         from reprise_tec.staging_action_image
       union all
       select 'action', id, $1, id
         from reprise_tec.staging_action
        where nullif(trim(url_site_web), '') is not null
     )
     select l."table", l.id::int, l.precision, l.action_id::int as action,
            exists (select from reprise_tec.staging_action a
                     where a.id = l.action_id) as "actionExiste",
            exists (select from reprise_tec.correspondance c
                     where c.table_cible = 'fiche_action'
                       and c.tec_id = l.action_id) as "actionReprise",
            (select e.motif from reprise_tec.ecarts e
              where e.table_source = 'action' and e.tec_id = l.action_id
                and e.precision = '') as "motifAction"
       from lues l
      order by 1, 2`,
    [PRECISION_URL]
  );

  return {
    lues: lues.map(({ table, id, precision }) => ({ table, id, precision })),
    ecrites: [
      ...fichiers.map((f) => ({ table: f.table, id: f.tecId, precision: '' })),
      ...urlsSiteWeb.valides.map((u) => ({
        table: 'action',
        id: u.tecId,
        precision: PRECISION_URL,
      })),
    ],
    ecarts: [
      ...lues.flatMap((l): Ecart[] => {
        const motif = decideLigne(l);
        return motif === null
          ? []
          : [{ table: l.table, id: l.id, precision: l.precision, motif }];
      }),
      ...urlsSiteWeb.refuses.map((u) => ({
        table: 'action',
        id: u.tecId,
        precision: PRECISION_URL,
        motif: 'lien_invalide',
      })),
    ],
  };
};

/** Règle : une ligne prend le motif de son action écartée par l'import des fiches ; sans action, elle est orpheline. */
const decideLigne = (l: LigneLue) => {
  if (l.actionReprise) {
    return null;
  }
  if (!l.actionExiste) {
    return 'orphelin';
  }
  if (l.motifAction === null) {
    throw new Error(
      `Action T&C ${l.action} ni reprise ni écartée par l'import des fiches.`
    );
  }
  return l.motifAction;
};
