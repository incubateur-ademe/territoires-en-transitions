'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  toFileConstraints,
  type FileConstraints,
} from '@/app/referentiels/preuves/upload/constants';
import {
  findDemarcheDocumentSubstitutDepose,
  isDemarcheDocumentsAdditionalAutorise,
} from '@tet/domain/demarches';
import type {
  DemarcheDocumentCoverage,
  DemarcheDocumentDefinition,
  DemarcheDocumentDepose,
  DemarcheDocumentEtape,
  DemarcheDocumentAdditional,
  DemarcheDocumentsConfig,
  DemarcheType,
} from '@tet/domain/demarches';
import { Badge, Checkbox, ChecklistTable, Icon } from '@tet/ui';
import { ReactElement, useMemo } from 'react';
import {
  DemarcheDocumentAdditionalAddRow,
  DemarcheDocumentAdditionalRow,
} from './document-additional.row';
import {
  DemarcheDocumentUploadButton,
  DemarcheDocumentUploadSplitButton,
} from './document-upload.button';
import { FichierDepose } from './fichier-depose';

const SectionRequiredBadge = ({
  requis,
}: {
  requis: boolean;
}): ReactElement => (
  <Badge
    title={
      requis
        ? appLabels.demarcheDocumentsBadgeObligatoire
        : appLabels.demarcheDocumentsBadgeOptionnel
    }
    variant={requis ? 'info' : 'grey'}
    type="solid"
    size="sm"
    uppercase={false}
  />
);

/** Couverture sans dépôt : la pièce est comprise dans une autre du dossier. */
const CouvertureSansFichier = ({
  substitutNom,
}: {
  substitutNom: string;
}): ReactElement => (
  <div className="flex items-center gap-2 text-grey-9">
    <Icon
      icon="checkbox-circle-fill"
      size="sm"
      className="text-success shrink-0"
    />
    <span className="text-sm">
      {appLabels.demarcheDocumentsCouvertPar({ nom: substitutNom })}
    </span>
  </div>
);

/**
 * Nom de la pièce attendue, et ce que le modèle en dit. Le document global est
 * la seule pièce décrite pour l'instant — sa description explique ce que son
 * dépôt couvre, elle n'a pas à s'afficher ailleurs que sur sa ligne.
 */
const DefinitionLabel = ({
  definition,
}: {
  definition: DemarcheDocumentDefinition;
}): ReactElement => (
  <div className="flex flex-col gap-0.5 min-w-0">
    <div className="font-medium">{definition.nom}</div>
    {definition.description && (
      <p className="m-0 text-xs text-grey-7">{definition.description}</p>
    )}
  </div>
);

const SectionAnswer = ({
  demarcheType,
  fileConstraints,
  definition,
  document,
  coverage,
  substitutDeclarable,
  substitutCouvrantNom,
  isReadonly,
  onAddFichier,
  onRemove,
  onToggleCouverture,
  onDownload,
}: {
  demarcheType: DemarcheType;
  fileConstraints: FileConstraints;
  definition: DemarcheDocumentDefinition;
  document: DemarcheDocumentDepose | undefined;
  coverage: DemarcheDocumentCoverage | undefined;
  /**
   * Pièce déposée dans laquelle celle-ci peut être déclarée comprise, `null`
   * s'il n'y en a pas : c'est ce qui fait apparaître la case d'inclusion.
   */
  substitutDeclarable: DemarcheDocumentDefinition | null;
  /** Nom de la pièce qui couvre celle-ci, pour la mention sans case à cocher. */
  substitutCouvrantNom: string | undefined;
  isReadonly: boolean;
  onAddFichier: (fichierId: number) => void;
  onRemove: () => void;
  onToggleCouverture: (couvert: boolean) => void;
  onDownload?: (document: DemarcheDocumentDepose) => void;
}): ReactElement => {
  // Un dépôt spécifique prime toujours sur les autres modes de couverture.
  // Une pièce sans fichier est une couverture déclarée, pas un dépôt.
  if (document?.fichier) {
    return (
      <div className="flex flex-wrap items-center gap-3 min-w-0">
        <FichierDepose
          filename={document.fichier.filename}
          onDownload={onDownload && (() => onDownload(document))}
        />
        {!isReadonly && (
          <DemarcheDocumentUploadSplitButton
            demarcheType={demarcheType}
            fileConstraints={fileConstraints}
            label={appLabels.demarcheDocumentsRemplacerDocument}
            dataTest={`demarches.pcaet.documents.remplacer.${definition.id}`}
            menuDataTest={`demarches.pcaet.documents.actions.${definition.id}`}
            menuActions={[
              {
                icon: 'delete-bin-line',
                label: appLabels.demarcheDocumentsSupprimerDocument,
                onClick: onRemove,
              },
            ]}
            onAddFichier={onAddFichier}
          />
        )}
      </div>
    );
  }

  // Inclusion déclarée : la pièce n'est pas couverte d'office par le document
  // qui l'accueille, la collectivité dit elle-même qu'elle s'y trouve. La case
  // n'a de sens que si ce document est déposé — sinon il n'y a rien à cocher, et
  // le dépôt d'une pièce propre reste la seule issue.
  if (substitutDeclarable !== null) {
    const estDeclareInclus = coverage?.origine === 'substitut';
    return (
      <div className="flex flex-col items-start gap-2 min-w-0">
        <Checkbox
          variant="checkbox"
          size="sm"
          // Vert : la case dit que la pièce est servie, comme la coche des
          // autres couvertures, pas qu'une option a été choisie.
          checkedColor="success"
          checked={estDeclareInclus}
          disabled={isReadonly}
          label={appLabels.demarcheDocumentsInclusDans({
            nom: substitutDeclarable.nom,
          })}
          onChange={(e) => onToggleCouverture(e.currentTarget.checked)}
          data-test={`demarches.pcaet.documents.inclusion.${definition.id}`}
        />
        {!estDeclareInclus && (
          <SectionFallback
            demarcheType={demarcheType}
            fileConstraints={fileConstraints}
            documentId={definition.id}
            coverage={coverage}
            substitutCouvrantNom={substitutCouvrantNom}
            isReadonly={isReadonly}
            onAddFichier={onAddFichier}
          />
        )}
      </div>
    );
  }

  return (
    <SectionFallback
      demarcheType={demarcheType}
      fileConstraints={fileConstraints}
      documentId={definition.id}
      coverage={coverage}
      substitutCouvrantNom={substitutCouvrantNom}
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
  demarcheType,
  fileConstraints,
  documentId,
  coverage,
  substitutCouvrantNom,
  isReadonly,
  onAddFichier,
}: {
  demarcheType: DemarcheType;
  fileConstraints: FileConstraints;
  documentId: string;
  coverage: DemarcheDocumentCoverage | undefined;
  substitutCouvrantNom: string | undefined;
  isReadonly: boolean;
  onAddFichier: (fichierId: number) => void;
}): ReactElement => (
  <div className="flex flex-wrap items-center gap-3 min-w-0">
    {coverage?.origine === 'substitut' && substitutCouvrantNom && (
      <CouvertureSansFichier substitutNom={substitutCouvrantNom} />
    )}
    {!isReadonly && (
      <DemarcheDocumentUploadButton
        demarcheType={demarcheType}
        fileConstraints={fileConstraints}
        variant="outlined"
        label={appLabels.demarcheDocumentsTeleverser}
        dataTest={`demarches.pcaet.documents.televerser.${documentId}`}
        onAddFichier={onAddFichier}
      />
    )}
  </div>
);

type Props = {
  /** Type de démarche : les libellés affichés en dépendent. */
  demarcheType: DemarcheType;
  /**
   * Étape dont les pièces sont listées. Le dossier d'élaboration (amont) et les
   * pièces produites après les avis (aval) ne se mélangent pas dans une liste.
   */
  etape: DemarcheDocumentEtape;
  /** Ce que le type de démarche autorise : formats acceptés et dépôt de pièces additionnelles. */
  config: DemarcheDocumentsConfig;
  definitions: DemarcheDocumentDefinition[];
  documents: DemarcheDocumentDepose[];
  documentsAdditional: DemarcheDocumentAdditional[];
  coverage: DemarcheDocumentCoverage[];
  /** Gel par pièce : l'amont et l'aval ne sont pas modifiables aux mêmes statuts. */
  isDocumentReadonly?: (definition: DemarcheDocumentDefinition) => boolean;
  /** Gel de l'étape entière, pour les pièces additionnelles qui n'ont pas de définition. */
  isEtapeReadonly?: boolean;
  onAddFichier: (documentId: string, fichierId: number) => void;
  onRemoveDocument: (documentId: string) => void;
  onToggleCouverture: (documentId: string, couvert: boolean) => void;
  onCreateAdditional: (etape: DemarcheDocumentEtape) => void;
  /** Pièce additionnelle tout juste ouverte : sa ligne s'ouvre en saisie du nom. */
  documentAdditionalCreeId?: number;
  onRenameAdditional: (documentAdditionalId: number, titre: string) => void;
  onAddFichierAdditional: (
    documentAdditionalId: number,
    fichierId: number
  ) => void;
  onRemoveAdditional: (documentAdditionalId: number) => void;
  onDownload?: (document: DemarcheDocumentDepose) => void;
  onDownloadAdditional?: (
    documentAdditional: DemarcheDocumentAdditional
  ) => void;
};

/**
 * Dépôt des pièces d'un dossier de démarche. Entièrement piloté par le modèle de
 * démarche : la pièce globale, l'ordre des sections, leur caractère obligatoire,
 * la couverture par substitution, les formats acceptés et l'ouverture aux
 * pièces additionnelles viennent des données, pas du composant.
 *
 * Une seule liste, dans l'ordre du modèle : le document global n'a pas de bloc à
 * lui, il est la première pièce attendue du dossier et se dépose comme les
 * autres.
 */
export const DemarcheDocumentsTable = ({
  demarcheType,
  etape,
  config,
  definitions,
  documents,
  documentsAdditional,
  documentAdditionalCreeId,
  coverage,
  isDocumentReadonly = () => false,
  isEtapeReadonly = false,
  onAddFichier,
  onRemoveDocument,
  onToggleCouverture,
  onCreateAdditional,
  onRenameAdditional,
  onAddFichierAdditional,
  onRemoveAdditional,
  onDownload,
  onDownloadAdditional,
}: Props): ReactElement => {
  const fileConstraints = useMemo(() => toFileConstraints(config), [config]);
  const documentByDefinitionId = useMemo(
    () => new Map(documents.map((document) => [document.documentId, document])),
    [documents]
  );
  const coverageByDefinitionId = useMemo(
    () => new Map(coverage.map((entry) => [entry.documentId, entry])),
    [coverage]
  );
  // Les pièces se nomment l'une l'autre : l'inclusion s'annonce sous le nom du
  // document qui l'accueille, tel que le modèle l'écrit.
  const definitionById = useMemo(
    () => new Map(definitions.map((definition) => [definition.id, definition])),
    [definitions]
  );

  const definitionsForEtape = definitions.filter(
    (definition) => definition.etape === etape
  );

  return (
    <div
      className="flex flex-col gap-4"
      data-test={`demarches.pcaet.documents.table.${etape}`}
    >
      {/* Sans colonne de statut : la réponse de chaque ligne porte déjà le
          fichier déposé ou la couverture déclarée, avec sa coche. */}
      <ChecklistTable
        caption={appLabels.demarcheDocumentsCaption({
          type: appLabels.demarcheTypeLabels[demarcheType],
          etape,
        })}
        hasTagColumn
        hasStatusColumn={false}
      >
        <ChecklistTable.Head
          labelHeader={appLabels.demarcheDocumentsColonneNom}
          answerHeader={appLabels.demarcheDocumentsColonneDocuments}
          tagHeader={appLabels.demarcheDocumentsColonneType}
        />
        {definitionsForEtape.map((definition) => (
          <ChecklistTable.Row
            key={definition.id}
            tag={<SectionRequiredBadge requis={definition.requis} />}
            criterion={{ label: <DefinitionLabel definition={definition} /> }}
            answer={
              <SectionAnswer
                demarcheType={demarcheType}
                fileConstraints={fileConstraints}
                definition={definition}
                document={documentByDefinitionId.get(definition.id)}
                coverage={coverageByDefinitionId.get(definition.id)}
                substitutDeclarable={
                  definitionById.get(
                    findDemarcheDocumentSubstitutDepose(definition, documents) ??
                      ''
                  ) ?? null
                }
                substitutCouvrantNom={
                  definitionById.get(
                    coverageByDefinitionId.get(definition.id)?.substitutId ?? ''
                  )?.nom
                }
                isReadonly={isDocumentReadonly(definition)}
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

        {/* Pièces hors catalogue : elles ferment la liste, après ce que le
            modèle attend. */}
        {documentsAdditional
          .filter((documentAdditional) => documentAdditional.etape === etape)
          .map((documentAdditional) => (
            <DemarcheDocumentAdditionalRow
              key={documentAdditional.id}
              demarcheType={demarcheType}
              fileConstraints={fileConstraints}
              documentAdditional={documentAdditional}
              isReadonly={isEtapeReadonly}
              isJustCreated={documentAdditional.id === documentAdditionalCreeId}
              onRename={(titre) =>
                onRenameAdditional(documentAdditional.id, titre)
              }
              onAddFichier={(fichierId) =>
                onAddFichierAdditional(documentAdditional.id, fichierId)
              }
              onRemove={() => onRemoveAdditional(documentAdditional.id)}
              onDownload={onDownloadAdditional}
            />
          ))}

        {!isEtapeReadonly &&
          isDemarcheDocumentsAdditionalAutorise(config, etape) && (
            <DemarcheDocumentAdditionalAddRow
              etape={etape}
              onCreate={() => onCreateAdditional(etape)}
            />
          )}
      </ChecklistTable>
    </div>
  );
};
