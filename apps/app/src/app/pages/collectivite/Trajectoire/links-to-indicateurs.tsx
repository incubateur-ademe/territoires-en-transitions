import {
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Dataset } from '@/app/ui/charts/echarts/utils';
import { Button } from '@tet/ui';

type IndicateurWithId = Dataset & {
  id: string;
  name: string;
};

/** Liens vers les fiches des indicateurs d'un secteur et de ses sous-secteurs */
export const LinksToIndicateurs = ({
  indicateurData,
  collectiviteId,
  indicateurView,
}: {
  indicateurData: IndicateurWithId | IndicateurWithId[];
  collectiviteId: number;
  indicateurView: IndicateurViewParamOption | undefined;
  className?: string;
}) => {
  const hasSingleIndicateur = !Array.isArray(indicateurData);

  if (hasSingleIndicateur) {
    return (
      <Button
        size="sm"
        variant="underlined"
        external
        href={makeCollectiviteIndicateursUrl({
          collectiviteId,
          indicateurView,
          identifiantReferentiel: indicateurData.id,
        })}
        aria-label={`Consulter la fiche de l'indicateur ${indicateurData.name}`}
      >
        {appLabels.voirFicheIndicateur}
      </Button>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <div className="text-primary-8 text-xs font-medium mb-1">
        {appLabels.trajectoireVoirFichesIndicateurs}
      </div>
      <ul role="list" className="flex gap-4 items-end mb-0">
        {indicateurData.map((indicateur) => (
          <li key={indicateur.id}>
            <Button
              size="xs"
              variant="underlined"
              external
              href={makeCollectiviteIndicateursUrl({
                collectiviteId,
                indicateurView,
                identifiantReferentiel: indicateur.id,
              })}
              title={indicateur.name}
              aria-label={`Consulter la fiche de l'indicateur ${indicateur.name}`}
            >
              {indicateur.name}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};
