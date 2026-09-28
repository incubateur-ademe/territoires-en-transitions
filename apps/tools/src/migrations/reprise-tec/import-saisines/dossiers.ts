/** Les dossiers à saisir : les dossiers repris transmis pour avis ; jamais une élaboration, que la clôture de nuit passerait en instruit. */

import { PoolClient } from 'pg';

export type Dossier = {
  tecId: number;
  demarcheId: number;
  collectiviteId: number;
  collectivite: string;
};

type DossierRepris = Dossier & {
  estTransmis: boolean;
  echeanceAvis: string | null;
  aDejaUneSaisine: boolean;
};

export type Dossiers = Awaited<ReturnType<typeof loadDossiers>>;

/** Tous les dossiers repris, par numéro T&C : deux runs écrivent dans le même ordre. */
export const loadDossiers = async (client: PoolClient) => {
  const { rows } = await client.query<DossierRepris>(`
    select c.tec_id::int                     as "tecId",
           d.id                              as "demarcheId",
           d.collectivite_id                 as "collectiviteId",
           co.nom                            as collectivite,
           d.transmitted_at is not null      as "estTransmis",
           to_char(d.avis_deadline_at at time zone 'UTC', 'YYYY-MM-DD')
                                             as "echeanceAvis",
           exists (select from public.demarche_pcaet_demande_avis s
                    where s.demarche_id = d.id) as "aDejaUneSaisine"
      from reprise_tec.correspondance c
      join public.demarche d on d.id = c.tet_id
      join public.collectivite co on co.id = d.collectivite_id
     where c.table_cible = 'demarche'
     order by c.tec_id`);
  const transmis = rows.filter((d) => d.estTransmis);

  return {
    /** Les dossiers repris transmis pour avis, les seuls à saisir. */
    transmis,

    /** Garde, appelée par `gardes.ts` : aucun dossier repris, un dossier déjà saisi, ou une échéance d'avis non passée. */
    listCasBloquants: (dateDuJour: string) => [
      ...(rows.length === 0
        ? [
            "  aucun dossier repris : l'import des dossiers (import-demarches) n'a pas tourné",
          ]
        : []),
      ...rows
        .filter((d) => d.aDejaUneSaisine)
        .map((d) => `  dossier qui a déjà une saisine : ${decrireDossier(d)}`),
      ...transmis
        .filter((d) => d.echeanceAvis === null || d.echeanceAvis >= dateDuJour)
        .map(
          (d) =>
            `  échéance d'avis non passée : ${decrireDossier(d)}, échéance ${
              d.echeanceAvis ?? 'absente'
            }`
        ),
    ],
  };
};

export const decrireDossier = (d: Dossier) =>
  `T&C ${d.tecId}, démarche ${d.demarcheId}, ${d.collectivite}`;
