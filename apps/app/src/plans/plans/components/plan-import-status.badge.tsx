import { appLabels } from '@/app/labels/catalog';
import { PlanStatus, PlanStatusEnum } from '@tet/domain/plans';
import { Badge, Tooltip } from '@tet/ui';

/** Plan pas encore ouvrable : import en cours, ou en échec. */
export const PlanImportStatusBadge = ({ status }: { status: PlanStatus }) => {
  if (status === PlanStatusEnum.IMPORTING) {
    return (
      <Tooltip label={appLabels.importPlanIaEnCoursDescription}>
        <span>
          <Badge
            title={appLabels.importPlanIaEnCoursCourt}
            icon="loader-4-line"
            iconPosition="left"
            variant="info"
            size="sm"
            dataTest="plans.plan.import-en-cours-badge"
          />
        </span>
      </Tooltip>
    );
  }
  if (status === PlanStatusEnum.FAILED) {
    return (
      <Tooltip label={appLabels.importPlanIaEchecDescription}>
        <span>
          <Badge
            title={appLabels.importPlanIaEchecCourt}
            variant="error"
            size="sm"
            dataTest="plans.plan.import-echec-badge"
          />
        </span>
      </Tooltip>
    );
  }
  return null;
};
