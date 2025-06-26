import { useUpdateIndicateurFavoriCollectivite } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardMenu/useUpdateIndicateurFavoriCollectivite';
import { Button, Tooltip } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { useExportIndicateurs } from '../../Indicateur/useExportIndicateurs';
import { TIndicateurDefinition } from '../../types';
import DeleteModal from './DeleteModal';
import EditModal from './EditModal';

type Props = {
  definition: TIndicateurDefinition;
  collectiviteId: number;
  isPerso?: boolean;
  className?: string;
};

const IndicateurToolbar = ({
  definition,
  collectiviteId,
  isPerso = false,
  className,
}: Props) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { mutate: exportIndicateurs, isPending } = useExportIndicateurs([
    definition,
  ]);

  const isFavori = definition.favoris;

  const { mutate: toggleFavori } = useUpdateIndicateurFavoriCollectivite(
    collectiviteId,
    definition.id
  );

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
            isFavori
              ? 'Retirer des favoris de ma collectivité'
              : 'Ajouter aux favoris de ma collectivité'
          }
        >
          <Button
            icon={isFavori ? 'star-fill' : 'star-line'}
            size="xs"
            variant="grey"
            className={classNames({
              'text-warning-1 hover:text-warning-1': isFavori,
            })}
            onClick={() => toggleFavori(!isFavori)}
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

        {isPerso && <DeleteModal {...{ definition, isPending }} />}
      </div>

      {isEditModalOpen && (
        <EditModal
          openState={{ isOpen: isEditModalOpen, setIsOpen: setIsEditModalOpen }}
          {...{ collectiviteId, definition }}
        />
      )}
    </>
  );
};

export default IndicateurToolbar;
