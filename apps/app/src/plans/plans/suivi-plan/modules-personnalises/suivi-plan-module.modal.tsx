import { FichesActionCountByModal } from '@/app/tableaux-de-bord/plans-action/fiches-action-count-by/fiches-action-count-by.modal';
import {
  SuiviPlanModule,
  suiviPlanCountByPropertyEnumSchema,
  UpsertSuiviPlanModuleInput,
} from '@tet/domain/metrics';
import { ModalProps } from '@tet/ui';
import { useUpsertSuiviPlanModule } from '../data/use-upsert-suivi-plan-module';

export const SuiviPlanModuleModal = ({
  planId,
  module,
  openState,
}: {
  planId: number;
  module?: SuiviPlanModule;
  openState: ModalProps['openState'];
}) => {
  const { mutate: upsertModule } = useUpsertSuiviPlanModule();

  return (
    <FichesActionCountByModal
      openState={openState}
      initialValues={
        module
          ? {
              titre: module.titre,
              countByProperty: module.options.countByProperty,
              filtre: module.options.filtre,
            }
          : undefined
      }
      countByProperties={suiviPlanCountByPropertyEnumSchema.options}
      readonlyFilters={{ planActionIds: [planId] }}
      onSave={({ titre, countByProperty, filtre }) =>
        upsertModule({
          planId,
          id: module?.id,
          titre,
          options: {
            countByProperty:
              countByProperty as UpsertSuiviPlanModuleInput['options']['countByProperty'],
            filtre: { ...filtre, planActionIds: [planId] },
          },
        })
      }
    />
  );
};
