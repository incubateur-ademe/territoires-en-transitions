import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { PermissionOperation } from '@tet/domain/users';
import { PageHeader } from '@tet/ui';
import { IndicateurChartInfo } from '../../data/use-indicateur-chart';
import { ReactElement, useState } from 'react';
import CheminIndicateur from './CheminIndicateur';
import { hasIndicateurInfos, IndicateurInfos } from './IndicateurInfos';
import IndicateurToolbar from './IndicateurToolbar';

type Props = {
  collectiviteId: number;
  indicateur: IndicateurDetaille;
  chartInfo?: IndicateurChartInfo;
  hasCollectivitePermission: (permission: PermissionOperation) => boolean;
  isReadonly: boolean;
  isPerso: boolean;
  composeSansAgregation: boolean;
  onUpdate?: (value: string) => void;
};

const IndicateurHeader = ({
  collectiviteId,
  hasCollectivitePermission,
  indicateur,
  chartInfo,
  isReadonly,
  isPerso,
  composeSansAgregation,
  onUpdate,
}: Props): ReactElement => {
  const { titre, unite } = indicateur;
  const isTitleReadonly = isReadonly || !isPerso;
  const uniteSuffix = composeSansAgregation ? null : (
    <sup className="ml-1 text-grey-6 font-medium">{`(${unite})`}</sup>
  );
  const showInfos = hasIndicateurInfos({
    indicateur,
    isPerso,
    composeSansAgregation,
    isReadonly,
  });

  const [isSticky, setIsSticky] = useState(false);

  return (
    <PageHeader sticky onStickyChange={setIsSticky}>
      <PageHeader.EditableTitle
        title={titre}
        isReadonly={isTitleReadonly || isSticky}
        onUpdate={(value) => onUpdate?.(value ?? '')}
        suffix={uniteSuffix}
      />

      {!isReadonly && (
        <PageHeader.Actions>
          <IndicateurToolbar
            indicateur={indicateur}
            chartInfo={chartInfo}
            isPerso={isPerso}
            hasCollectivitePermission={hasCollectivitePermission}
          />
        </PageHeader.Actions>
      )}

      {hasCollectivitePermission('indicateurs.indicateurs.read') && (
        <PageHeader.Subtitle>
          <CheminIndicateur
            collectiviteId={collectiviteId}
            indicateur={indicateur}
          />
        </PageHeader.Subtitle>
      )}

      <PageHeader.Metadata visibleWhen={showInfos}>
        <IndicateurInfos
          indicateur={indicateur}
          isPerso={isPerso}
          composeSansAgregation={composeSansAgregation}
          isReadonly={isReadonly}
        />
      </PageHeader.Metadata>
    </PageHeader>
  );
};

export default IndicateurHeader;
