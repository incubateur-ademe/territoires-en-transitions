import CarteDocument from '@/app/referentiels/preuves/Bibliotheque/CarteDocument';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, VisibleWhen } from '@tet/ui';
import { useState } from 'react';
import { useFicheContext } from '../../context/fiche-context';
import { useAddAnnexe } from '../../data/useAddAnnexe';
import { ContentLayout } from '../content-layout';
import DocumentPicto from './DocumentPicto';
import ModaleAjoutDocument from './ModaleAjoutDocument';

export const DocumentsView = () => {
  const { fiche, isReadonly, documents } = useFicheContext();
  const collectivite = useCurrentCollectivite();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isLoading, addFileFromLib, addLink } = useAddAnnexe(fiche.id);

  return (
    <>
      <ContentLayout.Root>
        <ContentLayout.SharedAlert
          fiche={fiche}
          collectiviteId={collectivite.collectiviteId}
          title="Documents associés"
          description="Les documents affichés correspondent à ceux de cette collectivité."
        />
        <ContentLayout.Empty
          isReadonly={isReadonly}
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
        <ContentLayout.Content
          data={documents.list}
          isLoading={documents.isLoading}
          actions={
            <VisibleWhen condition={!isReadonly}>
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
            </VisibleWhen>
          }
        >
          {(doc) => (
            <CarteDocument
              key={doc.id}
              isReadonly={isReadonly}
              document={doc}
            />
          )}
        </ContentLayout.Content>
      </ContentLayout.Root>

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
