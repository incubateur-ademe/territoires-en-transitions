'use client';

import { appLabels } from '@/app/labels/catalog';
import { useAddPreuveToDemande } from '@/app/referentiels/labellisations/useAddPreuveToDemande';
import { usePreuvesLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { AuditLabellisationReferentielId } from '@tet/domain/referentiels';
import { Icon, Modal, PillButton } from '@tet/ui';
import { ReactElement, useState } from 'react';
import { useChecklist } from '../checklist.context';

const DOCUMENTS_CANDIDATURE: Record<
  AuditLabellisationReferentielId,
  readonly string[]
> = {
  cae: [appLabels.dossierDemandeLabellisation, appLabels.documentsAnnexes],
  eci: [appLabels.courrierActeCandidature, appLabels.arretePrefectoralEpci],
};

const CandidatureInstructions = ({
  documents,
}: {
  documents: readonly string[];
}): ReactElement => (
  <div className="text-sm text-grey-8">
    <p className="m-0 font-medium text-primary-10">
      {appLabels.documentsOfficielsCandidature}
    </p>
    <ul className="mt-1 mb-0">
      {documents.map((document) => (
        <li key={document}>{document}</li>
      ))}
    </ul>
  </div>
);

const PreuvesList = ({
  demandeId,
}: {
  demandeId: number;
}): ReactElement | null => {
  const { data: preuves } = usePreuvesLabellisation(demandeId);

  if (!preuves || preuves.length === 0) {
    return null;
  }

  return (
    <ul className="m-0 flex flex-col gap-1">
      {preuves.map((preuve) => (
        <li
          key={preuve.id}
          className="flex items-center gap-2 text-sm text-grey-9"
        >
          <Icon
            icon="file-text-line"
            size="sm"
            className="shrink-0 text-grey-7"
          />
          <span className="font-medium">{preuve.fichier?.filename}</span>
        </li>
      ))}
    </ul>
  );
};

const AddDocumentsButton = (): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const handlers = useAddPreuveToDemande();

  return (
    <Modal
      size="lg"
      openState={{ isOpen, setIsOpen }}
      title={appLabels.ajouterDocument}
      render={({ close }) => (
        <AddPreuveModal onClose={close} handlers={handlers} />
      )}
    >
      <PillButton icon="add-line" onClick={() => setIsOpen(true)}>
        {appLabels.ajouterDocument}
      </PillButton>
    </Modal>
  );
};

export const CandidatureDocumentsSection = (): ReactElement | null => {
  const { parcours, referentielId } = useChecklist();
  const { hasCollectivitePermission } = useCurrentCollectivite();

  if (!parcours || parcours.etoileObjectif === 1) {
    return null;
  }

  const { demandeId } = parcours.acteEngagement;

  return (
    <div className="flex flex-col gap-3">
      <CandidatureInstructions
        documents={DOCUMENTS_CANDIDATURE[referentielId]}
      />
      {demandeId !== null && <PreuvesList demandeId={demandeId} />}
      {hasCollectivitePermission('referentiels.mutate') && (
        <AddDocumentsButton />
      )}
    </div>
  );
};
