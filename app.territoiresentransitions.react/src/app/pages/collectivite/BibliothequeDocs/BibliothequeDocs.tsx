import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import PreuveDoc from '@/app/ui/shared/preuves/Bibliotheque/PreuveDoc';
import {
  TPreuveAuditEtLabellisation,
  TPreuveRapport,
} from '@/app/ui/shared/preuves/Bibliotheque/types';
import { usePreuvesParType } from '@/app/ui/shared/preuves/Bibliotheque/usePreuves';
import { TrackPageView } from '@/ui';
import { pick } from 'es-toolkit';
import { AddRapportVisite } from './AddRapportVisite';
import { PreuvesLabellisation } from './PreuveLabellisation';
import { PreuvesTabs } from './PreuvesTabs';
import PageContainer from '@/ui/components/layout/page-container';

type TBibliothequeDocsProps = {
  labellisationEtAudit?: TPreuveAuditEtLabellisation[];
  rapports?: TPreuveRapport[];
};

export const BibliothequeDocs = ({
  labellisationEtAudit,
  rapports,
}: TBibliothequeDocsProps) => {
  return (
    <PageContainer dataTest="BibliothequeDocs" bgColor="white">
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
        {rapports?.map((preuve) => (
          <div className="py-4" key={preuve.id}>
            <PreuveDoc preuve={preuve} />
          </div>
        ))}
      </section>

      <section className="fr-mt-4w">
        <h2>Documents</h2>
        <PreuvesTabs />
      </section>
    </PageContainer>
  );
};

const BibliothequeDocsConnected = () => {
  const collectivite = useCurrentCollectivite()!;
  const preuves = usePreuvesParType({
    preuve_types: ['audit', 'labellisation', 'rapport'],
  });

  const { labellisation, rapport, audit } = preuves;
  const labellisationEtAudit = [...(labellisation || []), ...(audit || [])];

  return (
    <>
      <TrackPageView
        pageName="app/parametres/bibliotheque"
        properties={pick(collectivite, [
          'collectiviteId',
          'niveauAcces',
          'role',
        ])}
      />
      <BibliothequeDocs
        labellisationEtAudit={labellisationEtAudit}
        rapports={rapport}
      />
    </>
  );
};

export default BibliothequeDocsConnected;
