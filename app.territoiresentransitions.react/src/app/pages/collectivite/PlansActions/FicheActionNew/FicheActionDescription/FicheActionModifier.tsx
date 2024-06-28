import {Button, Field, FormSectionGrid, Input, Modal} from '@tet/ui';
import {FicheAction} from '../../FicheAction/data/types';
import {useState} from 'react';
import ThematiquesDropdown from 'ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import SousThematiquesDropdown from 'ui/dropdownLists/SousThematiquesDropdown/SousThematiquesDropdown';
import {TSousThematiqueRow, TThematiqueRow} from 'types/alias';

const isInputChanged = (input: string | null, prevValue: string | null) => {
  const inputToSave = (input ?? '').trim();
  if (inputToSave !== prevValue) return true;
  return false;
};

const isSelectChanged = (selectedIds: number[], prevSelectedIds: number[]) => {
  if (selectedIds.join() !== prevSelectedIds.join()) return true;
  else return false;
};

/**
 * Bouton + modale pour l'édition des informations principales d'une fiche action
 */
type FicheActionModifierProps = {
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const FicheActionModifier = ({
  fiche,
  updateFiche,
}: FicheActionModifierProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);

  const handleSave = () => {
    if (
      isInputChanged(editedFiche.titre, fiche.titre) ||
      isInputChanged(editedFiche.description, fiche.description) ||
      isInputChanged(editedFiche.ressources, fiche.ressources) ||
      isSelectChanged(
        editedFiche.thematiques?.map(t => t.id) ?? [],
        fiche.thematiques?.map(t => t.id) ?? []
      ) ||
      isSelectChanged(
        editedFiche.sous_thematiques?.map(t => t.id) ?? [],
        fiche.sous_thematiques?.map(t => t.id) ?? []
      )
    ) {
      updateFiche(editedFiche);
    }
  };

  return (
    <Modal
      title="Modifier la fiche"
      size="lg"
      render={({descriptionId, close}) => (
        <div>
          <div id={descriptionId} className="flex flex-col gap-8">
            <FormSectionGrid>
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
              <Field title="Description de l'action :" className="col-span-2">
                <Input
                  type="text"
                  value={editedFiche.description ?? ''}
                  onChange={evt =>
                    setEditedFiche(prevState => ({
                      ...prevState,
                      description: evt.target.value,
                    }))
                  }
                />
              </Field>

              {/* Ressources */}
              <Field
                title="Moyens humains et techniques :"
                className="col-span-2"
              >
                <Input
                  type="text"
                  value={editedFiche.ressources ?? ''}
                  onChange={evt =>
                    setEditedFiche(prevState => ({
                      ...prevState,
                      ressources: evt.target.value,
                    }))
                  }
                />
              </Field>
            </FormSectionGrid>
          </div>

          {/* Boutons pour valider / annuler les modifications */}
          <div className="flex justify-end gap-4 mt-12">
            <Button onClick={close} aria-label="Annuler" variant="outlined">
              Annuler
            </Button>
            <Button
              onClick={() => {
                handleSave();
                close();
              }}
              aria-label="Valider"
            >
              Valider
            </Button>
          </div>
        </div>
      )}
    >
      <Button
        icon="edit-fill"
        title="Modifier la fiche"
        variant="outlined"
        size="xs"
        className="h-fit"
        onClick={() => setEditedFiche(fiche)}
      />
    </Modal>
  );
};

export default FicheActionModifier;
