import CarteDocument from '@/app/referentiels/preuves/Bibliotheque/CarteDocument';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Button, EmptyCard } from '@/ui';
import { useEffect, useState } from 'react';
import { useAddAnnexe } from '../../data/useAddAnnexe';
import { useAnnexesFicheAction } from '../../data/useAnnexesFicheAction';
import LoadingCard from '../../LoadingCard';
import DocumentPicto from './DocumentPicto';
import ModaleAjoutDocument from './ModaleAjoutDocument';

type DocumentsProps = {
  isReadonly: boolean;
  collectiviteId: number;
  ficheId: number;
};

const Documents = ({ isReadonly, ficheId, collectiviteId }: DocumentsProps) => {
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

  if (isLoading) {
    return <LoadingCard title="Documents" />;
  }

  const isEmpty = !documents || documents.length === 0;

  return (
    <>
      {isEmpty ? (
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

          {/* Liste des documents */}
          {handlers.isError ? (
            <span className="text-primary-9 text-sm text-center">
              Impossible de charger les documents...
            </span>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {documents.map((doc) => (
                <CarteDocument
                  key={doc.id}
                  isReadonly={isReadonly}
                  document={doc}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!isReadonly && !!handlers && (
        <ModaleAjoutDocument
          handlers={handlers}
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
        />
      )}
    </>
  );
};

export default Documents;
