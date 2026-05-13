import { appLabels } from '@/app/labels/catalog';
import { membreFonctionToLabel } from '@/app/app/labels';
import { makeCollectiviteUsersUrl } from '@/app/app/paths';
import {
  Membre,
  useListMembres,
} from '@/app/collectivites/membres/list-membres/use-list-membres';
import { type MembreFonction } from '@tet/domain/collectivites';
import { Field, InlineLink, OptionValue } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { pick } from 'es-toolkit';
import { useEffect, useState } from 'react';
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

/**
 * Affiche la modale d'édition des référents de la collectivité
 */
export const ModaleReferents = (props: ModaleReferentsProps) => {
  const { collectiviteId, isOpen, setIsOpen } = props;
  const { data: membres = [] } = useListMembres();
  const { mutate: updateMembres } = useUpdateMembres();

  const [listeMembres, setListeMembres] = useState(membres);
  const parFonction = groupeParFonction(listeMembres || []);

  useEffect(() => {
    if (membres) {
      setListeMembres(membres);
    }
  }, [membres]);

  const handleChange = ({ selectedValue }: { selectedValue: OptionValue }) => {
    const updatedListeMembres = listeMembres?.map((membre) =>
      membre.userId === selectedValue
        ? { ...membre, estReferent: !membre.estReferent }
        : membre
    );
    setListeMembres(updatedListeMembres);
  };

  return (
    <Modal openState={{ isOpen: isOpen, setIsOpen: setIsOpen }} size="md">
      <Modal.Header>
        <Modal.Title>{appLabels.referentAssocierReferents}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
        <Modal.Ok
          onClick={() => {
            const toUpdate = listeMembres
              ?.filter(
                (membre) =>
                  membre.estReferent !==
                  membres.find((m) => membre.userId === m.userId)?.estReferent
              )
              .map((membre) => ({
                ...pick(membre, ['userId', 'estReferent']),
                collectiviteId,
              }));
            if (toUpdate?.length) {
              updateMembres(toUpdate);
            }
            setIsOpen(false);
          }}
        >
          {appLabels.valider}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
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
