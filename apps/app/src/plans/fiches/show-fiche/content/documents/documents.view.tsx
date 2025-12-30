import CarteDocument from '@/app/referentiels/preuves/Bibliotheque/CarteDocument';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Button } from '@tet/ui';
import { useState } from 'react';
import { useFicheContext } from '../../context/fiche-context';
import { useAddAnnexe } from '../../data/useAddAnnexe';
import { LinkedResources } from '../linked-resources-layout';
import DocumentPicto from './DocumentPicto';
import ModaleAjoutDocument from './ModaleAjoutDocument';

export const DocumentsView = () => {
  const { fiche, isReadonly, documents } = useFicheContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isLoading, addFileFromLib, addLink } = useAddAnnexe(fiche.id);

  return (
    <>
      <LinkedResources.Root>
        <LinkedResources.SharedAlert
          title="Documents associés"
          description="Les documents affichés correspondent à ceux de cette collectivité."
        />
        <LinkedResources.Empty
          picto={(props) => <DocumentPicto {...props} />}
          title="Aucun document n'est associé à cette action !"
          subTitle="Centraliser l'ensemble des informations associées à l'action en déposant les documents liés"
          actions={[
            {
              children: 'Ajouter un document',
              onClick: () => setIsModalOpen(true),
            },
          ]}
        />
        <LinkedResources.Content
          data={documents.list}
          isLoading={documents.isLoading}
          actions={
            !isReadonly && (
              <Button
                icon={!isLoading ? 'file-download-line' : undefined}
                size="xs"
                variant="outlined"
                disabled={isLoading}
                onClick={() => setIsModalOpen(true)}
              >
                {isLoading && <SpinnerLoader className="!h-4" />}
                Ajouter un document
              </Button>
            )
          }
        >
          {(doc) => (
            <CarteDocument
              key={doc.id}
              isReadonly={isReadonly}
              document={doc}
            />
          )}
        </LinkedResources.Content>
      </LinkedResources.Root>

      {!isReadonly && (
        <ModaleAjoutDocument
          fiche={fiche}
          handlers={{ addFileFromLib, addLink }}
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
        />
      )}
    </>
  );
};
