import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import PreuveDoc from '@/app/referentiels/preuves/Bibliotheque/PreuveDoc';
import {
  TPreuveAuditEtLabellisation,
  TPreuveRapport,
} from '@/app/referentiels/preuves/Bibliotheque/types';
import { usePreuvesParType } from '@/app/referentiels/preuves/usePreuves';
import { TrackPageView } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import { pick } from 'es-toolkit';
import { AddRapportVisite } from './AddRapportVisite';
import { PreuvesLabellisation } from './PreuveLabellisation';
import { PreuvesTabs } from './PreuvesTabs';

type TBibliothequeDocsProps = {
  labellisationEtAudit?: TPreuveAuditEtLabellisation[];
  rapports?: TPreuveRapport[];
  isReadOnly: boolean;
};

export const BibliothequeDocs = ({
  labellisationEtAudit,
  rapports,
  isReadOnly,
}: TBibliothequeDocsProps) => {
  return (
    <PageContainer dataTest="BibliothequeDocs" bgColor="white">
      <h1 className="text-center mb-16">Bibliothèque de documents</h1>

      {labellisationEtAudit?.length ? (
        <section data-test="labellisation">
          <PreuvesLabellisation preuves={labellisationEtAudit} />
        </section>
      ) : null}

      <section data-test="rapports">
        <h2>Rapports de visite annuelle</h2>
        {!isReadOnly && <AddRapportVisite />}
        {isReadOnly && (!rapports || rapports.length === 0) && (
          <p>Aucun rapport de visite annuelle n'a été ajouté.</p>
        )}
        {rapports?.map((preuve) => (
          <div className="py-4" key={preuve.id}>
            <PreuveDoc preuve={preuve} />
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h2>Documents</h2>
        <PreuvesTabs />
      </section>
    </PageContainer>
  );
};

const BibliothequeDocsConnected = () => {
  const collectivite = useCurrentCollectivite();
  const preuves = usePreuvesParType({
    preuve_types: ['audit', 'labellisation', 'rapport'],
  });
  const isReadOnly = collectivite?.isReadOnly ?? true;

  const { labellisation, rapport, audit } = preuves;
  const labellisationEtAudit = [...(labellisation || []), ...(audit || [])];

  return (
    <>
      {!!collectivite && (
        <TrackPageView
          pageName="app/parametres/bibliotheque"
          properties={pick(collectivite, [
            'collectiviteId',
            'niveauAcces',
            'role',
          ])}
        />
      )}
      <BibliothequeDocs
        labellisationEtAudit={labellisationEtAudit}
        rapports={rapport}
        isReadOnly={isReadOnly}
      />
    </>
  );
};

export default BibliothequeDocsConnected;
