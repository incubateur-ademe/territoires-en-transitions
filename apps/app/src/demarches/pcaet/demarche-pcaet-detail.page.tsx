'use client';

import { AvanceDemarcheSection } from '@/app/demarches/pcaet/components/avance-demarche-section';
import { DemarchePcaetHeader } from '@/app/demarches/pcaet/components/demarche-pcaet-header';
import { DemarchePcaetSection } from '@/app/demarches/pcaet/components/demarche-pcaet-section';
import { DiagnosticVoletsSection } from '@/app/demarches/pcaet/components/diagnostic-volets-section';
import { ProgrammeActionsSection } from '@/app/demarches/pcaet/components/programme-actions-section';
import { setDemarchePcaetStatutPublication } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import { useDemarchePcaet } from '@/app/demarches/pcaet/use-demarche-pcaet';
import { Alert, Textarea } from '@tet/ui';
import { notFound } from 'next/navigation';
import { PcaetDocumentsTable } from './components/pcaet-documents-table';

type Props = {
  demarcheId: string;
};

export const DemarchePcaetDetailPage = ({ demarcheId }: Props) => {
  const { demarche, update, replaceDemarche, collectiviteId } =
    useDemarchePcaet(demarcheId);

  if (!demarche) {
    notFound();
  }

  const isPublished = demarche.statutPublication === 'publie';

  // Complétion de chaque section
  const isDescriptionComplete = demarche.description.trim().length > 0;
  const isDiagnosticComplete = Object.values(demarche.volets).every(
    (v) => v === 'complete'
  );
  const isPlanComplete = demarche.planActionId !== null;
  const isDocumentsComplete = demarche.documents.sections.every(
    (s) => s.file !== null || s.couvertSansFichier
  );
  const canPublish =
    isDescriptionComplete &&
    isDiagnosticComplete &&
    isPlanComplete &&
    isDocumentsComplete;

  const handlePublish = () => {
    const updated = setDemarchePcaetStatutPublication(
      collectiviteId,
      demarche.id,
      'publie'
    );
    if (updated) {
      replaceDemarche(updated);
    }
  };

  const handleUnpublish = () => {
    const updated = setDemarchePcaetStatutPublication(
      collectiviteId,
      demarche.id,
      'brouillon'
    );
    if (updated) {
      replaceDemarche(updated);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12" data-test="DemarchePcaetDetail">
      <DemarchePcaetHeader
        demarche={demarche}
        collectiviteId={collectiviteId}
        onDemarcheChange={replaceDemarche}
        onUpdate={update}
      />

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Colonne principale 2/3 */}
        <div className="flex flex-col gap-6 w-full md:flex-[2]">
          <DemarchePcaetSection
            title="Description rapide"
            status={isDescriptionComplete ? 'complete' : 'incomplete'}
          >
            {isPublished ? (
              <p className="text-sm text-grey-8 whitespace-pre-wrap">
                {demarche.description || 'Aucune description renseignée.'}
              </p>
            ) : (
              <Textarea
                value={demarche.description}
                onChange={(e) => update({ description: e.target.value })}
                rows={5}
                placeholder="Présentation du PCAET, contexte territorial…"
              />
            )}
          </DemarchePcaetSection>

          <DiagnosticVoletsSection
            collectiviteId={collectiviteId}
            demarche={demarche}
            isReadonly={isPublished}
            onDocumentsChange={(documents) => update({ documents })}
            status={isDiagnosticComplete ? 'complete' : 'incomplete'}
          />

          <ProgrammeActionsSection
            demarche={demarche}
            onUpdateAction={update}
            status={isPlanComplete ? 'complete' : 'incomplete'}
          />

          <DemarchePcaetSection
            title="Ajouter les documents attendus"
            description="Déposez les pièces réglementaires via la bibliothèque de documents."
            status={isDocumentsComplete ? 'complete' : 'incomplete'}
          >
            <PcaetDocumentsTable
              value={demarche.documents}
              isReadonly={isPublished}
              onChange={(documents) => update({ documents })}
            />
          </DemarchePcaetSection>
        </div>

        {/* Sidebar 1/3 */}
        <div className="flex flex-col gap-4 w-full md:flex-[1]">
          <Alert
            state="info"
            title="Version provisoire"
            description="Les données de la démarche sont stockées localement le temps de brancher l'API PCAET. Le statut brouillon / publiée et les pilotes sont enregistrés dans votre navigateur."
          />

          <AvanceDemarcheSection
            statut={demarche.statut}
            isPublished={isPublished}
            canPublish={canPublish}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
          />

          {isPublished ? (
            <Alert
              state="success"
              title="Démarche publiée"
              description="La démarche est en lecture seule. Repassez en brouillon pour modifier le contenu ou les pilotes."
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
