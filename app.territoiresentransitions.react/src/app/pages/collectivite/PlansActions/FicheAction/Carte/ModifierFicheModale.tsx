import {useState} from 'react';
import {QueryKey} from 'react-query';

import {
  Checkbox,
  Field,
  FormSectionGrid,
  Input,
  Modal,
  ModalFooterOKCancel,
  Select,
} from '@tet/ui';

import BadgeStatut from '../../components/BadgeStatut';
import {FicheResume} from '../data/types';
import {
  ficheActionNiveauPrioriteOptions,
  ficheActionStatutOptions,
} from '../data/options/listesStatiques';
import {TFicheActionNiveauxPriorite, TFicheActionStatuts} from 'types/alias';
import BadgePriorite from '../../components/BadgePriorite';
import {useUpdateFicheResume} from 'app/pages/collectivite/PlansActions/FicheAction/data/useUpdateFicheResume';
import {format} from 'date-fns';
import {
  useFicheActionAddPilote,
  useFicheActionRemoveTagPilote,
  useFicheActionRemoveUserPilote,
} from 'app/pages/collectivite/PlansActions/FicheAction/data/useFicheActionPilote';
import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {getPersonneStringId} from 'ui/dropdownLists/PersonnesDropdown/utils';

type Props = {
  initialFiche: FicheResume;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  axeId?: number;
  keysToInvalidate?: QueryKey[];
};

/**
 * Modale pour modifier une fiche action.
 */
const ModifierFicheModale = ({
  initialFiche,
  axeId,
  isOpen,
  setIsOpen,
  keysToInvalidate,
}: Props) => {
  const {mutate: updateFiche} = useUpdateFicheResume(keysToInvalidate);

  const {mutate: addPilotes} = useFicheActionAddPilote(keysToInvalidate);
  const {mutate: removeUserPilotes} =
    useFicheActionRemoveUserPilote(keysToInvalidate);
  const {mutate: removeTagPilotes} =
    useFicheActionRemoveTagPilote(keysToInvalidate);

  const [fiche, setFiche] = useState(initialFiche);

  return (
    <Modal
      dataTest="ModifierFicheModale"
      size="lg"
      openState={{
        isOpen,
        setIsOpen,
      }}
      onClose={() => setFiche(initialFiche)}
      title="Modifier la fiche action"
      render={({close}) => {
        return (
          <div className="flex flex-col gap-6">
            <Field title="Nom de la fiche action">
              <Input
                data-test="FicheNomInput"
                type="text"
                value={fiche.titre ?? undefined}
                onChange={e => setFiche({...fiche, titre: e.target.value})}
                placeholder="Sans titre"
                autoFocus
              />
            </Field>
            <FormSectionGrid>
              <Field title="Statut">
                <Select
                  data-test="Statut"
                  values={fiche.statut ?? undefined}
                  options={ficheActionStatutOptions}
                  onChange={statut =>
                    setFiche({
                      ...fiche,
                      statut: (statut as TFicheActionStatuts) ?? null,
                    })
                  }
                  customItem={item => (
                    <BadgeStatut statut={item.value as TFicheActionStatuts} />
                  )}
                />
              </Field>
              <Field title="Niveau de priorité">
                <Select
                  values={fiche.niveau_priorite ?? undefined}
                  options={ficheActionNiveauPrioriteOptions}
                  onChange={priorite =>
                    setFiche({
                      ...fiche,
                      niveau_priorite:
                        (priorite as TFicheActionNiveauxPriorite) ?? null,
                    })
                  }
                  customItem={item => (
                    <BadgePriorite
                      priorite={item.value as TFicheActionNiveauxPriorite}
                    />
                  )}
                />
              </Field>
            </FormSectionGrid>
            <FormSectionGrid>
              <Field title="Personne pilote">
                <PersonnesDropdown
                  values={fiche.pilotes?.map(p => getPersonneStringId(p))}
                  onChange={({personnes}) => {
                    setFiche({...fiche, pilotes: personnes});
                  }}
                />
              </Field>
              <Field title="Date de fin prévisionnelle">
                <Input
                  type="date"
                  value={
                    fiche.date_fin_provisoire
                      ? format(
                          new Date(fiche.date_fin_provisoire),
                          'yyyy-MM-dd'
                        )
                      : ''
                  }
                  onChange={e =>
                    setFiche({
                      ...fiche,
                      date_fin_provisoire:
                        e.target.value.length !== 0 ? e.target.value : null,
                    })
                  }
                  disabled={fiche.amelioration_continue ?? false}
                />
                <div className="mt-2">
                  <Checkbox
                    label="Action en amélioration continue"
                    message="Sans date de fin"
                    onChange={() => {
                      setFiche({
                        ...fiche,
                        amelioration_continue: !fiche.amelioration_continue,
                        date_fin_provisoire: null,
                      });
                    }}
                    checked={!!fiche.amelioration_continue}
                  />
                </div>
              </Field>
            </FormSectionGrid>
            <ModalFooterOKCancel
              btnOKProps={{
                onClick: () => {
                  const pilotesToAdd =
                    fiche.pilotes
                      ?.filter(
                        finalPilote =>
                          !initialFiche.pilotes?.some(
                            oldPilote => finalPilote.nom === oldPilote.nom
                          )
                      )
                      .map(pilote => ({
                        fiche_id: fiche.id!,
                        user_id: pilote.user_id,
                        tag_id: pilote.tag_id,
                      })) ?? [];

                  if (pilotesToAdd.length > 0) {
                    addPilotes(pilotesToAdd);
                  }

                  const pilotesToRemove =
                    initialFiche.pilotes
                      ?.filter(
                        oldPilote =>
                          !fiche.pilotes?.some(
                            finalPilote => finalPilote.nom === oldPilote.nom
                          )
                      )
                      .map(pilote => ({
                        fiche_id: fiche.id!,
                        user_id: pilote.user_id,
                        tag_id: pilote.tag_id,
                      })) ?? [];
                  if (pilotesToRemove.length > 0) {
                    const pilotesTag = pilotesToRemove.filter(
                      pilote => pilote.tag_id
                    );
                    if (pilotesTag.length > 0) {
                      removeTagPilotes(pilotesTag);
                    }
                    const pilotesUser = pilotesToRemove.filter(
                      pilote => pilote.user_id
                    );
                    removeUserPilotes(pilotesUser);
                  }
                  updateFiche(fiche);
                  close();
                },
              }}
              btnCancelProps={{onClick: close}}
            />
          </div>
        );
      }}
    />
  );
};

export default ModifierFicheModale;
