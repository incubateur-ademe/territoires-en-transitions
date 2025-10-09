import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import HeaderSticky from '@/app/ui/layout/HeaderSticky';
import { cn } from '@/ui/utils/cn';
import CheminIndicateur from './CheminIndicateur';
import { IndicateurInfos } from './IndicateurInfos';
import IndicateurTitle from './IndicateurTitle';
import IndicateurToolbar from './IndicateurToolbar';

type Props = {
  collectiviteId: number;
  definition: IndicateurDefinition;
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
    <HeaderSticky
      render={({ isSticky }) => (
        <div
          className={cn('flex flex-col gap-3 py-0 bg-grey-2', {
            'py-2 gap-1 border-b border-primary-3': isSticky,
          })}
        >
          <div className="flex max-md:flex-col-reverse gap-4 md:items-start">
            {/* Titre éditable de l'indicateur */}
            <IndicateurTitle
              title={titre}
              unite={unite}
              isReadonly={isReadonly || !isPerso}
              composeSansAgregation={composeSansAgregation}
              updateTitle={(value) => onUpdate?.(value)}
              isSticky={isSticky}
            />

            {/* Actions sur l'indicateur */}
            {!isReadonly && (
              <IndicateurToolbar
                {...{ definition, isPerso }}
                className={cn('ml-auto', { '!mt-0': isSticky })}
              />
            )}
          </div>

          <CheminIndicateur
            collectiviteId={collectiviteId}
            indicateur={definition}
          />

          {/* Infos générales sur l'indicateur */}
          <IndicateurInfos
            {...{
              definition,
              isPerso,
              composeSansAgregation,
              isReadonly,
              isSticky,
            }}
          />
        </div>
      )}
    />
  );
};

export default IndicateurHeader;
