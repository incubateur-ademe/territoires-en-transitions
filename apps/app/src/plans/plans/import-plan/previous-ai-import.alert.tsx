import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { Alert } from '@tet/ui';
import { PreviousAiImport } from './data/use-find-previous-ai-import';

export const PreviousAiImportAlert = ({
  previousImport,
}: {
  previousImport: PreviousAiImport;
}) => (
  <div data-test="ai-import.deja-importe">
    <Alert
      state="warning"
      title={appLabels.importPlanIaDejaImporteTitre}
      description={appLabels.importPlanIaDejaImporteDescription({
        date: getTextFormattedDate({ date: previousImport.importedAt }),
        planNom: previousImport.planNom ?? appLabels.sansTitre,
      })}
    />
  </div>
);
