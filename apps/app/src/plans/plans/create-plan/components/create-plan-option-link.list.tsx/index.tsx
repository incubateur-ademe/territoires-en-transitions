'use client';
import { appLabels } from '@/app/labels/catalog';
import {
  makeCollectivitePlansActionsCreerUrl,
  makeCollectivitePlansActionsImporterIaUrl,
  makeCollectivitePlansActionsImporterUrl,
} from '@/app/app/paths';
import { useSuperAdminMode } from '@/app/users/authorizations/super-admin-mode/super-admin-mode.provider';
import { Event, useEventTracker, VisibleWhen } from '@tet/ui';
import CreatePlanPicto from './create.svg';
import ImportPlanPicto from './import.svg';
import { Link } from './link';

export const CreatePlanOptionLinksList = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => {
  const tracker = useEventTracker();
  const { isSuperAdminRoleEnabled } = useSuperAdminMode();
  return (
    <div data-test="choix-creation-plan" className="flex gap-4">
      <Link
        variant="primary"
        title="Créer un plan"
        subTitle="directement sur la plateforme"
        icon={<CreatePlanPicto />}
        url={makeCollectivitePlansActionsCreerUrl({
          collectiviteId,
        })}
        onClickCallback={() => {
          tracker(Event.plans.createPlan);
        }}
      />
      <Link
        title="Importer un plan"
        subTitle="à partir d’un modèle"
        icon={<ImportPlanPicto />}
        url={makeCollectivitePlansActionsImporterUrl({
          collectiviteId,
        })}
        onClickCallback={() => {
          tracker(Event.plans.importPlan);
        }}
      />
      <VisibleWhen condition={isSuperAdminRoleEnabled}>
        <Link
          title={appLabels.importPlanIaTitre}
          subTitle={appLabels.importPlanIaSousTitre}
          icon={<ImportPlanPicto />}
          url={makeCollectivitePlansActionsImporterIaUrl({
            collectiviteId,
          })}
          onClickCallback={() => {
            tracker(Event.plans.importPlan);
          }}
        />
      </VisibleWhen>
    </div>
  );
};
