import {useState} from 'react';
import _ from 'lodash';
import {
  Button,
  Checkbox,
  Field,
  FormSectionGrid,
  Input,
  Modal,
  Select,
  Textarea,
} from '@tet/ui';
import {TFicheActionNiveauxPriorite, TFicheActionStatuts} from 'types/alias';
import {FicheAction} from '../../FicheAction/data/types';
import {
  ficheActionNiveauPrioriteOptions,
  ficheActionStatutOptions,
} from 'ui/dropdownLists/listesStatiques';
import BadgeStatut from '../../components/BadgeStatut';
import BadgePriorite from '../../components/BadgePriorite';
import {getIsoFormattedDate} from '../utils';

type ModalePlanningProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const ModalePlanning = ({
  isOpen,
  setIsOpen,
  fiche,
  updateFiche,
}: ModalePlanningProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);

  const handleSave = () => {
    if (!_.isEqual(fiche, editedFiche)) {
      updateFiche(editedFiche);
    }
  };

  return (
    <Modal
      openState={{isOpen, setIsOpen}}
      title="Planning prévisionnel"
      size="lg"
      render={({descriptionId, close}) => (
        <div>
          <div id={descriptionId} className="flex flex-col gap-8">
            <FormSectionGrid>
              {/* Date de début */}
              <Field title="Date de début" className="col-span-2">
                <Input
                  type="date"
                  value={
                    editedFiche.date_debut
                      ? getIsoFormattedDate(editedFiche.date_debut)
                      : ''
                  }
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
                  value={
                    editedFiche.date_fin_provisoire
                      ? getIsoFormattedDate(editedFiche.date_fin_provisoire)
                      : ''
                  }
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
                <Textarea
                  className="min-h-[50px]"
                  value={editedFiche.calendrier ?? ''}
                  disabled={
                    editedFiche.statut !== 'En pause' &&
                    editedFiche.statut !== 'Abandonné'
                  }
                  onChange={evt =>
                    setEditedFiche(prevState => ({
                      ...prevState,
                      calendrier: (evt.target as HTMLTextAreaElement).value,
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

export default ModalePlanning;
