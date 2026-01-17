import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import HeaderSticky from '@/app/ui/layout/HeaderSticky';
import { PermissionOperation } from '@tet/domain/users';
import { VisibleWhen } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import CheminIndicateur from './CheminIndicateur';
import { IndicateurInfos } from './IndicateurInfos';
import IndicateurTitle from './IndicateurTitle';
import IndicateurToolbar from './IndicateurToolbar';

type Props = {
  collectiviteId: number;
  definition: IndicateurDefinition;
  hasCollectivitePermission: (permission: PermissionOperation) => boolean;
  isReadonly: boolean;
  isPerso: boolean;
  composeSansAgregation: boolean;
  onUpdate?: (value: string) => void;
};

const IndicateurHeader = ({
  collectiviteId,
  hasCollectivitePermission,
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
                {...{ definition, isPerso, hasCollectivitePermission }}
                className={cn('ml-auto', { '!mt-0': isSticky })}
              />
            )}
          </div>

          <VisibleWhen
            condition={hasCollectivitePermission(
              'indicateurs.indicateurs.read_public'
            )}
          >
            <CheminIndicateur
              collectiviteId={collectiviteId}
              indicateur={definition}
            />
          </VisibleWhen>

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
