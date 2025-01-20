import { TIndicateurDefinition } from '../../types';
import CheminIndicateur from './CheminIndicateur';
import IndicateurInfos from './IndicateurInfos';
import IndicateurTitle from './IndicateurTitle';
import IndicateurToolbar from './IndicateurToolbar';

type Props = {
  collectiviteId: number;
  definition: TIndicateurDefinition;
  isReadonly: boolean;
  isPerso: boolean;
  composeSansAgregation: boolean;
  onUpdate?: (value: string) => void;
};

const IndicateurHeader = ({
  collectiviteId,
  definition,
  isReadonly,
  isPerso,
  composeSansAgregation,
  onUpdate,
}: Props) => {
  const { titre, unite } = definition;

  return (
    <div className="w-full mb-6">
      <div className="flex flex-col-reverse gap-4 lg:flex-row lg:items-start">
        {/* Titre éditable de l'indicateur */}
        <IndicateurTitle
          title={titre}
          unite={unite}
          isReadonly={isReadonly || !isPerso}
          composeSansAgregation={composeSansAgregation}
          updateTitle={(value) => onUpdate?.(value)}
        />

        {/* Actions sur l'indicateur */}
        <IndicateurToolbar
          {...{ definition, isPerso, isReadonly }}
          collectiviteId={collectiviteId!}
          className="ml-auto"
        />
      </div>

      {/* Chemin de l'indicateur */}
      <CheminIndicateur {...{ collectiviteId, titre, unite }} />

      {/* Infos générales sur l'indicateur */}
      <IndicateurInfos {...{ definition, isPerso, composeSansAgregation }} />
    </div>
  );
};

export default IndicateurHeader;
