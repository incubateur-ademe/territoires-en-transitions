'use client';

import { makeReferentielTacheUrl, makeReferentielUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import ActionStatutBadge from '@/app/referentiels/actions/action-statut/action-statut.badge';
import { useShowReferentielTableColumn } from '@/app/referentiels/referentiel.table/use-referentiel-table-column-visibility';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  ActionId,
  ReferentielId,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { ChecklistTable, PillButton } from '@tet/ui';
import { ReactElement } from 'react';
import {
  MesureViewModel,
  Parcours,
  RoleMesures,
  MinimumScoreViewModel,
} from '../../checklist-view-model';
import { useChecklist, useRoleDropdown } from '../../checklist.context';
import { formatReponseAttendue } from './format-reponse-attendue';
import { ReponseAttendueLabel } from './reponse-attendue.label';
import { ActeEngagementRow } from './sections/acte-engagement.section';
import { CandidatureDocumentsRow } from './sections/candidature-documents/candidature-documents.section';

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

const collectRoleActionIds = (
  roleMesures: RoleMesures
): ReadonlySet<ActionId> =>
  new Set(
    Object.values(roleMesures)
      .map((role) => role?.actionId)
      .filter((id): id is ActionId => id !== undefined)
  );

const MesureActionButton = ({
  mesure,
  isRoleAction,
  collectiviteId,
  referentielId,
  onOpenDropdown,
}: {
  mesure: MesureViewModel;
  isRoleAction: boolean;
  collectiviteId: number;
  referentielId: ReferentielId;
  onOpenDropdown: () => void;
}): ReactElement => {
  if (isRoleAction) {
    return (
      <PillButton
        icon="pencil-line"
        onClick={onOpenDropdown}
        iconPosition="right"
      >
        {appLabels.renseigner}
      </PillButton>
    );
  }
  return (
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
};

const MesuresNonRenseigneesButton = ({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
}): ReactElement => {
  const showColumn = useShowReferentielTableColumn();

  return (
    <PillButton
      icon="arrow-right-line"
      href={makeReferentielUrl({
        collectiviteId,
        referentielId,
        filters: { statuts: [StatutAvancementEnum.NON_RENSEIGNE] },
      })}
      onClick={() => showColumn('statut')}
    >
      {appLabels.voirLesMesures}
    </PillButton>
  );
};

type CompletudeRowProps = {
  completude: Parcours['completude'];
  collectiviteId: number;
  referentielId: ReferentielId;
};

const CompletudeRow = ({
  completude,
  collectiviteId,
  referentielId,
}: CompletudeRowProps): ReactElement => (
  <ChecklistTable.Row
    done={completude.done}
    criterion={{
      label: appLabels.completudeCritere,
      action: (
        <MesuresNonRenseigneesButton
          collectiviteId={collectiviteId}
          referentielId={referentielId}
        />
      ),
    }}
    answer={
      <span className="inline-flex flex-wrap items-center gap-1">
        {appLabels.completudeReponsePrefix}
        <ActionStatutBadge statut="non_renseigne" />
      </span>
    }
  />
);

const MinimumScoreRow = ({
  minimumScore,
}: {
  minimumScore: MinimumScoreViewModel;
}): ReactElement => (
  <ChecklistTable.Row
    done={minimumScore.done}
    criterion={{
      label: appLabels.minimumScoreCritere({
        seuilPercent: minimumScore.seuilPercent,
      }),
    }}
    answer={appLabels.minimumScoreReponse({
      seuilPercent: minimumScore.seuilPercent,
    })}
  />
);

const MesuresRows = ({
  mesures,
  roleActionIds,
  collectiviteId,
  referentielId,
  onOpenDropdown,
}: {
  mesures: readonly MesureViewModel[];
  roleActionIds: ReadonlySet<ActionId>;
  collectiviteId: number;
  referentielId: ReferentielId;
  onOpenDropdown: (actionId: ActionId) => void;
}): ReactElement => {
  const { hasReferentielPermission } = useCurrentCollectivite();
  const isReadOnly = !hasReferentielPermission(
    'referentiels.mutate',
    referentielId
  );

  return (
    <>
      {mesures.map((mesure) => {
        const isRoleAction = roleActionIds.has(mesure.actionId);
        const hideAction = isReadOnly && isRoleAction;
        return (
          <ChecklistTable.Row
            key={mesure.actionId}
            done={mesure.done}
            criterion={{
              label: (
                <CritereWithIdentifiant
                  formulation={mesure.formulation}
                  identifiant={mesure.identifiant}
                />
              ),
              action: hideAction ? undefined : (
                <MesureActionButton
                  mesure={mesure}
                  isRoleAction={isRoleAction}
                  collectiviteId={collectiviteId}
                  referentielId={referentielId}
                  onOpenDropdown={() => onOpenDropdown(mesure.actionId)}
                />
              ),
            }}
            answer={
              <ReponseAttendueLabel
                value={formatReponseAttendue({
                  formulation: mesure.formulation,
                  minRealisePercentage: mesure.minRealisePercentage,
                  minProgrammePercentage: mesure.minProgrammePercentage,
                })}
              />
            }
          />
        );
      })}
    </>
  );
};

type LabellisationChecklistTableProps = {
  viewModel: Parcours;
  collectiviteId: number;
  referentielId: ReferentielId;
};

export const LabellisationChecklistTable = ({
  viewModel,
  collectiviteId,
  referentielId,
}: LabellisationChecklistTableProps): ReactElement => {
  const { openDropdown } = useRoleDropdown();
  const { showActeEngagement, showCandidatureDocuments } = useChecklist();
  const roleActionIds = collectRoleActionIds(viewModel.roleMesures);

  return (
    <ChecklistTable>
      <ChecklistTable.Head
        labelHeader={appLabels.criteres}
        answerHeader={appLabels.elementsAttendus}
      />
      <CompletudeRow
        completude={viewModel.completude}
        collectiviteId={collectiviteId}
        referentielId={referentielId}
      />
      <MinimumScoreRow minimumScore={viewModel.minimumScore} />
      <MesuresRows
        mesures={viewModel.mesures}
        roleActionIds={roleActionIds}
        collectiviteId={collectiviteId}
        referentielId={referentielId}
        onOpenDropdown={openDropdown}
      />
      {showActeEngagement && <ActeEngagementRow />}
      {showCandidatureDocuments && <CandidatureDocumentsRow />}
    </ChecklistTable>
  );
};
