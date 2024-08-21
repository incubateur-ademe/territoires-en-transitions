import {useEffect, useState} from 'react';
import _ from 'lodash';
import {
  Field,
  FormSectionGrid,
  Modal,
  ModalFooterOKCancel,
  useEventTracker,
} from '@tet/ui';
import {FicheAction} from '../data/types';
import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {getPersonneStringId} from 'ui/dropdownLists/PersonnesDropdown/utils';
import ServicesPilotesDropdown from 'ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import StructuresDropdown from 'ui/dropdownLists/StructuresDropdown/StructuresDropdown';
import PartenairesDropdown from 'ui/dropdownLists/PartenairesDropdown/PartenairesDropdown';
import CiblesDropdown from 'ui/dropdownLists/ficheAction/CiblesDropdown/CiblesDropdown';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

type ModaleActeursProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const ModaleActeurs = ({
  isOpen,
  setIsOpen,
  fiche,
  updateFiche,
}: ModaleActeursProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);

  const tracker = useEventTracker('app/fiche-action');
  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectivite_id || null;

  useEffect(() => {
    if (isOpen) setEditedFiche(fiche);
  }, [isOpen]);

  const handleSave = () => {
    if (!_.isEqual(fiche, editedFiche)) {
      updateFiche(editedFiche);
    }
  };

  return (
    <Modal
      openState={{isOpen, setIsOpen}}
      title="Acteurs du projet"
      size="lg"
      render={({descriptionId}) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {/* Personnes pilote */}
          <Field title="Personne pilote">
            <PersonnesDropdown
              dataTest="personnes-pilotes"
              values={editedFiche.pilotes?.map(p => getPersonneStringId(p))}
              placeholder="Sélectionnez ou créez un pilote"
              onChange={({personnes}) =>
                setEditedFiche(prevState => ({
                  ...prevState,
                  pilotes: personnes,
                }))
              }
            />
          </Field>

          {/* Directions ou services pilote */}
          <Field title="Direction ou service pilote">
            <ServicesPilotesDropdown
              placeholder="Sélectionnez ou créez un pilote"
              values={editedFiche.services?.map(s => s.id)}
              onChange={({services}) =>
                setEditedFiche(prevState => ({...prevState, services}))
              }
            />
          </Field>

          {/* Structures pilote */}
          <Field title="Structure pilote">
            <StructuresDropdown
              values={editedFiche.structures?.map(s => s.id)}
              onChange={({structures}) =>
                setEditedFiche(prevState => ({...prevState, structures}))
              }
            />
          </Field>

          {/* Élu·e référent·e */}
          <Field title="Élu·e référent·e">
            <PersonnesDropdown
              values={editedFiche.referents?.map(r => getPersonneStringId(r))}
              placeholder="Sélectionnez ou créez un·e élu·e référent·e"
              onChange={({personnes}) =>
                setEditedFiche(prevState => ({
                  ...prevState,
                  referents: personnes,
                }))
              }
            />
          </Field>

          {/* Partenaires */}
          <Field title="Partenaires">
            <PartenairesDropdown
              values={editedFiche.partenaires?.map(p => p.id)}
              onChange={({partenaires}) =>
                setEditedFiche(prevState => ({...prevState, partenaires}))
              }
            />
          </Field>

          {/* Cibles */}
          <Field title="Cibles">
            <CiblesDropdown
              values={editedFiche.cibles ?? []}
              onChange={({cibles}) =>
                setEditedFiche(prevState => ({...prevState, cibles}))
              }
            />
          </Field>
        </FormSectionGrid>
      )}
      // Boutons pour valider / annuler les modifications
      renderFooter={({close}) => (
        <ModalFooterOKCancel
          btnCancelProps={{onClick: close}}
          btnOKProps={{
            onClick: () => {
              collectiviteId &&
                tracker('validation_modale_acteurs_fa', {
                  collectivite_id: collectiviteId,
                });
              handleSave();
              close();
            },
          }}
        />
      )}
    />
  );
};

export default ModaleActeurs;
