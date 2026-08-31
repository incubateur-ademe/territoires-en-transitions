import { appLabels } from '@/app/labels/catalog';
import { Checkbox, InfoTooltip } from '@tet/ui';
import { DocType } from './types';

// types de documents pour lesquels l'utilisateur peut choisir l'option "confidentiel"
const ALLOW_PRIVATE: DocType[] = ['reglementaire', 'complementaire', 'annexe'];

/**
 * L'utilisateur peut-il choisir la confidentialité pour ce type de document ?
 * Sinon, il ne faut pas non plus l'imposer : la confidentialité des fichiers
 * déjà présents dans la bibliothèque n'a pas à changer.
 */
export const canChooseConfidentiel = (docType?: DocType): boolean =>
  !!docType && ALLOW_PRIVATE.includes(docType);

/** Affiche le bouton permettant de passer en document en "confidentiel" */
export const CheckboxConfidentiel = ({
  docType,
  confidentiel,
  setConfidentiel,
}: {
  docType?: DocType;
  confidentiel: boolean;
  setConfidentiel: (value: boolean) => void;
}) =>
  canChooseConfidentiel(docType) ? (
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
        label={
          docType === 'annexe'
            ? MSG_ANNEXE_CONFIDENTIELLE
            : MSG_DOC_CONFIDENTIEL
        }
        size="md"
      />
    </div>
  ) : null;

export const MSG_ANNEXE_CONFIDENTIELLE = appLabels.preuveAnnexeConfidentielle;
export const MSG_DOC_CONFIDENTIEL = appLabels.preuveDocConfidentiel;
