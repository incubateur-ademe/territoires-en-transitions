/** Les démarches déjà dans TeT : ce qui existe, pour que l'import ne marche pas dessus. */

import {
  DEMARCHE_PCAET_EN_COURS_STATUSES,
  DemarchePcaetStatusEnum,
  DemarcheTypeEnum,
} from '@tet/domain/demarches';
import { PoolClient } from 'pg';
import type { Collectivites } from './collectivites';
import { decrireDossier, type Dossier } from './dossier';

export type DemarchesTet = Awaited<ReturnType<typeof loadDemarchesTet>>;

type DemarcheTet = {
  id: number;
  collectiviteId: number;
  status: string;
};

const STATUTS_ACTIFS: string[] = [
  DemarchePcaetStatusEnum.EN_ELABORATION,
  DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS,
  DemarchePcaetStatusEnum.INSTRUIT_HORS_PLATEFORME,
];

const STATUTS_EN_COURS: string[] = [...DEMARCHE_PCAET_EN_COURS_STATUSES];

/** Lit les démarches PCAET en cours déjà dans TeT. */
export const loadDemarchesTet = async (client: PoolClient) => {
  const demarchesTet = await listDemarchesEnCours(client);

  const findDemarchesTet = (d: Dossier, statuts: string[]) =>
    statuts.includes(d.colonnes.status)
      ? demarchesTet.filter(
          (t) =>
            t.collectiviteId === d.colonnes.collectiviteId &&
            statuts.includes(t.status)
        )
      : [];

  return {
    /**
     * Garde, appelée par `gardes.ts` : liste les cas bloquants, un par ligne.
     * - D4 : la collectivité d'un dossier actif a déjà une démarche active dans TeT.
     */
    listCasBloquants: (
      dossiers: readonly Dossier[],
      collectivites: Collectivites
    ) =>
      dossiers.flatMap((d) =>
        findDemarchesTet(d, STATUTS_ACTIFS).map(
          (t) =>
            `  démarche déjà active dans TeT (D4) : ${collectivites.decrire(
              d.tecId
            )}, ${decrireDossier(d)} (${
              d.colonnes.status
            }) face à la démarche TeT ${t.id} (${t.status})`
        )
      ),

    /**
     * D4 sans blocage : les collectivités qui auront plusieurs dossiers en cours,
     * repris ou déjà dans TeT ; leur bouton « Nouvelle démarche » sera grisé.
     */
    listDeuxDossiersEnCours: (
      dossiers: readonly Dossier[],
      collectivites: Collectivites
    ) => {
      const reprisEnCours = new Map<number, Dossier[]>();
      for (const d of dossiers) {
        const collectivite = d.colonnes.collectiviteId;
        if (
          collectivite !== null &&
          STATUTS_EN_COURS.includes(d.colonnes.status)
        ) {
          reprisEnCours.set(collectivite, [
            ...(reprisEnCours.get(collectivite) ?? []),
            d,
          ]);
        }
      }

      return [...reprisEnCours].flatMap(([collectivite, repris]) => {
        const dejaDansTet = demarchesTet.filter(
          (t) => t.collectiviteId === collectivite
        );
        if (repris.length + dejaDansTet.length < 2) {
          return [];
        }
        const enCours = [
          ...repris.map((d) => `${decrireDossier(d)} (${d.colonnes.status})`),
          ...dejaDansTet.map((t) => `la démarche TeT ${t.id} (${t.status})`),
        ];
        return [
          `  ${collectivites.decrire(repris[0].tecId)} : ${enCours.join(
            ' et '
          )}`,
        ];
      });
    },
  };
};

/**
 *  Hors celles écrites par la reprise
 */
const listDemarchesEnCours = async (
  client: PoolClient
): Promise<DemarcheTet[]> => {
  const { rows } = await client.query<DemarcheTet>(
    `select d.id,
            d.collectivite_id as "collectiviteId",
            d.status
       from public.demarche d
      where d.type = $1
        and d.status = any($2)
        and d.id not in (select ligne_id from reprise_tec.lignes_ecrites
                          where table_cible = 'demarche')`,
    [DemarcheTypeEnum.PCAET, STATUTS_EN_COURS]
  );
  return rows;
};
