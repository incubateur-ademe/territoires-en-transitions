import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { PermissionOperation } from '@tet/domain/users';
import { PageHeader } from '@tet/ui';
import { ReactElement, ReactNode, useState } from 'react';
import { useIndicateurActions } from '../context/indicateur-actions.context';
import CheminIndicateur from './chemin-indicateur.view';

type Props = {
  collectiviteId: number;
  indicateur: IndicateurDetaille;
  hasCollectivitePermission: (permission: PermissionOperation) => boolean;
  isReadonly: boolean;
  isTitleEditable: boolean;
  hasUniteSuffix: boolean;
  toolbar: ReactNode;
  infos: ReactNode;
  hasInfos: boolean;
};

const IndicateurHeader = ({
  collectiviteId,
  hasCollectivitePermission,
  indicateur,
  isReadonly,
  isTitleEditable,
  hasUniteSuffix,
  toolbar,
  infos,
  hasInfos,
}: Props): ReactElement => {
  const { updateTitre } = useIndicateurActions();
  const { titre, unite } = indicateur;
  const uniteSuffix = hasUniteSuffix ? (
    <sup className="ml-1 text-grey-6 font-medium">{`(${unite})`}</sup>
  ) : null;

  const [isSticky, setIsSticky] = useState(false);

  return (
    <PageHeader sticky onStickyChange={setIsSticky}>
      <PageHeader.EditableTitle
        title={titre}
        isReadonly={isReadonly || !isTitleEditable || isSticky}
        onUpdate={(value) => updateTitre(value ?? '')}
        suffix={uniteSuffix}
      />

      {!isReadonly && <PageHeader.Actions>{toolbar}</PageHeader.Actions>}

      {hasCollectivitePermission('indicateurs.indicateurs.read') && (
        <PageHeader.Subtitle>
          <CheminIndicateur
            collectiviteId={collectiviteId}
            indicateur={indicateur}
          />
        </PageHeader.Subtitle>
      )}

      <PageHeader.Metadata visibleWhen={hasInfos}>{infos}</PageHeader.Metadata>
    </PageHeader>
  );
};

export default IndicateurHeader;
