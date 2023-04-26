import PreuveDoc from 'ui/shared/preuves/Bibliotheque/PreuveDoc';
import {
  TPreuveAuditEtLabellisation,
  TPreuveRapport,
} from 'ui/shared/preuves/Bibliotheque/types';
import {usePreuvesParType} from 'ui/shared/preuves/Bibliotheque/usePreuves';
import {AddRapportVisite} from './AddRapportVisite';
import {PreuvesLabellisation} from './PreuveLabellisation';
import {PreuvesTabs} from './PreuvesTabs';

type TBibliothequeDocsProps = {
  labellisationEtAudit?: TPreuveAuditEtLabellisation[];
  rapports?: TPreuveRapport[];
};

export const BibliothequeDocs = ({
  labellisationEtAudit,
  rapports,
}: TBibliothequeDocsProps) => {
  return (
    <main data-test="BibliothequeDocs" className="fr-container mt-9 mb-16">
      <h1 className="text-center fr-mt-4w fr-mb-4w">
        Bibliothèque de documents
      </h1>

      {labellisationEtAudit?.length ? (
        <section className="fr-mt-4w" data-test="labellisation">
          <PreuvesLabellisation preuves={labellisationEtAudit} />
        </section>
      ) : null}

      <section className="fr-mt-4w" data-test="rapports">
        <h2>Rapports de visite annuelle</h2>
        <AddRapportVisite />
        {rapports?.map(preuve => (
          <div className="py-4" key={preuve.id}>
            <PreuveDoc preuve={preuve} />
          </div>
        ))}
      </section>

      <section className="fr-mt-4w">
        <h2>Documents</h2>
        <PreuvesTabs />
      </section>
    </main>
  );
};

const BibliothequeDocsConnected = () => {
  const preuves = usePreuvesParType({
    preuve_types: ['audit', 'labellisation', 'rapport'],
  });

  const {labellisation, rapport, audit} = preuves;
  const labellisationEtAudit = [...(labellisation || []), ...(audit || [])];

  return (
    <BibliothequeDocs
      labellisationEtAudit={labellisationEtAudit}
      rapports={rapport}
    />
  );
};

export default BibliothequeDocsConnected;
