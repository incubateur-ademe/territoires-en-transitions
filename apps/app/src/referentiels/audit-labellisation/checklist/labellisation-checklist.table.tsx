'use client';

import { makeReferentielTacheUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { ActionId, ReferentielId } from '@tet/domain/referentiels';
import { ChecklistTable, InlineLink, PillButton } from '@tet/ui';
import { ReactElement } from 'react';
import {
  MesureViewModel,
  Parcours,
  RoleMesures,
  ScoreMinimumViewModel,
} from '../checklist-view-model';
import { useRoleDropdown } from '../checklist.context';
import { ActeEngagementSection } from './acte-engagement.section';
import { formatReponseAttendue } from './format-reponse-attendue';

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
      <PillButton icon="pencil-line" onClick={onOpenDropdown}>
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
          iconPosition="left"
          href={referentielUrl}
        >
          {appLabels.voirLaListe}
        </PillButton>
      ),
    }}
    answer={appLabels.completudeReponse}
  />
);

const ScoreMinimumRow = ({
  scoreMinimum,
}: {
  scoreMinimum: ScoreMinimumViewModel;
}): ReactElement => (
  <ChecklistTable.Row
    done={scoreMinimum.done}
    criterion={{
      label: appLabels.scoreMinimumCritere({
        seuilPercent: scoreMinimum.seuilPercent,
      }),
    }}
    answer={appLabels.scoreMinimumReponse({
      seuilPercent: scoreMinimum.seuilPercent,
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
}): ReactElement => (
  <>
    {mesures.map((mesure) => (
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
          action: (
            <MesureActionButton
              mesure={mesure}
              isRoleAction={roleActionIds.has(mesure.actionId)}
              collectiviteId={collectiviteId}
              referentielId={referentielId}
              onOpenDropdown={() => onOpenDropdown(mesure.actionId)}
            />
          ),
        }}
        answer={formatReponseAttendue({
          formulation: mesure.formulation,
          minRealisePercentage: mesure.minRealisePercentage,
          minProgrammePercentage: mesure.minProgrammePercentage,
        })}
      />
    ))}
  </>
);

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
};

export const LabellisationChecklistTable = ({
  viewModel,
  collectiviteId,
  referentielId,
  referentielUrl,
}: LabellisationChecklistTableProps): ReactElement => {
  const { openDropdown } = useRoleDropdown();
  const roleActionIds = collectRoleActionIds(viewModel.roleMesures);

  return (
    <ChecklistTable>
      <ChecklistTable.Head
        labelHeader={appLabels.criteresAttendus}
        answerHeader={appLabels.reponses}
      />
      <CompletudeRow
        completude={viewModel.completude}
        referentielUrl={referentielUrl}
      />
      {viewModel.scoreMinimum && (
        <ScoreMinimumRow scoreMinimum={viewModel.scoreMinimum} />
      )}
      <MesuresRows
        mesures={viewModel.mesures}
        roleActionIds={roleActionIds}
        collectiviteId={collectiviteId}
        referentielId={referentielId}
        onOpenDropdown={openDropdown}
      />
      <ActeEngagementRow
        acteEngagement={viewModel.acteEngagement}
        referentielId={referentielId}
      />
    </ChecklistTable>
  );
};
