import { appLabels } from '@/app/labels/catalog';
import { TrajectoireSecteursEnum } from '@tet/domain/indicateurs';
import { Alert, Button } from '@tet/ui';
import { DOC_METHODO } from './trajectoire-constants';

const SECTEURS_WITH_MODELED_REFERENCE = new Set<string>([
  TrajectoireSecteursEnum.RÉSIDENTIEL,
  TrajectoireSecteursEnum.TERTIAIRE,
  TrajectoireSecteursEnum.AGRICULTURE,
]);

export const TrajectoireReferenceAlert = ({
  secteur,
}: {
  secteur?: string;
}) => {
  if (secteur && !SECTEURS_WITH_MODELED_REFERENCE.has(secteur)) {
    return null;
  }

  return (
    <Alert
      state="info"
      className="text-left"
      title={appLabels.trajectoireReferenceTitle}
      description={appLabels.trajectoireReferenceDescription}
      footer={
        <Button
          size="sm"
          variant="underlined"
          external
          href={`/${DOC_METHODO}#page=11`}
          data-test="indicateurs.trajectoires.reference-methodologie-link"
        >
          {appLabels.trajectoireReferenceMethodologie}
        </Button>
      }
    />
  );
};
