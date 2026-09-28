/** Les dossiers repris : ceux que la tranche 2 a écrits, où le diagnostic se range. */

import { PoolClient } from 'pg';

export type Dossier = {
  tecId: number;
  demarcheId: number;
  collectiviteId: number;
};

export type Dossiers = Awaited<ReturnType<typeof loadDossiers>>;

/** Les dossiers écrits par la tranche 2, avec leur collectivité et s'ils ont déjà un diagnostic rangé, et les motifs des dossiers écartés. */
export const loadDossiers = async (client: PoolClient) => {
  const { rows } = await client.query<
    Dossier & { collectivite: string; aDejaUnDiagnostic: boolean }
  >(`
    select c.tec_id::int         as "tecId",
           d.id                  as "demarcheId",
           d.collectivite_id     as "collectiviteId",
           co.nom                as collectivite,
           exists (select from public.demarche_pcaet_source_metadonnee l
                    where l.demarche_id = d.id) as "aDejaUnDiagnostic"
      from reprise_tec.correspondance c
      join public.demarche d on d.id = c.tet_id
      join public.collectivite co on co.id = d.collectivite_id
     where c.table_cible = 'demarche'
     order by c.tec_id`);
  const dossiers = new Map<number, Dossier>(rows.map((d) => [d.tecId, d]));
  const { rows: ecartes } = await client.query<{
    tecId: number;
    motif: string;
  }>(`
    select tec_id::int as "tecId", motif
      from reprise_tec.ecarts
     where table_source = 'demarche' and precision = ''`);
  const motifs = new Map(ecartes.map((e) => [e.tecId, e.motif]));

  return {
    /** Le dossier repris qui porte ce numéro T&C, s'il y en a un. */
    get: (tecId: number) => dossiers.get(tecId),

    /** Le motif de la tranche 2 pour un dossier non repris (`doublon`…), que prennent ses lignes ; `null` s'il est repris. */
    getMotifEcart: (tecId: number) => {
      if (dossiers.has(tecId)) {
        return null;
      }
      const motif = motifs.get(tecId);
      if (motif === undefined) {
        throw new Error(
          `Dossier T&C ${tecId} ni repris ni écarté par la tranche 2.`
        );
      }
      return motif;
    },

    /** Garde, appelée par `gardes.ts` : aucun dossier repris, ou un dossier qui a déjà un diagnostic rangé. */
    listCasBloquants: () => [
      ...(rows.length === 0
        ? [
            "  aucun dossier repris : la tranche 2 (import-demarches) n'a pas tourné",
          ]
        : []),
      ...rows
        .filter((d) => d.aDejaUnDiagnostic)
        .map(
          (d) =>
            `  dossier qui a déjà un diagnostic rangé : T&C ${d.tecId}, démarche ${d.demarcheId}, ${d.collectivite}`
        ),
    ],
  };
};
