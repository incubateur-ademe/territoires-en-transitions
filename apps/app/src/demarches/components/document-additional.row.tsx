'use client';

import { appLabels } from '@/app/labels/catalog';
import { FileConstraints } from '@/app/referentiels/preuves/upload/constants';
import {
  DEMARCHE_DOCUMENT_ADDITIONAL_TITRE_MAX,
  type DemarcheDocumentEtape,
  type DemarcheDocumentAdditional,
  type DemarcheType,
} from '@tet/domain/demarches';
import { Badge, Button, ChecklistTable, Input } from '@tet/ui';
import { ReactElement, useEffect, useRef, useState } from 'react';
import { DemarcheDocumentUploadSplitButton } from './document-upload.button';
import { FichierDepose } from './fichier-depose';

/**
 * Saisie du nom d'une pièce additionnelle. Rien à valider : le nom s'enregistre
 * à la sortie du champ comme partout ailleurs, la touche Entrée fait la même
 * chose et Échap abandonne. Partir déposer un fichier enregistre donc le nom
 * qu'on vient d'écrire, au lieu de le perdre.
 *
 * Le champ prend le focus à l'ouverture — c'est par lui que la ligne commence.
 * `autoFocus` seul ne suffit pas toujours dans une ligne de tableau qui vient
 * d'être insérée : on le pose aussi à la main.
 */
const TitreInput = ({
  titre,
  dataTest,
  onSubmit,
  onClose,
}: {
  titre: string;
  dataTest: string;
  onSubmit: (titre: string) => void;
  onClose: () => void;
}): ReactElement => {
  const [valeur, setValeur] = useState(titre);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const nouveauTitre = valeur.trim();
    if (nouveauTitre !== titre) {
      onSubmit(nouveauTitre);
    }
    onClose();
  };

  const annuler = () => {
    setValeur(titre);
    onClose();
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      displaySize="xs"
      // Le champ occupe la cellule : `InputBase` est un `inline-flex`, sans ça
      // il se réduirait à la largeur de son contenu.
      containerClassname="w-full"
      autoFocus
      value={valeur}
      maxLength={DEMARCHE_DOCUMENT_ADDITIONAL_TITRE_MAX}
      aria-label={appLabels.demarcheDocumentsAdditionalTitreLabel}
      placeholder={appLabels.demarcheDocumentsAdditionalTitrePlaceholder}
      onChange={(event) => setValeur(event.currentTarget.value)}
      onBlur={submit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          submit();
        }
        if (event.key === 'Escape') {
          annuler();
        }
      }}
      data-test={dataTest}
    />
  );
};

/**
 * Nom au repos. Le nom est le texte lui-même : c'est lui qu'on clique pour le
 * changer, sans bouton d'édition à découvrir au survol.
 */
const TitreLabel = ({
  titre,
  dataTest,
  onEdit,
}: {
  titre: string;
  dataTest: string;
  onEdit?: () => void;
}): ReactElement => {
  const content = titre ? (
    <span className="font-medium">{titre}</span>
  ) : (
    <span className="italic text-grey-7">
      {appLabels.demarcheDocumentsAdditionalSaisirNom}
    </span>
  );

  if (!onEdit) {
    return <div>{content}</div>;
  }

  return (
    <button
      type="button"
      className="block w-full cursor-pointer border-none bg-transparent p-0 text-left text-sm text-primary-9 hover:underline"
      title={appLabels.demarcheDocumentsAdditionalRenommer}
      onClick={onEdit}
      data-test={dataTest}
    >
      {content}
    </button>
  );
};

type RowProps = {
  demarcheType: DemarcheType;
  fileConstraints: FileConstraints;
  documentAdditional: DemarcheDocumentAdditional;
  isReadonly: boolean;
  /** La pièce vient d'être ouverte : son champ de nom s'ouvre avec elle. */
  isJustCreated: boolean;
  onRename: (titre: string) => void;
  onAddFichier: (fichierId: number) => void;
  onRemove: () => void;
  onDownload?: (documentAdditional: DemarcheDocumentAdditional) => void;
};

/**
 * Pièce additionnelle, ajoutée par la collectivité. Toujours optionnelle : elle ne
 * manque jamais au dossier. Son nom se saisit sur place et peut rester vide — la
 * ligne invite alors à la nommer, ce qui n'empêche ni le dépôt ni le retrait.
 *
 * Le retrait de la ligne est rangé derrière la flèche du bouton scindé : c'est le
 * dépôt qui domine, ici comme sur les pièces attendues.
 */
export const DemarcheDocumentAdditionalRow = ({
  demarcheType,
  fileConstraints,
  documentAdditional,
  isReadonly,
  isJustCreated,
  onRename,
  onAddFichier,
  onRemove,
  onDownload,
}: RowProps): ReactElement => {
  const { id, titre, fichier } = documentAdditional;
  // `null` tant que le champ n'a pas été ouvert ni fermé à la main : c'est alors
  // la création qui décide. Elle peut se prononcer un rendu après le montage de
  // la ligne — la mutation attend l'invalidation de la liste, donc la ligne
  // apparaît parfois avant de savoir qu'elle vient de naître. Un état initialisé
  // une fois pour toutes laisserait son champ de nom fermé.
  const [isEditingTitreChoice, setIsEditingTitreChoice] = useState<
    boolean | null
  >(null);
  const isEditingTitre = isEditingTitreChoice ?? isJustCreated;

  return (
    <ChecklistTable.Row
      tag={
        <Badge
          title={appLabels.demarcheDocumentsBadgeOptionnel}
          variant="grey"
          type="solid"
          size="sm"
          uppercase={false}
        />
      }
      criterion={{
        label:
          isEditingTitre && !isReadonly ? (
            <TitreInput
              titre={titre}
              dataTest={`demarches.pcaet.documents.additional.titre.${id}`}
              onSubmit={onRename}
              onClose={() => setIsEditingTitreChoice(false)}
            />
          ) : (
            <TitreLabel
              titre={titre}
              dataTest={`demarches.pcaet.documents.additional.renommer.${id}`}
              onEdit={
                isReadonly ? undefined : () => setIsEditingTitreChoice(true)
              }
            />
          ),
      }}
      answer={
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          {fichier && (
            <FichierDepose
              filename={fichier.filename}
              onDownload={onDownload && (() => onDownload(documentAdditional))}
            />
          )}
          {!isReadonly && (
            <DemarcheDocumentUploadSplitButton
              demarcheType={demarcheType}
              fileConstraints={fileConstraints}
              label={
                fichier
                  ? appLabels.demarcheDocumentsRemplacerDocument
                  : appLabels.demarcheDocumentsTeleverser
              }
              dataTest={`demarches.pcaet.documents.additional.televerser.${id}`}
              menuDataTest={`demarches.pcaet.documents.additional.retirer.${id}`}
              menuActions={[
                {
                  icon: 'delete-bin-line',
                  label: appLabels.demarcheDocumentsAdditionalSupprimer,
                  variant: 'destructive',
                  // Retirer la ligne n'est pas la quitter : on referme le champ
                  // de nom, la pièce qui le portait n'existe plus.
                  onClick: () => {
                    setIsEditingTitreChoice(false);
                    onRemove();
                  },
                },
              ]}
              onAddFichier={onAddFichier}
            />
          )}
        </div>
      }
    />
  );
};

/**
 * Ligne d'ajout d'une pièce additionnelle : un clic ouvre la ligne, immédiatement
 * utilisable. Rien à valider d'abord — ni le nom, qui s'écrit sur place, ni le
 * fichier, dont le bouton de dépôt est actif dès l'apparition de la ligne.
 */
export const DemarcheDocumentAdditionalAddRow = ({
  etape,
  onCreate,
}: {
  etape: DemarcheDocumentEtape;
  onCreate: () => void;
}): ReactElement => (
  <ChecklistTable.FooterRow>
    <Button
      variant="underlined"
      size="xs"
      icon="add-line"
      onClick={onCreate}
      data-test={`demarches.pcaet.documents.additional.ajouter.${etape}`}
    >
      {appLabels.demarcheDocumentsAdditionalAjouter}
    </Button>
  </ChecklistTable.FooterRow>
);
