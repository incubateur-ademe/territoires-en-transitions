import { appLabels } from '@/app/labels/catalog';
import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { PermissionOperation } from '@tet/domain/users';
import { Button, Tooltip, VisibleWhen } from '@tet/ui';
import classNames from 'classnames';
import { useExportIndicateurs } from '../../Indicateur/useExportIndicateurs';
import DeleteModal from './DeleteModal';

type Props = {
  definition: IndicateurDefinition;
  hasCollectivitePermission: (permission: PermissionOperation) => boolean;
  isPerso?: boolean;
  className?: string;
};

const IndicateurToolbar = ({
  definition,
  hasCollectivitePermission,
  isPerso = false,
  className,
}: Props) => {
  const { mutate: exportIndicateurs, isPending } = useExportIndicateurs({
    mode: 'selection',
    indicateurIds: [definition.id],
  });

  const { estFavori } = definition;

  const { mutate: updateIndicateur } = useUpdateIndicateur(definition.id);

  return (
    <div className={classNames('flex items-center gap-4', className)}>
      <Tooltip
        label={
          estFavori
            ? appLabels.indicateurRetirerFavoris
            : appLabels.indicateurAjouterFavoris
        }
      >
        <Button
          dataTest="IndicateurFavoriButton"
          icon={estFavori ? 'star-fill' : 'star-line'}
          size="xs"
          variant="grey"
          className={classNames({
            'text-warning-1 hover:text-warning-1': estFavori,
          })}
          onClick={() => updateIndicateur({ estFavori: !estFavori })}
        />
      </Tooltip>

      <Button
        dataTest="indicateurs.detail.exporter-excel"
        loading={isPending}
        disabled={isPending}
        icon="download-fill"
        title={appLabels.exporterXlsx}
        size="xs"
        variant="grey"
        onClick={() => exportIndicateurs()}
      />

      <VisibleWhen
        condition={
          isPerso && hasCollectivitePermission('indicateurs.indicateurs.delete')
        }
      >
        <DeleteModal {...{ definition, isPending }} />
      </VisibleWhen>
    </div>
  );
};

export default IndicateurToolbar;
