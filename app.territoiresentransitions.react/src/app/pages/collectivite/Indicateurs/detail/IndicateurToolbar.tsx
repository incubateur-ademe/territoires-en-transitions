import { ToolbarIconButton } from '@/app/ui/buttons/ToolbarIconButton';
import { Modal, ModalFooterOKCancel } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { IndicateurSidePanelToolbar } from '../Indicateur/IndicateurSidePanelToolbar';
import { useExportIndicateurs } from '../Indicateur/useExportIndicateurs';
import { useDeleteIndicateurPerso } from '../Indicateur/useRemoveIndicateurPerso';
import { TIndicateurDefinition } from '../types';

type Props = {
  definition: TIndicateurDefinition;
  collectiviteId: number;
  isPerso?: boolean;
  isReadonly?: boolean;
  className?: string;
};

const IndicateurToolbar = ({
  definition,
  collectiviteId,
  isPerso = false,
  isReadonly = false,
  className,
}: Props) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { mutate: exportIndicateurs, isLoading } = useExportIndicateurs(
    isPerso ? 'app/indicateurs/perso' : 'app/indicateurs/predefini',
    [definition]
  );

  const { mutate: deleteIndicateurPerso } = useDeleteIndicateurPerso(
    definition.id
  );

  return (
    <>
      <div className={classNames('flex gap-2', className)}>
        <ToolbarIconButton
          disabled={isLoading}
          icon="download"
          title="Exporter"
          onClick={() => exportIndicateurs()}
        />
        {!isReadonly && isPerso && (
          <ToolbarIconButton
            className="text-error-1"
            disabled={isLoading}
            icon="delete"
            title="Supprimer"
            aria-label="Supprimer"
            onClick={() => setIsDeleteModalOpen(true)}
          />
        )}
        {!isPerso && <IndicateurSidePanelToolbar definition={definition} />}
      </div>

      {isDeleteModalOpen && (
        <Modal
          openState={{
            isOpen: isDeleteModalOpen,
            setIsOpen: setIsDeleteModalOpen,
          }}
          title="Suppression de l'indicateur"
          subTitle={definition.titre}
          description="Êtes-vous sûr de vouloir supprimer cet indicateur personnalisé ? Vous perdrez définitivement les données associées à cet indicateur."
          renderFooter={({ close }) => (
            <ModalFooterOKCancel
              btnCancelProps={{
                onClick: () => close(),
              }}
              btnOKProps={{
                'aria-label': 'Supprimer',
                children: 'Supprimer',
                onClick: () => {
                  deleteIndicateurPerso();
                  close();
                },
              }}
            />
          )}
        />
      )}
    </>
  );
};

export default IndicateurToolbar;
