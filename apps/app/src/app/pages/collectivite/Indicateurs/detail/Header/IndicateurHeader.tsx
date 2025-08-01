import HeaderSticky from '@/app/ui/layout/HeaderSticky';
import PageContainer from '@/ui/components/layout/page-container';
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

  return (
    <HeaderSticky
      render={({ isSticky }) => (
        <PageContainer
          bgColor={isSticky ? 'white' : 'grey'}
          innerContainerClassName={classNames('flex flex-col gap-3 !py-0', {
            '!py-2 !gap-1': isSticky,
          })}
          containerClassName={classNames({
            'border-b border-primary-3': isSticky,
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
                collectiviteId={collectiviteId}
                className={classNames('ml-auto', { '!mt-0': isSticky })}
              />
            )}
          </div>

          {/* Chemin de l'indicateur */}
          <CheminIndicateur
            {...{ collectiviteId, indicateurId: definition.id }}
          />

          {/* Infos générales sur l'indicateur */}
          <IndicateurInfos
            {...{
              collectiviteId,
              definition,
              isPerso,
              composeSansAgregation,
              isReadonly,
              isSticky,
            }}
          />
        </PageContainer>
      )}
    />
  );
};

export default IndicateurHeader;
