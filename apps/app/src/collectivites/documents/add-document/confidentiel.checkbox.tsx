import { appLabels } from '@/app/labels/catalog';
import { PreuveType } from '@tet/domain/collectivites';
import { Checkbox, InfoTooltip } from '@tet/ui';

const PREUVE_TYPES_CONFIDENTIABLES: PreuveType[] = [
  'reglementaire',
  'complementaire',
  'annexe',
];

/**
 * L'utilisateur peut-il choisir la confidentialité pour ce type de document ?
 * Sinon, il ne faut pas non plus l'imposer : la confidentialité des fichiers
 * déjà présents dans la bibliothèque n'a pas à changer.
 */
export const canChooseConfidentiel = (preuveType?: PreuveType): boolean =>
  !!preuveType && PREUVE_TYPES_CONFIDENTIABLES.includes(preuveType);

export const ConfidentielCheckbox = ({
  preuveType,
  confidentiel,
  setConfidentiel,
}: {
  preuveType?: PreuveType;
  confidentiel: boolean;
  setConfidentiel: (value: boolean) => void;
}) => {
  if (!canChooseConfidentiel(preuveType)) {
    return null;
  }

  const confidentialiteInfo =
    preuveType === 'annexe'
      ? appLabels.preuveAnnexeConfidentielle
      : appLabels.preuveDocConfidentiel;

  return (
    <div className="flex flex-row items-center gap-2">
      <Checkbox
        variant="switch"
        label={appLabels.fichierModePrive}
        checked={confidentiel}
        onChange={(evt) => setConfidentiel(evt.currentTarget.checked)}
      />
      <InfoTooltip
        iconClassName="text-primary-8"
        className="whitespace-break-spaces !text-lg"
        label={confidentialiteInfo}
        size="md"
      />
    </div>
  );
};
