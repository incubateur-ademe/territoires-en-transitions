import {useEffect, useState} from 'react';
import {Button} from '@tet/ui';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import {useAnnexesFicheAction} from '../../data/useAnnexesFicheAction';
import EmptyCard from '../../EmptyCard';
import DocumentPicto from './DocumentPicto';
import ModaleAjoutDocument from './ModaleAjoutDocument';
import CarteDocument from 'ui/shared/preuves/Bibliotheque/CarteDocument';
import LoadingCard from '../../LoadingCard';
import { useAddAnnexe } from '../../data/useAddAnnexe';

type DocumentsProps = {
  isReadonly: boolean;
  ficheId: number;
};

const Documents = ({ isReadonly, ficheId }: DocumentsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);

  const { data: documents, isLoading } = useAnnexesFicheAction(ficheId);
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
          picto={(className) => <DocumentPicto className={className} />}
          title="Aucun document ajouté"
          isReadonly={isReadonly}
          action={{
            label: 'Ajouter un document',
            onClick: () => setIsModalOpen(true),
          }}
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
