'use client';

import { appLabels } from '@/app/labels/catalog';
import { Badge, Button, Checkbox, ChecklistTable, Icon } from '@tet/ui';
import type {
  DemarcheDocumentCoverage,
  DemarcheDocumentDefinition,
  DemarcheDocumentDepose,
} from '@tet/domain/demarches';
import { ReactElement, useMemo } from 'react';
import { PcaetDocumentUploadButton } from './pcaet-document-upload.button';

const SectionRequiredBadge = ({
  requis,
}: {
  requis: boolean;
}): ReactElement => (
  <Badge
    title={
      requis
        ? appLabels.demarchePcaetDocumentsBadgeObligatoire
        : appLabels.demarchePcaetDocumentsBadgeOptionnel
    }
    variant={requis ? 'info' : 'grey'}
    type="solid"
    size="sm"
    uppercase={false}
  />
);

const FichierDepose = ({
  document,
  onDownload,
}: {
  document: DemarcheDocumentDepose;
  onDownload?: (document: DemarcheDocumentDepose) => void;
}): ReactElement => (
  <div className="flex items-center gap-2 text-grey-9 min-w-0">
    <Icon
      icon="checkbox-circle-fill"
      size="sm"
      className="text-success shrink-0"
    />
    {onDownload ? (
      <button
        type="button"
        className="font-medium text-primary-8 hover:underline truncate text-left"
        onClick={() => onDownload(document)}
      >
        {document.fichier?.filename}
      </button>
    ) : (
      <span className="font-medium truncate">{document.fichier?.filename}</span>
    )}
  </div>
);

/** Couverture sans dépôt : par le plan d'actions ou par une autre pièce. */
const CouvertureSansFichier = ({
  origine,
}: {
  origine: 'plan_actions' | 'substitut';
}): ReactElement => (
  <div className="flex items-center gap-2 text-grey-9">
    <Icon
      icon="checkbox-circle-fill"
      size="sm"
      className="text-success shrink-0"
    />
    <span className="text-sm">
      {origine === 'plan_actions'
        ? appLabels.demarchePcaetDocumentsCouvertViaPlan
        : appLabels.demarchePcaetDocumentsCouvertViaGlobal}
    </span>
  </div>
);

const GlobalDocumentCard = ({
  definition,
  document,
  isReadonly,
  onAddFichier,
  onRemove,
  onDownload,
}: {
  definition: DemarcheDocumentDefinition;
  document: DemarcheDocumentDepose | undefined;
  isReadonly: boolean;
  onAddFichier: (fichierId: number) => void;
  onRemove: () => void;
  onDownload?: (document: DemarcheDocumentDepose) => void;
}): ReactElement => (
  <div className="rounded-lg border border-primary-3 bg-primary-0 p-4 flex flex-col gap-3">
    <div>
      <div className="flex items-center gap-2">
        <Icon icon="folder-2-line" size="sm" className="text-primary-8" />
        <span className="font-medium text-primary-9">{definition.nom}</span>
      </div>
      <p className="text-xs text-grey-7 mt-1 m-0">
        {definition.description ||
          appLabels.demarchePcaetDocumentsGlobalDescription}
      </p>
    </div>

    {document ? (
      <div className="flex flex-wrap items-center gap-3">
        <FichierDepose document={document} onDownload={onDownload} />
        {!isReadonly && (
          <div className="flex items-center gap-2">
            <PcaetDocumentUploadButton
              variant="outlined"
              label={appLabels.demarchePcaetDocumentsGlobalRemplacer}
              dataTest="demarches.pcaet.documents.remplacer-global"
              onAddFichier={onAddFichier}
            />
            <Button
              variant="grey"
              size="xs"
              icon="delete-bin-line"
              onClick={onRemove}
              data-test="demarches.pcaet.documents.retirer-global"
            >
              {appLabels.demarchePcaetDocumentsGlobalRetirer}
            </Button>
          </div>
        )}
      </div>
    ) : (
      !isReadonly && (
        <PcaetDocumentUploadButton
          variant="primary"
          label={appLabels.demarchePcaetDocumentsGlobalTeleverser}
          dataTest="demarches.pcaet.documents.deposer-global"
          onAddFichier={onAddFichier}
        />
      )
    )}
  </div>
);

const SectionAnswer = ({
  definition,
  document,
  coverage,
  isReadonly,
  planActionRattache,
  onAddFichier,
  onRemove,
  onToggleCouverture,
  onDownload,
}: {
  definition: DemarcheDocumentDefinition;
  document: DemarcheDocumentDepose | undefined;
  coverage: DemarcheDocumentCoverage | undefined;
  isReadonly: boolean;
  planActionRattache: boolean;
  onAddFichier: (fichierId: number) => void;
  onRemove: () => void;
  onToggleCouverture: (couvert: boolean) => void;
  onDownload?: (document: DemarcheDocumentDepose) => void;
}): ReactElement => {
  // Un dépôt spécifique prime toujours sur les autres modes de couverture.
  if (document) {
    return (
      <div className="flex flex-wrap items-center gap-3 min-w-0">
        <FichierDepose document={document} onDownload={onDownload} />
        {!isReadonly && (
          <div className="flex items-center gap-2">
            <PcaetDocumentUploadButton
              label={appLabels.demarchePcaetDocumentsRemplacerFichier}
              onAddFichier={onAddFichier}
            />
            <Button
              variant="grey"
              size="xs"
              icon="delete-bin-line"
              onClick={onRemove}
            >
              {appLabels.demarchePcaetDocumentsRetirerFichier}
            </Button>
          </div>
        )}
      </div>
    );
  }

  const estCouvertParLePlan = coverage?.origine === 'plan_actions';

  // Le modèle de démarche décide quelles pièces peuvent être déclarées prises en
  // charge par le plan d'actions suivi sur la plateforme.
  if (definition.couverturePlateforme === 'plan_actions') {
    return (
      <div className="flex flex-col items-start gap-2 min-w-0">
        <Checkbox
          variant="checkbox"
          size="sm"
          checked={estCouvertParLePlan}
          disabled={isReadonly || !planActionRattache}
          label={appLabels.demarchePcaetDocumentsComprisDansPlanSuivi}
          message={
            !planActionRattache
              ? appLabels.demarchePcaetDocumentsPlanNonRattacheAide
              : estCouvertParLePlan
              ? undefined
              : appLabels.demarchePcaetDocumentsComprisDansPlanSuiviAide
          }
          onChange={(e) => onToggleCouverture(e.currentTarget.checked)}
        />
        {!estCouvertParLePlan && (
          <SectionFallback
            coverage={coverage}
            isReadonly={isReadonly}
            onAddFichier={onAddFichier}
          />
        )}
      </div>
    );
  }

  return (
    <SectionFallback
      coverage={coverage}
      isReadonly={isReadonly}
      onAddFichier={onAddFichier}
    />
  );
};

/**
 * Ce qui reste à afficher quand aucun fichier propre n'est déposé : la mention de
 * couverture par une autre pièce, et le dépôt d'un document spécifique.
 */
const SectionFallback = ({
  coverage,
  isReadonly,
  onAddFichier,
}: {
  coverage: DemarcheDocumentCoverage | undefined;
  isReadonly: boolean;
  onAddFichier: (fichierId: number) => void;
}): ReactElement => (
  <div className="flex flex-wrap items-center gap-3 min-w-0">
    {coverage?.origine === 'substitut' && (
      <CouvertureSansFichier origine="substitut" />
    )}
    {!isReadonly && (
      <PcaetDocumentUploadButton
        label={appLabels.demarchePcaetDocumentsTeleverser}
        onAddFichier={onAddFichier}
      />
    )}
  </div>
);

type Props = {
  definitions: DemarcheDocumentDefinition[];
  documents: DemarcheDocumentDepose[];
  coverage: DemarcheDocumentCoverage[];
  planActionRattache: boolean;
  isReadonly?: boolean;
  onAddFichier: (documentId: string, fichierId: number) => void;
  onRemoveDocument: (documentId: string) => void;
  onToggleCouverture: (documentId: string, couvert: boolean) => void;
  onDownload?: (document: DemarcheDocumentDepose) => void;
};

/**
 * Dépôt des pièces d'un dossier PCAET. Entièrement piloté par le modèle de
 * démarche : la pièce globale, l'ordre des sections, leur caractère obligatoire
 * et la couverture par substitution viennent des données, pas du composant.
 */
export const PcaetDocumentsTable = ({
  definitions,
  documents,
  coverage,
  planActionRattache,
  isReadonly = false,
  onAddFichier,
  onRemoveDocument,
  onToggleCouverture,
  onDownload,
}: Props): ReactElement => {
  const documentByDefinitionId = useMemo(
    () => new Map(documents.map((document) => [document.documentId, document])),
    [documents]
  );
  const coverageByDefinitionId = useMemo(
    () => new Map(coverage.map((entry) => [entry.documentId, entry])),
    [coverage]
  );

  const global = definitions.find(({ portee }) => portee === 'global');
  const sections = definitions.filter(({ portee }) => portee === 'section');

  return (
    <div className="flex flex-col gap-4" data-test="PcaetDocumentsTable">
      {global && (
        <GlobalDocumentCard
          definition={global}
          document={documentByDefinitionId.get(global.id)}
          isReadonly={isReadonly}
          onAddFichier={(fichierId) => onAddFichier(global.id, fichierId)}
          onRemove={() => onRemoveDocument(global.id)}
          onDownload={onDownload}
        />
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary-9 m-0">
          {appLabels.demarchePcaetDocumentsSectionsDetail}
        </p>
        <ChecklistTable
          caption={appLabels.demarchePcaetDocumentsCaption}
          hasTagColumn
        >
          <ChecklistTable.Head
            labelHeader={appLabels.demarchePcaetDocumentsColonneSection}
            answerHeader={appLabels.demarchePcaetDocumentsColonneDocuments}
            tagHeader={appLabels.demarchePcaetDocumentsColonneType}
          />
          {sections.map((definition) => (
            <ChecklistTable.Row
              key={definition.id}
              done={coverageByDefinitionId.get(definition.id)?.couvert ?? false}
              tag={<SectionRequiredBadge requis={definition.requis} />}
              criterion={{
                label: <div className="font-medium">{definition.nom}</div>,
              }}
              answer={
                <SectionAnswer
                  definition={definition}
                  document={documentByDefinitionId.get(definition.id)}
                  coverage={coverageByDefinitionId.get(definition.id)}
                  isReadonly={isReadonly}
                  planActionRattache={planActionRattache}
                  onAddFichier={(fichierId) =>
                    onAddFichier(definition.id, fichierId)
                  }
                  onRemove={() => onRemoveDocument(definition.id)}
                  onToggleCouverture={(couvert) =>
                    onToggleCouverture(definition.id, couvert)
                  }
                  onDownload={onDownload}
                />
              }
            />
          ))}
        </ChecklistTable>
      </div>
    </div>
  );
};
