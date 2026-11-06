import { Checkbox } from '@tet/ui';

/**
 * Suite proposée au dépôt d'un document, sous forme de case à cocher : le
 * programme d'actions d'une démarche peut, par exemple, devenir un plan dans la
 * foulée.
 */
export type AddDocumentFollowUp = {
  label: string;
  description?: string;
  /** Libellé du bouton d'ajout quand la case est cochée. */
  submitLabel: string;
  defaultChecked: boolean;
  /** Le fichier choisi se prête-t-il à cette suite ? */
  isApplicable: (filename: string) => boolean;
};

export type AddDocumentFollowUpChoice = { followUp: boolean };

export const isFollowUpApplicable = (
  followUp: AddDocumentFollowUp | undefined,
  filename: string | undefined
): followUp is AddDocumentFollowUp =>
  followUp !== undefined &&
  filename !== undefined &&
  followUp.isApplicable(filename);

export const FollowUpCheckbox = ({
  followUp,
  checked,
  onChange,
}: {
  followUp: AddDocumentFollowUp;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div className="rounded-lg border border-primary-3 bg-primary-0 p-4">
    <Checkbox
      label={followUp.label}
      message={followUp.description}
      checked={checked}
      onChange={(evt) => onChange(evt.currentTarget.checked)}
      data-test="add-document.follow-up"
    />
  </div>
);
