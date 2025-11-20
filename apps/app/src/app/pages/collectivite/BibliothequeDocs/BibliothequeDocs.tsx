'use client';

import PreuveDoc from '@/app/referentiels/preuves/Bibliotheque/PreuveDoc';
import {
  TPreuveAuditEtLabellisation,
  TPreuveRapport,
} from '@/app/referentiels/preuves/Bibliotheque/types';
import { usePreuvesParType } from '@/app/referentiels/preuves/usePreuves';
import { useCurrentCollectivite } from '@tet/api/collectivites';
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
    <div data-test="BibliothequeDocs">
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
          <p>{"Aucun rapport de visite annuelle n'a été ajouté."}</p>
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
    </div>
  );
};

const BibliothequeDocsConnected = () => {
  const { isReadOnly } = useCurrentCollectivite();
  const preuves = usePreuvesParType({
    preuve_types: ['audit', 'labellisation', 'rapport'],
  });

  const { labellisation, rapport, audit } = preuves;
  const labellisationEtAudit = [...(labellisation || []), ...(audit || [])];

  return (
    <BibliothequeDocs
      labellisationEtAudit={labellisationEtAudit}
      rapports={rapport}
      isReadOnly={isReadOnly}
    />
  );
};

export default BibliothequeDocsConnected;
