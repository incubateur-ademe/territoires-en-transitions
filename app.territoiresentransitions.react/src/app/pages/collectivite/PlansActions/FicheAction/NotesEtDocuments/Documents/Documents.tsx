import {useState} from 'react';
import {Button} from '@tet/ui';
import {useAnnexesFicheAction} from '../../data/useAnnexesFicheAction';
import EmptyCard from '../../EmptyCard';
import DocumentPicto from './DocumentPicto';
import ModaleAjoutDocument from './ModaleAjoutDocument';
import CarteDocument from './CarteDocument';

type DocumentsProps = {
  isReadonly: boolean;
  ficheId: number | null;
};

const Documents = ({isReadonly, ficheId}: DocumentsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {data: documents} = useAnnexesFicheAction(ficheId);

  const isEmpty = !documents || documents.length === 0 || !ficheId;

  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={className => <DocumentPicto className={className} />}
          title="Aucun document ajouté"
          isReadonly={isReadonly || !ficheId}
          action={{
            label: 'Ajouter un document',
            onClick: () => setIsModalOpen(true),
          }}
        />
      ) : (
        <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 px-5 lg:px-6 xl:px-7 flex flex-col gap-5">
          {/* Titre et bouton d'édition */}
          <div className="flex justify-between">
            <h5 className="text-primary-8 mb-0">Documents</h5>
            {!isReadonly && (
              <Button
                icon="file-download-line"
                size="xs"
                variant="outlined"
                onClick={() => setIsModalOpen(true)}
              >
                Ajouter un document
              </Button>
            )}
          </div>

          {/* Liste des documents */}
          <div className="grid grid-cols-2 gap-3">
            {documents.map(doc => (
              <CarteDocument
                key={doc.id}
                isReadonly={isReadonly}
                document={doc}
              />
            ))}
          </div>
        </div>
      )}

      {!!ficheId && (
        <ModaleAjoutDocument
          ficheId={ficheId}
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
        />
      )}
    </>
  );
};

export default Documents;
