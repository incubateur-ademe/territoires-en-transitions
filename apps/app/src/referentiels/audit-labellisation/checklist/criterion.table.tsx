'use client';

import { makeReferentielTacheUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ActionId, ReferentielId } from '@tet/domain/referentiels';
import { InlineLink, PillButton, ReactTable, TableRow } from '@tet/ui';
import { ReactElement, ReactNode, useMemo } from 'react';
import { useRoleDropdown } from '../checklist.context';
import {
  MesureViewModel,
  Parcours,
  RoleMesures,
  ScoreMinimumViewModel,
} from '../checklist-view-model';
import { ActeEngagementSection } from './acte-engagement.section';
import {
  BorderedCell,
  BorderedHeaderCell,
  CompletionIconCell,
  CriterionCell,
} from './cells';
import { formatReponseAttendue } from './format-reponse-attendue';

type ChecklistRowId =
  | 'completude'
  | 'score-minimum'
  | 'acte-engagement'
  | ActionId;

type ChecklistRow = {
  id: ChecklistRowId;
  done: boolean;
  criterion: ReactNode;
  criterionAction?: ReactNode;
  answer: ReactNode;
};

const columnHelper = createColumnHelper<ChecklistRow>();

const columns = [
  columnHelper.display({
    id: 'done',
    header: () => <BorderedHeaderCell className="w-12" />,
    cell: (info) => <CompletionIconCell done={info.row.original.done} />,
  }),
  columnHelper.accessor('criterion', {
    header: () => (
      <BorderedHeaderCell title={appLabels.criteresAttendus} />
    ),
    cell: (info) => (
      <CriterionCell
        criterion={info.getValue()}
        criterionAction={info.row.original.criterionAction}
      />
    ),
  }),
  columnHelper.accessor('answer', {
    header: () => (
      <BorderedHeaderCell
        title={appLabels.reponses}
        className="w-1/3"
      />
    ),
    cell: (info) => (
      <BorderedCell className="align-middle text-grey-8">
        {info.getValue()}
      </BorderedCell>
    ),
  }),
];

const CritereWithIdentifiant = ({
  formulation,
  identifiant,
}: {
  formulation: string;
  identifiant: string;
}): ReactElement => (
  <>
    {formulation}
    <span className="ml-2 text-xs text-grey-6">{identifiant}</span>
  </>
);

const ActeEngagementCriterion = ({
  referentielId,
}: {
  referentielId: ReferentielId;
}): ReactElement => (
  <div className="flex flex-col gap-2">
    <span>{appLabels.acteEngagementDescription}</span>
    <div className="flex gap-4 flex-wrap">
      <InlineLink href={appLabels.acteEngagementDocUrl} openInNewTab>
        {appLabels.acteEngagementDownloadLink}
      </InlineLink>
      <InlineLink
        href={appLabels.reglementLabelUrl({ referentielId })}
        openInNewTab
      >
        {appLabels.acteEngagementReglementLink}
      </InlineLink>
    </div>
  </div>
);

const buildCompletudeRow = ({
  completude,
  detailHref,
}: {
  completude: Parcours['completude'];
  detailHref: string;
}): ChecklistRow => ({
  id: 'completude',
  done: completude.done,
  criterion: appLabels.completudeCritere,
  criterionAction: (
    <PillButton icon="list-check" iconPosition="left" href={detailHref}>
      {appLabels.voirLaListe}
    </PillButton>
  ),
  answer: appLabels.completudeReponse,
});

const buildScoreMinimumRow = (
  scoreMinimum: ScoreMinimumViewModel
): ChecklistRow => ({
  id: 'score-minimum',
  done: scoreMinimum.done,
  criterion: appLabels.scoreMinimumCritere({
    seuilPercent: scoreMinimum.seuilPercent,
  }),
  answer: appLabels.scoreMinimumReponse({
    seuilPercent: scoreMinimum.seuilPercent,
  }),
});

const collectRoleActionIds = (roleMesures: RoleMesures): Set<ActionId> =>
  new Set(
    Object.values(roleMesures)
      .map((role) => role?.actionId)
      .filter((id): id is ActionId => id !== undefined)
  );

const buildMesureRow = ({
  mesure,
  collectiviteId,
  referentielId,
  roleActionIds,
  openRoleDropdown,
}: {
  mesure: MesureViewModel;
  collectiviteId: number;
  referentielId: ReferentielId;
  roleActionIds: Set<ActionId>;
  openRoleDropdown: (actionId: ActionId) => void;
}): ChecklistRow => {
  const isRole = roleActionIds.has(mesure.actionId);
  const criterionAction = isRole ? (
    <PillButton
      icon="pencil-line"
      onClick={() => openRoleDropdown(mesure.actionId)}
    >
      {appLabels.renseigner}
    </PillButton>
  ) : (
    <PillButton
      icon="arrow-right-line"
      href={makeReferentielTacheUrl({
        collectiviteId,
        actionId: mesure.actionId,
        referentielId,
      })}
    >
      {appLabels.voirLaMesure}
    </PillButton>
  );

  return {
    id: mesure.actionId,
    done: mesure.done,
    criterion: (
      <CritereWithIdentifiant
        formulation={mesure.formulation}
        identifiant={mesure.identifiant}
      />
    ),
    criterionAction,
    answer: formatReponseAttendue({
      formulation: mesure.formulation,
      minRealisePercentage: mesure.minRealisePercentage,
      minProgrammePercentage: mesure.minProgrammePercentage,
    }),
  };
};

const buildActeEngagementRow = ({
  acteEngagement,
  referentielId,
}: {
  acteEngagement: Parcours['acteEngagement'];
  referentielId: ReferentielId;
}): ChecklistRow => ({
  id: 'acte-engagement',
  done: acteEngagement.signed,
  criterion: <ActeEngagementCriterion referentielId={referentielId} />,
  answer: (
    <ActeEngagementSection
      signed={acteEngagement.signed}
      demandeId={acteEngagement.demandeId}
    />
  ),
});

const buildRows = ({
  viewModel,
  collectiviteId,
  referentielId,
  referentielUrl,
  openRoleDropdown,
}: {
  viewModel: Parcours;
  collectiviteId: number;
  referentielId: ReferentielId;
  referentielUrl: string;
  openRoleDropdown: (actionId: string) => void;
}): ChecklistRow[] => {
  const roleActionIds = collectRoleActionIds(viewModel.roleMesures);
  return [
    buildCompletudeRow({
      completude: viewModel.completude,
      detailHref: referentielUrl,
    }),
    ...(viewModel.scoreMinimum
      ? [buildScoreMinimumRow(viewModel.scoreMinimum)]
      : []),
    ...viewModel.mesures.map((mesure) =>
      buildMesureRow({
        mesure,
        collectiviteId,
        referentielId,
        roleActionIds,
        openRoleDropdown,
      })
    ),
    buildActeEngagementRow({
      acteEngagement: viewModel.acteEngagement,
      referentielId,
    }),
  ];
};

type ChecklistTableProps = {
  viewModel: Parcours;
  collectiviteId: number;
  referentielId: ReferentielId;
  referentielUrl: string;
};

export const CriterionTable = ({
  viewModel,
  collectiviteId,
  referentielId,
  referentielUrl,
}: ChecklistTableProps): ReactElement => {
  const { openDropdown } = useRoleDropdown();
  const rows = useMemo(
    () =>
      buildRows({
        viewModel,
        collectiviteId,
        referentielId,
        referentielUrl,
        openRoleDropdown: openDropdown,
      }),
    [viewModel, collectiviteId, referentielId, referentielUrl, openDropdown]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <div className="border border-grey-4 rounded-md overflow-hidden">
      <ReactTable
        table={table}
        rowWrapper={({ children }) => (
          <TableRow className="text-sm text-primary-9 hover:bg-primary-1">
          {children}
        </TableRow>
        )}
      />
    </div>
  );
};
