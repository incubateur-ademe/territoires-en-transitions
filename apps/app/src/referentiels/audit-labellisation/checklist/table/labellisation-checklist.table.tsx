'use client';

import { makeReferentielTacheUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import ActionStatutBadge from '@/app/referentiels/actions/action-statut/action-statut.badge';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ActionId, ReferentielId } from '@tet/domain/referentiels';
import { ChecklistTable, InlineLink, PillButton } from '@tet/ui';
import { ReactElement } from 'react';
import {
  MesureViewModel,
  Parcours,
  RoleMesures,
  MinimumScoreViewModel,
} from '../../checklist-view-model';
import { useRoleDropdown } from '../../checklist.context';
import { formatReponseAttendue } from './format-reponse-attendue';
import { ReponseAttendueLabel } from './reponse-attendue.label';
import { ActeEngagementSection } from './sections/acte-engagement.section';
import { CandidatureDocumentsRow } from './sections/candidature-documents.section';

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

const CompletudeRow = ({
  completude,
  referentielUrl,
}: {
  completude: Parcours['completude'];
  referentielUrl: string;
}): ReactElement => (
  <ChecklistTable.Row
    done={completude.done}
    criterion={{
      label: appLabels.completudeCritere,
      action: (
        <PillButton
          icon="list-check"
          iconPosition="right"
          href={referentielUrl}
        >
          {appLabels.voirLaListe}
        </PillButton>
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
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const isReadOnly = !hasCollectivitePermission('referentiels.mutate');

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

const ActeEngagementRow = ({
  acteEngagement,
  referentielId,
}: {
  acteEngagement: Parcours['acteEngagement'];
  referentielId: ReferentielId;
}): ReactElement => (
  <ChecklistTable.Row
    done={acteEngagement.signed}
    criterion={{
      label: <ActeEngagementCriterion referentielId={referentielId} />,
    }}
    answer={
      <ActeEngagementSection
        signed={acteEngagement.signed}
        demandeId={acteEngagement.demandeId}
      />
    }
  />
);

type LabellisationChecklistTableProps = {
  viewModel: Parcours;
  collectiviteId: number;
  referentielId: ReferentielId;
  referentielUrl: string;
  showActeEngagement: boolean;
  showCandidatureDocuments: boolean;
};

export const LabellisationChecklistTable = ({
  viewModel,
  collectiviteId,
  referentielId,
  referentielUrl,
  showActeEngagement,
  showCandidatureDocuments,
}: LabellisationChecklistTableProps): ReactElement => {
  const { openDropdown } = useRoleDropdown();
  const roleActionIds = collectRoleActionIds(viewModel.roleMesures);

  return (
    <ChecklistTable>
      <ChecklistTable.Head
        labelHeader={appLabels.criteres}
        answerHeader={appLabels.elementsAttendus}
      />
      <CompletudeRow
        completude={viewModel.completude}
        referentielUrl={referentielUrl}
      />
      <MinimumScoreRow minimumScore={viewModel.minimumScore} />
      <MesuresRows
        mesures={viewModel.mesures}
        roleActionIds={roleActionIds}
        collectiviteId={collectiviteId}
        referentielId={referentielId}
        onOpenDropdown={openDropdown}
      />
      {showActeEngagement && (
        <ActeEngagementRow
          acteEngagement={viewModel.acteEngagement}
          referentielId={referentielId}
        />
      )}
      {showCandidatureDocuments && <CandidatureDocumentsRow />}
    </ChecklistTable>
  );
};
