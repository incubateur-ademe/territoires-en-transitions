import {useState} from 'react';
import _ from 'lodash';
import {
  Button,
  Field,
  FormSectionGrid,
  Input,
  Modal,
  ModalFooterOKCancel,
  Textarea,
} from '@tet/ui';
import {TSousThematiqueRow, TThematiqueRow} from 'types/alias';
import {FicheAction} from '../data/types';
import ThematiquesDropdown from 'ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import SousThematiquesDropdown from 'ui/dropdownLists/SousThematiquesDropdown/SousThematiquesDropdown';

/**
 * Bouton + modale pour l'édition des informations principales d'une fiche action
 */
type ModaleDescriptionProps = {
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const ModaleDescription = ({fiche, updateFiche}: ModaleDescriptionProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);

  const handleSave = () => {
    if (!_.isEqual(fiche, editedFiche)) {
      updateFiche(editedFiche);
    }
  };

  return (
    <Modal
      title="Modifier la fiche"
      size="lg"
      render={({descriptionId}) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {/* Nom de la fiche action */}
          <Field title="Nom de la fiche action" className="col-span-2">
            <Input
              type="text"
              value={editedFiche.titre ?? ''}
              onChange={evt =>
                setEditedFiche(prevState => ({
                  ...prevState,
                  titre: evt.target.value,
                }))
              }
            />
          </Field>

          {/* Dropdown thématiques */}
          <Field title="Thématique" className="col-span-2">
            <ThematiquesDropdown
              values={editedFiche.thematiques?.map(t => t.id)}
              onChange={({thematiques}) =>
                setEditedFiche(prevState => ({
                  ...prevState,
                  thematiques: thematiques,
                }))
              }
            />
          </Field>

          {/* Dropdown sous-thématiques */}
          <Field title="Sous-thématique" className="col-span-2">
            <SousThematiquesDropdown
              thematiques={(editedFiche.thematiques ?? []).map(
                (t: TThematiqueRow) => t.id
              )}
              sousThematiques={
                editedFiche.sous_thematiques as TSousThematiqueRow[]
              }
              onChange={({sousThematiques}) =>
                setEditedFiche(prevState => ({
                  ...prevState,
                  sous_thematiques: sousThematiques,
                }))
              }
            />
          </Field>

          {/* Description */}
          <Field title="Description de l'action" className="col-span-2">
            <Textarea
              className="min-h-[100px]"
              value={editedFiche.description ?? ''}
              onChange={evt =>
                setEditedFiche(prevState => ({
                  ...prevState,
                  description: (evt.target as HTMLTextAreaElement).value,
                }))
              }
            />
          </Field>

          {/* Ressources */}
          <Field title="Moyens humains et techniques" className="col-span-2">
            <Textarea
              className="min-h-[100px]"
              value={editedFiche.ressources ?? ''}
              onChange={evt =>
                setEditedFiche(prevState => ({
                  ...prevState,
                  ressources: (evt.target as HTMLTextAreaElement).value,
                }))
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
              handleSave();
              close();
            },
          }}
        />
      )}
    >
      {/* Bouton d'ouverture de la modale */}
      <Button
        icon="edit-fill"
        title="Modifier les informations"
        variant="white"
        size="xs"
        className="h-fit"
        onClick={() => setEditedFiche(fiche)}
      />
    </Modal>
  );
};

export default ModaleDescription;
