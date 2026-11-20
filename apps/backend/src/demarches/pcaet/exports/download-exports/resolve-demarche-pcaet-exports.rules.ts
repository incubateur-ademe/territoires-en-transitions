import {
  DemarchePcaetStatusEnum,
  type DemarchePcaetStatus,
} from '@tet/domain/demarches';
import {
  DEMARCHE_PCAET_EXPORT_TRANSITIONS,
  type DemarchePcaetExportRow,
  type DemarchePcaetExportTransition,
} from '../../shared/models/demarche-pcaet-export.table';

/** Les deux classeurs que connaît le front : la variante du plan est choisie ici. */
export const DEMARCHE_PCAET_EXPORT_KINDS = ['plan', 'indicateurs'] as const;
export type DemarchePcaetExportKind =
  (typeof DEMARCHE_PCAET_EXPORT_KINDS)[number];

export type DemarchePcaetExportSnapshotRow = Pick<
  DemarchePcaetExportRow,
  'transition' | 'type' | 'createdAt' | 'storagePath' | 'filename'
>;

/**
 * Ce qu'un lecteur reçoit d'un dépôt :
 * - `snapshot` : l'export figé de la dernière transition, classeur par classeur
 *   (`null` pour un classeur qu'il ne contient pas) ;
 * - `on_demand` : pas d'export figé, le classeur se construit sur l'état du
 *   jour ;
 * - `none` : dépôt en élaboration, rien n'est encore déposé.
 */
export type DemarchePcaetExportSources<
  Row extends DemarchePcaetExportSnapshotRow = DemarchePcaetExportSnapshotRow
> =
  | { source: 'none' }
  | { source: 'on_demand' }
  | {
      source: 'snapshot';
      transition: DemarchePcaetExportTransition;
      rows: Record<DemarchePcaetExportKind, Row | null>;
    };

/**
 * Choisit ce qui est servi. L'export figé prime : dès qu'il existe, c'est lui,
 * jamais un mélange avec l'export du jour. Seule la dernière transition compte,
 * et le repli d'une variante à l'autre reste dans cette transition : un export
 * figé plus ancien ne montre pas le dépôt tel qu'il a été soumis en dernier.
 *
 * `lectureSeule` (membre d'un EPCI couvert par le dépôt d'un Supra) : le plan
 * servi est `plan_expurge`, ou `plan` quand la transition n'en a pas produit —
 * son absence veut dire « aucune fiche restreinte ».
 */
export const resolveDemarchePcaetExportSources = <
  Row extends DemarchePcaetExportSnapshotRow
>({
  status,
  rows,
  lectureSeule,
}: {
  status: DemarchePcaetStatus;
  rows: readonly Row[];
  lectureSeule: boolean;
}): DemarchePcaetExportSources<Row> => {
  const transition = findLatestTransition(rows);
  if (transition !== null) {
    const ofTransition = rows.filter((row) => row.transition === transition);
    const find = (type: Row['type']) =>
      ofTransition.find((row) => row.type === type) ?? null;
    return {
      source: 'snapshot',
      transition,
      rows: {
        plan: lectureSeule
          ? find('plan_expurge') ?? find('plan')
          : find('plan'),
        indicateurs: find('indicateurs'),
      },
    };
  }
  return status === DemarchePcaetStatusEnum.EN_ELABORATION
    ? { source: 'none' }
    : { source: 'on_demand' };
};

/**
 * La transition la plus récente. À date égale, l'ordre du cycle tranche : la
 * publication suit la transmission.
 */
const findLatestTransition = (
  rows: readonly DemarchePcaetExportSnapshotRow[]
): DemarchePcaetExportTransition | null => {
  let latest: DemarchePcaetExportSnapshotRow | null = null;
  for (const row of rows) {
    if (latest === null || compareRows(row, latest) > 0) {
      latest = row;
    }
  }
  return latest?.transition ?? null;
};

const compareRows = (
  a: DemarchePcaetExportSnapshotRow,
  b: DemarchePcaetExportSnapshotRow
): number =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
  DEMARCHE_PCAET_EXPORT_TRANSITIONS.indexOf(a.transition) -
    DEMARCHE_PCAET_EXPORT_TRANSITIONS.indexOf(b.transition);
