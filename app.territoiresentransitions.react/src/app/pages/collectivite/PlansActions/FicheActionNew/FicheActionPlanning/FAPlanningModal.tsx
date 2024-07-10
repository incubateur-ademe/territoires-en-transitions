import {
  Button,
  Checkbox,
  Field,
  FormSectionGrid,
  Input,
  Modal,
  Select,
} from '@tet/ui';
import {FicheAction} from '../../FicheAction/data/types';
import {useState} from 'react';
import {
  ficheActionNiveauPrioriteOptions,
  ficheActionStatutOptions,
} from '../../FicheAction/data/options/listesStatiques';
import BadgeStatut from '../../components/BadgeStatut';
import {TFicheActionNiveauxPriorite, TFicheActionStatuts} from 'types/alias';
import BadgePriorite from '../../components/BadgePriorite';

const getFormattedDate = (date: string) => {
  const localDate = new Date(date);
  const year = localDate.getFullYear();
  const month = localDate.getMonth() + 1;
  const day = localDate.getDate();
  return `${year}-${month < 10 ? `0${month}` : month}-${
    day < 10 ? `0${day}` : day
  }`;
};

const isInputChanged = (input: string | null, prevValue: string | null) => {
  const inputToSave = (input ?? '').trim();
  if (inputToSave !== prevValue) return true;
  return false;
};

const isSelectChanged = (value: string | null, prevValue: string | null) => {
  if (value !== prevValue) return true;
  else return false;
};

type FAPlanningModalProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const FAPlanningModal = ({
  isOpen,
  setIsOpen,
  fiche,
  updateFiche,
}: FAPlanningModalProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);

  const handleSave = () => {
    if (
      isInputChanged(editedFiche.date_debut, fiche.date_debut) ||
      isInputChanged(
        editedFiche.date_fin_provisoire,
        fiche.date_fin_provisoire
      ) ||
      isInputChanged(editedFiche.calendrier, fiche.calendrier) ||
      isSelectChanged(editedFiche.statut, fiche.statut) ||
      isSelectChanged(editedFiche.niveau_priorite, fiche.niveau_priorite) ||
      editedFiche.amelioration_continue !== fiche.amelioration_continue
    ) {
      updateFiche(editedFiche);
    }
  };

  return (
    <Modal
      openState={{isOpen, setIsOpen}}
      title="Planning prévisionnel"
      size="md"
      render={({descriptionId, close}) => (
        <div>
          <div id={descriptionId} className="flex flex-col gap-8">
            <FormSectionGrid>
              {/* Date de début */}
              <Field title="Date de début" className="col-span-2">
                <Input
                  type="date"
                  value={getFormattedDate(editedFiche.date_debut ?? '')}
                  onChange={evt =>
                    setEditedFiche(prevState => ({
                      ...prevState,
                      date_debut: evt.target.value,
                    }))
                  }
                />
              </Field>

              <div className="col-span-2 mb-2">
                <Checkbox
                  label="L'action se répète tous les ans"
                  message="Sans date de fin prévisionnelle"
                  checked={editedFiche.amelioration_continue ?? false}
                  onChange={evt => {
                    const isChecked = evt.target.checked;
                    const dateFin = isChecked
                      ? null
                      : editedFiche.date_fin_provisoire;
                    setEditedFiche(prevState => ({
                      ...prevState,
                      amelioration_continue: isChecked,
                      date_fin_provisoire: dateFin,
                    }));
                  }}
                />
              </div>

              {/* Date de fin prévisionnelle */}
              <Field title="Date de fin prévisionnelle" className="col-span-2">
                <Input
                  type="date"
                  title={
                    editedFiche.amelioration_continue
                      ? "Ce champ ne peut pas être modifié si l'action se répète tous les ans"
                      : undefined
                  }
                  disabled={editedFiche.amelioration_continue ?? false}
                  value={getFormattedDate(
                    editedFiche.date_fin_provisoire ?? ''
                  )}
                  onChange={evt =>
                    setEditedFiche(prevState => ({
                      ...prevState,
                      date_fin_provisoire: evt.target.value,
                    }))
                  }
                />
              </Field>

              {/* Statut */}
              <Field title="Statut" className="max-md:col-span-2">
                <Select
                  options={ficheActionStatutOptions}
                  values={editedFiche.statut ?? []}
                  customItem={option => (
                    <BadgeStatut statut={option.label as TFicheActionStatuts} />
                  )}
                  onChange={value =>
                    setEditedFiche(prevState => ({
                      ...prevState,
                      statut: value as TFicheActionStatuts,
                    }))
                  }
                />
              </Field>

              {/* Niveau de priorité */}
              <Field title="Niveau de priorité" className="max-md:col-span-2">
                <Select
                  options={ficheActionNiveauPrioriteOptions}
                  values={editedFiche.niveau_priorite ?? []}
                  customItem={option => (
                    <BadgePriorite
                      priorite={option.label as TFicheActionNiveauxPriorite}
                    />
                  )}
                  onChange={value =>
                    setEditedFiche(prevState => ({
                      ...prevState,
                      niveau_priorite: value as TFicheActionNiveauxPriorite,
                    }))
                  }
                />
              </Field>

              {/* Justification du calendrier */}
              <Field
                title="Calendrier"
                hint="Si l’action est en pause ou abandonnée, expliquez pourquoi"
                className="col-span-2"
              >
                <Input
                  type="text"
                  value={editedFiche.calendrier ?? ''}
                  disabled={
                    editedFiche.statut !== 'En pause' &&
                    editedFiche.statut !== 'Abandonné'
                  }
                  onChange={evt =>
                    setEditedFiche(prevState => ({
                      ...prevState,
                      calendrier: evt.target.value,
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
    />
  );
};

export default FAPlanningModal;
