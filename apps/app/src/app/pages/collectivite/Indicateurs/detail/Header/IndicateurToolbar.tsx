import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import { useUpdateIndicateurDefinition } from '@/app/indicateurs/definitions/use-update-indicateur-definition';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { PermissionOperation } from '@/domain/users';
import { Button, Tooltip, VisibleWhen } from '@/ui';
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

  const { mutate: updateIndicateur } = useUpdateIndicateurDefinition(
    definition.id
  );

  return (
    <>
      <div className={classNames('flex gap-4 lg:mt-2', className)}>
        {/** TODO: visible when pilote */}
        <VisibleWhen
          condition={hasPermission(permissions, 'indicateurs.update')}
        >
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
        </VisibleWhen>

        <VisibleWhen
          condition={hasPermission(permissions, 'indicateurs.update')}
        >
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
        </VisibleWhen>

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
            isPerso && hasPermission(permissions, 'indicateurs.delete')
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
