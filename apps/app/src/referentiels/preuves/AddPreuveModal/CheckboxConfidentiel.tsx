import { Checkbox, InfoTooltip } from '@tet/ui';
import { DocType } from './types';

// types de documents pour lesquels l'utilisateur peut choisir l'option "confidentiel"
const ALLOW_PRIVATE: DocType[] = ['reglementaire', 'complementaire', 'annexe'];

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
  !!docType && ALLOW_PRIVATE.includes(docType) ? (
    <div className="flex flex-row items-center gap-2">
      <Checkbox
        variant="switch"
        label="Document en mode privé"
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

/** Libellés affichés dans l'infobulle à côté du bouton "confidentiel" */
export const MSG_ANNEXE_CONFIDENTIELLE = `Nous vous encourageons à partager vos documents : ils permettent à d’autres collectivités de s’inspirer de vos actions, de vos pratiques.

Si vos documents sont confidentiels, vous pouvez activer cette option : seuls les membres de votre collectivité (dont votre conseiller et votre auditeur si vous êtes engagés dans le programme “Territoire Engagé Transition Écologique”) et le service support de la plateforme pourront y accéder.

Si la fiche action est en mode privé, les documents ne seront pas accessibles par des personnes n’étant pas membres de votre collectivité, que le document soit en mode privé ou non.`;

export const MSG_DOC_CONFIDENTIEL = `Nous vous encourageons à partager vos documents : ils permettent à d’autres collectivités de s’inspirer de vos actions, vos pratiques, etc.

Si vos documents sont confidentiels, vous pouvez activer cette option : seuls les membres de votre collectivité, votre conseiller, votre auditeur et le service support de la plateforme pourront y accéder`;
