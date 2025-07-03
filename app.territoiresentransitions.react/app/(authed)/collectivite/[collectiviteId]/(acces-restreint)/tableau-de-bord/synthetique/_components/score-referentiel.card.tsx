import { useCurrentCollectivite } from '@/api/collectivites';
import { referentielToName } from '@/app/app/labels';
import { makeReferentielUrl } from '@/app/app/paths';
import { useListSnapshots } from '@/app/referentiels/use-snapshot';
import { ModuleContainer } from '@/app/tableaux-de-bord/modules/module/module.container';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ReferentielId } from '@/domain/referentiels';
import { Button } from '@/ui';

import { ScoreTotalEvolutionsChart } from '@/app/referentiels/comparisons/evolutions-score-total.chart';
import imagePlaceholder from './score-referentiel-placeholder.png';

type Props = {
  referentielId: ReferentielId;
};

const ScoreReferentielCard = ({ referentielId }: Props) => {
  const { collectiviteId, isReadOnly } = useCurrentCollectivite();
  const { data, isLoading } = useListSnapshots(referentielId);

  const isEmpty =
    !data ||
    data?.length === 0 ||
    data[data.length - 1].pointNonRenseigne ===
      data[data.length - 1].pointPotentiel;

  if (isLoading) {
    return (
      <ModuleContainer>
        <SpinnerLoader containerClassName="m-auto" />
      </ModuleContainer>
    );
  }

  return (
    <ModuleContainer className="lg:p-4 xl:p-8  overflow-hidden">
      {isEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 backdrop-blur-sm bg-white/65">
          <h5 className="mb-0">{referentielToName[referentielId]}</h5>
          {!isReadOnly ? (
            <Button
              href={makeReferentielUrl({ collectiviteId, referentielId })}
              size="sm"
            >
              Renseigner l’état des lieux
            </Button>
          ) : (
            <span className="text-primary-10">Aucune donnée disponible</span>
          )}
        </div>
      )}
      <>
        {/** header */}
        <div className="flex gap-6">
          <div>
            <h6 className="mb-1">L’évolution du score en points</h6>
            <span className="uppercase text-primary-9">
              {referentielToName[referentielId]}
            </span>
          </div>
          {!isEmpty && (
            <Button
              icon="zoom-in-line"
              size="xs"
              variant="outlined"
              className="ml-auto h-fit"
              href={makeReferentielUrl({
                collectiviteId,
                referentielId: 'eci',
                referentielTab: 'evolutions',
              })}
            >
              Afficher le détail
            </Button>
          )}
        </div>
        {/** Graph */}
        {isEmpty ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imagePlaceholder.src}
            alt="graphique évolution score référentiel"
            className="grow object-center"
          />
        ) : (
          <ScoreTotalEvolutionsChart
            snapshots={data.slice(0, 4)}
            chartSize="sm"
            referentielId={referentielId}
          />
        )}
      </>
    </ModuleContainer>
  );
};

export default ScoreReferentielCard;
