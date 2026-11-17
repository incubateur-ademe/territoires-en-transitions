import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { PermissionOperation } from '@tet/domain/users';
import { PageHeader } from '@tet/ui';
import { IndicateurChartInfo } from '../../data/use-indicateur-chart';
import { useIndicateurActions } from '../context/indicateur-actions.context';
import { ReactElement, useState } from 'react';
import CheminIndicateur from './chemin-indicateur.view';
import { hasIndicateurInfos, IndicateurInfos } from './indicateur-infos.view';
import IndicateurToolbar from './indicateur-toolbar.view';

type Props = {
  collectiviteId: number;
  indicateur: IndicateurDetaille;
  chartInfo?: IndicateurChartInfo;
  hasCollectivitePermission: (permission: PermissionOperation) => boolean;
  isReadonly: boolean;
  isPerso: boolean;
  composeSansAgregation: boolean;
};

const IndicateurHeader = ({
  collectiviteId,
  hasCollectivitePermission,
  indicateur,
  chartInfo,
  isReadonly,
  isPerso,
  composeSansAgregation,
}: Props): ReactElement => {
  const { updateTitre } = useIndicateurActions();
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
        onUpdate={(value) => updateTitre(value ?? '')}
        suffix={uniteSuffix}
      />

      {!isReadonly && (
        <PageHeader.Actions>
          <IndicateurToolbar
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
