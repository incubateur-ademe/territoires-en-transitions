import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { PermissionOperation } from '@tet/domain/users';
import { Button, Tooltip, VisibleWhen } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { useExportIndicateurs } from '../../Indicateur/useExportIndicateurs';
import DeleteModal from './DeleteModal';
import EditModal from './EditModal';

type Props = {
  definition: IndicateurDefinition;
  permissions: PermissionOperation[];
  isPerso?: boolean;
  className?: string;
};

const IndicateurToolbar = ({
  definition,
  isPerso = false,
  permissions,
  className,
}: Props) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { mutate: exportIndicateurs, isPending } = useExportIndicateurs([
    definition,
  ]);

  const { estFavori } = definition;

  const { mutate: updateIndicateur } = useUpdateIndicateur(definition.id);

  return (
    <>
      <div className={classNames('flex gap-4 lg:mt-2', className)}>
        <Button
          disabled={isPending}
          title="Modifier l'indicateur"
          aria-label="Modifier l'indicateur"
          size="xs"
          variant="grey"
          onClick={() => setIsEditModalOpen(true)}
        >
          Modifier
        </Button>

        <Tooltip
          label={
            estFavori
              ? 'Retirer des favoris de ma collectivité'
              : 'Ajouter aux favoris de ma collectivité'
          }
        >
          <Button
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
          loading={isPending}
          disabled={isPending}
          icon="download-fill"
          title="Exporter au format .xlsx"
          size="xs"
          variant="grey"
          onClick={() => exportIndicateurs()}
        />

        <VisibleWhen
          condition={
            isPerso &&
            hasPermission(permissions, 'indicateurs.indicateurs.delete')
          }
        >
          <DeleteModal {...{ definition, isPending }} />
        </VisibleWhen>
      </div>

      {isEditModalOpen && (
        <EditModal
          openState={{ isOpen: isEditModalOpen, setIsOpen: setIsEditModalOpen }}
          {...{ definition }}
        />
      )}
    </>
  );
};

export default IndicateurToolbar;
