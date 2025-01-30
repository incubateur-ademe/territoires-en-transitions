import { useSticky } from '@/app/utils/useSticky';
import classNames from 'classnames';
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

  const headerContainer = useSticky();

  return (
    <div
      ref={headerContainer.ref}
      className={classNames(
        'w-full p-2 pt-3 -mt-3 md:px-4 lg:px-6 z-50 sticky top-0 shadow-none transition-all duration-100',
        {
          'bg-white !shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] border-b border-b-primary-3':
            headerContainer.isSticky,
          'bg-none shadow-none border-0': !headerContainer.isSticky,
        }
      )}
    >
      <div className="w-full px-2 mx-auto xl:max-w-7xl 2xl:max-w-8xl">
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
        <IndicateurInfos
          {...{ collectiviteId, definition, isPerso, composeSansAgregation }}
        />
      </div>
    </div>
  );
};

export default IndicateurHeader;
