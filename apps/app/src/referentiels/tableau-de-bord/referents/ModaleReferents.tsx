import { appLabels } from '@/app/labels/catalog';
import { membreFonctionToLabel } from '@/app/app/labels';
import { makeCollectiviteUsersUrl } from '@/app/app/paths';
import {
  Membre,
  useListMembres,
} from '@/app/collectivites/membres/list-membres/use-list-membres';
import { type MembreFonction } from '@tet/domain/collectivites';
import {
  Field,
  InlineLink,
  Modal,
  ModalFooterOKCancel,
  OptionValue,
} from '@tet/ui';
import { pick } from 'es-toolkit';
import { useState } from 'react';
import { useUpdateMembres } from '../../../collectivites/membres/use-update-membres';
import ReferentsDropdown from './ReferentsDropdown';
import { groupeParFonction } from './useMembres';

export type ModaleReferentsProps = {
  collectiviteId: number;
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
};

const URL_INTRADEME =
  'https://collaboratif.ademe.fr/jcms/prod_143494/fr/cit-ergie-collectivites-cit-ergie';
const EMAIL_ADEME = 'territoireengage@ademe.fr';
const EMPTY_MEMBRES: Membre[] = [];

/**
 * Affiche la modale d'édition des référents de la collectivité
 */
export const ModaleReferents = (props: ModaleReferentsProps) => {
  const { collectiviteId, isOpen, setIsOpen } = props;
  // Stable empty fallback: `= []` would allocate a new array every render and
  // break any sync keyed on `membres` identity.
  const { data: membres = EMPTY_MEMBRES } = useListMembres();
  const { mutate: updateMembres } = useUpdateMembres();

  // Draft overrides — null until the user edits, then fall back to server data
  const [listeMembres, setListeMembres] = useState<Membre[] | null>(null);
  const draft = listeMembres ?? membres;
  const parFonction = groupeParFonction(draft);

  // met à jour l'état local après sélection/désélection dans une liste
  const handleChange = ({ selectedValue }: { selectedValue: OptionValue }) => {
    setListeMembres((prev) =>
      (prev ?? membres).map((membre) =>
        membre.userId === selectedValue
          ? { ...membre, estReferent: !membre.estReferent }
          : membre
      )
    );
  };

  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      title={appLabels.referentAssocierReferents}
      size="sm"
      render={() => (
        <>
          <p>{appLabels.referentStatutDescription}</p>

          <Field
            title={appLabels.membreTeteFonctionTechnique}
            message={
              <span>
                {appLabels.referentInscritIntraAdemeAvant}{' '}
                <InlineLink href={URL_INTRADEME} openInNewTab>
                  {appLabels.referentInscritIntraAdemeLien}
                </InlineLink>{' '}
                {appLabels.referentInscritIntraAdemeApres({
                  email: EMAIL_ADEME,
                })}
              </span>
            }
          >
            <DropdownOrMessage
              collectiviteId={collectiviteId}
              fonction="technique"
              membres={parFonction?.technique}
              handleChange={handleChange}
            />
          </Field>
          <Field title={appLabels.membreTeteFonctionPolitique}>
            <DropdownOrMessage
              collectiviteId={collectiviteId}
              fonction="politique"
              membres={parFonction?.politique}
              handleChange={handleChange}
            />
          </Field>
          <Field title={appLabels.membreTeteFonctionConseiller}>
            <DropdownOrMessage
              collectiviteId={collectiviteId}
              fonction="conseiller"
              membres={parFonction?.conseiller}
              handleChange={handleChange}
            />
          </Field>
        </>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => close(),
          }}
          btnOKProps={{
            onClick: () => {
              // extrait du draft les membres pour lesquels le flag a changé
              const toUpdate = draft
                .filter(
                  (membre) =>
                    membre.estReferent !==
                    membres.find((m) => membre.userId === m.userId)?.estReferent
                )
                .map((membre) => ({
                  ...pick(membre, ['userId', 'estReferent']),
                  collectiviteId,
                }));
              // et déclenche la mise à jour
              if (toUpdate.length) {
                updateMembres(toUpdate);
              }
              close();
            },
          }}
        />
      )}
    />
  );
};

/** Affiche la liste déroulante ou un message+lien si il n'y a pas de membres */
const DropdownOrMessage = ({
  collectiviteId,
  fonction,
  membres,
  handleChange,
}: {
  collectiviteId: number;
  fonction: MembreFonction;
  membres: Membre[] | undefined;
  handleChange: ({ selectedValue }: { selectedValue: OptionValue }) => void;
}) =>
  membres?.length ? (
    <ReferentsDropdown membres={membres} onChange={handleChange} />
  ) : (
    <p>
      {appLabels.referentPersonneNonIdentifiee({
        fonction: membreFonctionToLabel[fonction],
      })}
      <InlineLink href={makeCollectiviteUsersUrl({ collectiviteId })}>
        {appLabels.referentGestionDesMembres}
      </InlineLink>
    </p>
  );
