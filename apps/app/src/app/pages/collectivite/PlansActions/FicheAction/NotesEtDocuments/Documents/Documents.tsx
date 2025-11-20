import { isFicheSharedWithCollectivite } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { SharedFicheLinkedResourcesAlert } from '@/app/plans/fiches/share-fiche/shared-fiche-linked-resources.alert';
import CarteDocument from '@/app/referentiels/preuves/Bibliotheque/CarteDocument';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button, EmptyCard } from '@tet/ui';
import { useEffect, useState } from 'react';
import { Fiche } from '../../data/use-get-fiche';
import { useAddAnnexe } from '../../data/useAddAnnexe';
import { useAnnexesFicheAction } from '../../data/useAnnexesFicheAction';
import DocumentPicto from './DocumentPicto';
import ModaleAjoutDocument from './ModaleAjoutDocument';

type DocumentsProps = {
  isReadonly: boolean;
  collectiviteId: number;
  fiche: Fiche;
};

const Documents = (props: DocumentsProps) => {
  const currentCollectiviteId = useCollectiviteId();
  const { fiche, collectiviteId } = props;

  const isSharedWithCurrentCollectivite = isFicheSharedWithCollectivite(
    fiche,
    currentCollectiviteId
  );
  const isReadonly = isSharedWithCurrentCollectivite || props.isReadonly;

  const ficheId = fiche.id;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);

  const { data: documents, isLoading } = useAnnexesFicheAction(
    collectiviteId,
    ficheId
  );
  const handlers = useAddAnnexe(ficheId);

  useEffect(() => {
    if (handlers.isLoading) setIsEditLoading(true);
  }, [handlers.isLoading]);

  useEffect(() => {
    if (handlers.isError) setIsEditLoading(false);
  }, [handlers.isError]);

  useEffect(() => {
    setIsEditLoading(false);
  }, [documents?.length]);

  const isEmpty = !documents || documents.length === 0;

  return (
    <>
      <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col gap-5">
        {/* Titre et bouton d'édition */}
        <div className="flex justify-between">
          <h5 className="text-primary-8 mb-0">Documents</h5>
          {!isReadonly && !handlers.isError && (
            <Button
              icon={!isEditLoading ? 'file-download-line' : undefined}
              size="xs"
              variant="outlined"
              disabled={isEditLoading}
              onClick={() => setIsModalOpen(true)}
            >
              {isEditLoading && <SpinnerLoader className="!h-4" />}
              Ajouter un document
            </Button>
          )}
        </div>

        <SharedFicheLinkedResourcesAlert
          fiche={fiche}
          currentCollectiviteId={currentCollectiviteId}
          sharedDataTitle="Documents associées"
          sharedDataDescription="Les documents affichées correspondent à ceux de cette collectivité."
        />

        {isLoading ? (
          <div className="h-[16rem] flex">
            <SpinnerLoader className="m-auto" />
          </div>
        ) : isEmpty ? (
          <EmptyCard
            picto={(props) => <DocumentPicto {...props} />}
            title="Aucun document ajouté"
            isReadonly={isReadonly}
            actions={[
              {
                children: 'Ajouter un document',
                onClick: () => setIsModalOpen(true),
              },
            ]}
            size="xs"
          />
        ) : (
          <>
            {/* Liste des documents */}
            {handlers.isError ? (
              <span className="text-primary-9 text-sm text-center">
                Impossible de charger les documents...
              </span>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documents.map((doc) => (
                    <CarteDocument
                      key={doc.id}
                      isReadonly={isReadonly}
                      document={doc}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!isReadonly && !!handlers && (
        <ModaleAjoutDocument
          fiche={fiche}
          handlers={handlers}
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
        />
      )}
    </>
  );
};

export default Documents;
