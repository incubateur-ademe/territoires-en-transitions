import { appLabels } from '@/app/labels/catalog';
import { Alert } from '@tet/ui';

export const AiImportIntroductionAlert = ({
  description,
}: {
  description: string;
}) => (
  <Alert
    state="info"
    title={appLabels.importPlanIaRelireTitre}
    description={
      <>
        <p className="mb-2">{description}</p>
        <p className="mb-2">{appLabels.importPlanIaAvertissement}</p>
        <p className="mb-0">{appLabels.importPlanIaContact}</p>
      </>
    }
  />
);
