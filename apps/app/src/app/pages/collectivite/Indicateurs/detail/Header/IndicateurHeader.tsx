import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import HeaderSticky from '@/app/ui/layout/HeaderSticky';
import { PermissionOperation } from '@tet/domain/users';
import { PageHeader } from '@tet/ui';
import { ReactElement } from 'react';
import CheminIndicateur from './CheminIndicateur';
import { hasIndicateurInfos, IndicateurInfos } from './IndicateurInfos';
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
}: Props): ReactElement => {
  const { titre, unite } = definition;
  const isTitleReadonly = isReadonly || !isPerso;
  const uniteSuffix = composeSansAgregation ? null : (
    <sup className="ml-1 text-grey-6 font-medium">{`(${unite})`}</sup>
  );
  const showInfos = hasIndicateurInfos({
    definition,
    isPerso,
    composeSansAgregation,
  });

  return (
    <HeaderSticky
      render={({ isSticky }) => (
        <PageHeader compact={isSticky}>
          <PageHeader.EditableTitle
            title={titre}
            isReadonly={isTitleReadonly || isSticky}
            onUpdate={(value) => onUpdate?.(value ?? '')}
            suffix={uniteSuffix}
          />

          {!isReadonly && (
            <PageHeader.Actions>
              <IndicateurToolbar
                definition={definition}
                isPerso={isPerso}
                hasCollectivitePermission={hasCollectivitePermission}
              />
            </PageHeader.Actions>
          )}

          {hasCollectivitePermission('indicateurs.indicateurs.read') && (
            <PageHeader.Subtitle>
              <CheminIndicateur
                collectiviteId={collectiviteId}
                indicateur={definition}
              />
            </PageHeader.Subtitle>
          )}

          <PageHeader.Metadata visibleWhen={showInfos}>
            <IndicateurInfos
              definition={definition}
              isPerso={isPerso}
              composeSansAgregation={composeSansAgregation}
              isReadonly={isReadonly}
            />
          </PageHeader.Metadata>
        </PageHeader>
      )}
    />
  );
};

export default IndicateurHeader;
