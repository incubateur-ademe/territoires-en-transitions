import PictoCalendar from 'ui/pictogrammes/PictoCalendar';
import PictoCommunity from 'ui/pictogrammes/PictoCommunity';
import PictoDataViz from 'ui/pictogrammes/PictoDataViz';
import PictoDocument from 'ui/pictogrammes/PictoDocument';
import PictoInformation from 'ui/pictogrammes/PictoInformation';
import Checkbox from 'ui/shared/form/Checkbox';
import FormField from 'ui/shared/form/FormField';
import TextareaControlled from 'ui/shared/form/TextareaControlled';
import MultiSelectDropdown from 'ui/shared/select/MultiSelectDropdown';
import MultiSelectTagsDropdown from 'ui/shared/select/MultiSelectTagsDropdown';
import SelectDropdown from 'ui/shared/select/SelectDropdown';
import {
  ficheActionCiblesOptions,
  ficheActionNiveauPrioriteOptions,
  ficheActionResultatsAttendusOptions,
  ficheActionStatutOptions,
} from '../data/options/listesStatiques';
import {FicheActionVueRow} from '../data/types/ficheActionVue';
import {useEditFicheAction} from '../data/useUpsertFicheAction';
import FicheActionBadgeStatut from './FicheActionBadgeStatut';
import FicheActionFormBudgetInput from './FicheActionFormBudgetInput';
import FicheActionFormDateInput from './FicheActionFormDateInput';
import Section from './Section';
import StructurePiloteDropdown from './StructurePiloteDropdown';
import PartenairesDropdown from './PartenairesDropdown';
import PersonnePiloteDropdown from './PersonnePiloteDropdown';
import PersonneReferenteDropdown from './PersonneReferenteDropdown';
import IndicateursDropdown from './IndicateursDropdown';
import ThematiquesDropdown from './ThematiquesDropdown';
import SousThematiquesDropdown from './SousThematiquesDropdown';
import {TSousThematiqueRow, TThematiqueRow} from '../data/types/alias';
import {DSFRbuttonClassname} from 'ui/shared/select/commons';
import FicheActionRangerModal from '../FicheActionRangerModal/FicheActionRangerModal';
import {usePlanActionProfondeur} from '../../PlanAction/data/usePlanActionProfondeur';
import ServicePiloteDropdown from './ServicePiloteDropdown';

type TFicheActionForm = {
  fiche: FicheActionVueRow;
  isReadonly: boolean;
};

const FicheActionForm = ({fiche, isReadonly}: TFicheActionForm) => {
  const {mutate: updateFiche} = useEditFicheAction();

  const plansProfondeur = usePlanActionProfondeur();

  return (
    <div className="flex flex-col gap-6">
      <Section isDefaultOpen icon={<PictoInformation />} title="Présentation">
        {!isReadonly &&
          plansProfondeur?.plans &&
          plansProfondeur.plans.length > 0 && (
            <FicheActionRangerModal fiche={fiche} />
          )}
        <FormField
          label="Nom de la fiche"
          hint="Exemple : 1.3.2.5 Limiter les émissions liées au chauffage résidentiel au bois"
          htmlFor="title"
        >
          <TextareaControlled
            id="title"
            initialValue={fiche.titre ?? ''}
            onBlur={e => {
              if (fiche.titre) {
                e.target.value !== fiche.titre &&
                  updateFiche({...fiche, titre: e.target.value.trim()});
              } else {
                e.target.value.trim().length > 0 &&
                  updateFiche({...fiche, titre: e.target.value.trim()});
              }
            }}
            placeholder="Écrire ici..."
            maxLength={300}
            className="outline-transparent resize-none"
            disabled={isReadonly}
          />
        </FormField>
        <FormField label="Description de l'action" htmlFor="description">
          <TextareaControlled
            id="description"
            initialValue={fiche.description ?? ''}
            onBlur={e => {
              e.target.value.trim().length > 0 &&
                e.target.value.trim() !== fiche.description &&
                updateFiche({...fiche, description: e.target.value.trim()});
            }}
            placeholder="Écrire ici..."
            maxLength={20000}
            className="outline-transparent resize-none"
            disabled={isReadonly}
          />
        </FormField>
        <FormField label="Thématique">
          <ThematiquesDropdown
            thematiques={fiche.thematiques}
            onSelect={thematiques => updateFiche({...fiche, thematiques})}
            isReadonly={isReadonly}
          />
        </FormField>
        <FormField label="Sous-thématique">
          <SousThematiquesDropdown
            thematiques={
              fiche.thematiques
                ? fiche.thematiques.map((t: TThematiqueRow) => t.thematique)
                : []
            }
            sousThematiques={fiche.sous_thematiques as TSousThematiqueRow[]}
            onSelect={sous_thematiques =>
              updateFiche({...fiche, sous_thematiques})
            }
            isReadonly={isReadonly}
          />
        </FormField>
      </Section>

      <Section icon={<PictoDataViz />} title="Objectifs et indicateurs">
        <FormField label="Objectifs">
          <TextareaControlled
            initialValue={fiche.objectifs ?? ''}
            onBlur={e => {
              e.target.value.trim().length > 0 &&
                e.target.value.trim() !== fiche.objectifs &&
                updateFiche({...fiche, objectifs: e.target.value.trim()});
            }}
            placeholder="Écrire ici..."
            maxLength={10000}
            className="outline-transparent resize-none"
            disabled={isReadonly}
          />
        </FormField>
        <FormField label="Indicateurs liés">
          <IndicateursDropdown
            indicateurs={fiche.indicateurs}
            onSelect={indicateurs => updateFiche({...fiche, indicateurs})}
            isReadonly={isReadonly}
          />
        </FormField>
        <FormField label="Résultats attendus">
          <MultiSelectDropdown
            buttonClassName={DSFRbuttonClassname}
            values={fiche.resultats_attendus ?? []}
            options={ficheActionResultatsAttendusOptions}
            onSelect={values =>
              updateFiche({...fiche, resultats_attendus: values})
            }
            disabled={isReadonly}
          />
        </FormField>
      </Section>

      <Section icon={<PictoCommunity />} title="Acteurs">
        <FormField label="Cibles">
          <MultiSelectTagsDropdown
            buttonClassName={DSFRbuttonClassname}
            values={fiche.cibles ?? []}
            options={ficheActionCiblesOptions}
            onSelect={values => updateFiche({...fiche, cibles: values})}
            disabled={isReadonly}
          />
        </FormField>
        <FormField label="Structure pilote">
          <StructurePiloteDropdown
            structures={fiche.structures}
            onSelect={structures => updateFiche({...fiche, structures})}
            isReadonly={isReadonly}
          />
        </FormField>
        <FormField
          label="Moyens humains et techniques"
          htmlFor="moyens-humains-tech"
        >
          <TextareaControlled
            id="moyens-humains-tech"
            initialValue={fiche.ressources ?? ''}
            onBlur={e => {
              e.target.value.trim().length > 0 &&
                e.target.value.trim() !== fiche.ressources &&
                updateFiche({...fiche, ressources: e.target.value.trim()});
            }}
            placeholder="Écrire ici..."
            maxLength={10000}
            className="outline-transparent resize-none"
            disabled={isReadonly}
          />
        </FormField>
        <FormField label="Partenaires">
          <PartenairesDropdown
            partenaires={fiche.partenaires}
            onSelect={partenaires => updateFiche({...fiche, partenaires})}
            isReadonly={isReadonly}
          />
        </FormField>
        <FormField label="Personne pilote">
          <PersonnePiloteDropdown
            personnes={fiche.pilotes}
            onSelect={pilotes => updateFiche({...fiche, pilotes})}
            isReadonly={isReadonly}
          />
        </FormField>
        <FormField label="Direction ou service pilote">
          <ServicePiloteDropdown
            services={fiche.services}
            onSelect={services => updateFiche({...fiche, services})}
            isReadonly={isReadonly}
          />
        </FormField>
        <FormField label="Élu·e référent·e">
          <PersonneReferenteDropdown
            personnes={fiche.referents}
            onSelect={referents => updateFiche({...fiche, referents})}
            isReadonly={isReadonly}
          />
        </FormField>
      </Section>

      <Section icon={<PictoCalendar />} title="Modalités de mise en œuvre">
        <FormField label="Financements" htmlFor="financements">
          <TextareaControlled
            id="financements"
            initialValue={fiche.financements ?? ''}
            onBlur={e =>
              e.target.value.trim().length > 0 &&
              e.target.value.trim() !== fiche.financements &&
              updateFiche({...fiche, financements: e.target.value.trim()})
            }
            placeholder="Écrire ici..."
            className="outline-transparent resize-none"
            disabled={isReadonly}
          />
        </FormField>
        <FormField
          label="Budget prévisionnel total "
          htmlFor="budget-previsionnel"
        >
          <FicheActionFormBudgetInput
            budget={fiche.budget_previsionnel}
            onBlur={e => {
              e.target.value.trim().length > 0 &&
                parseInt(e.target.value) !== fiche.budget_previsionnel &&
                updateFiche({
                  ...fiche,
                  budget_previsionnel: parseInt(e.target.value),
                });
            }}
            disabled={isReadonly}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Statut">
            <SelectDropdown
              buttonClassName={DSFRbuttonClassname}
              value={fiche.statut ?? undefined}
              options={ficheActionStatutOptions}
              onSelect={value => updateFiche({...fiche, statut: value})}
              placeholderText="Sélectionnez une option"
              renderSelection={v => <FicheActionBadgeStatut statut={v} />}
              renderOption={option => (
                <FicheActionBadgeStatut statut={option} />
              )}
              disabled={isReadonly}
            />
          </FormField>
          <FormField label="Niveau de priorité">
            <SelectDropdown
              buttonClassName={DSFRbuttonClassname}
              value={fiche.niveau_priorite ?? undefined}
              options={ficheActionNiveauPrioriteOptions}
              onSelect={value =>
                updateFiche({...fiche, niveau_priorite: value})
              }
              placeholderText="Sélectionnez une option"
              disabled={isReadonly}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date de début">
            <FicheActionFormDateInput
              initialValue={fiche.date_debut}
              onBlur={e =>
                updateFiche({
                  ...fiche,
                  date_debut:
                    e.target.value.length !== 0 ? e.target.value : null,
                })
              }
              disabled={isReadonly}
            />
          </FormField>
          <FormField label="Date de fin prévisionnelle">
            <FicheActionFormDateInput
              initialValue={fiche.date_fin_provisoire}
              disabled={(fiche.amelioration_continue || isReadonly) ?? false}
              onBlur={e =>
                updateFiche({
                  ...fiche,
                  date_fin_provisoire:
                    e.target.value.length !== 0 ? e.target.value : null,
                })
              }
            />
            <Checkbox
              label="Action en amélioration continue, sans date de fin"
              onCheck={() => {
                updateFiche({
                  ...fiche,
                  amelioration_continue: !fiche.amelioration_continue,
                  date_fin_provisoire: null,
                });
              }}
              checked={fiche.amelioration_continue ?? false}
              disabled={isReadonly}
            />
          </FormField>
        </div>
        <FormField
          label="Calendrier"
          htmlFor="calendrier"
          hint="Si l’action est en pause ou abandonnée, expliquez pourquoi"
          className="mt-6"
        >
          <TextareaControlled
            id="calendrier"
            initialValue={fiche.calendrier ?? ''}
            onBlur={e =>
              e.target.value.trim().length > 0 &&
              e.target.value.trim() !== fiche.calendrier &&
              updateFiche({...fiche, calendrier: e.target.value.trim()})
            }
            placeholder="Écrire ici..."
            className="outline-transparent resize-none"
            disabled={isReadonly}
          />
        </FormField>
      </Section>
      {/* <Section icon={<PictoLeaf />} title="Actions et fiches liées">
        Hello
      </Section> */}
      <Section icon={<PictoDocument />} title="Notes">
        <FormField
          label="Notes complémentaires"
          hint="Évaluation ou autres informations sur l’action "
          htmlFor="notes-complementaires"
        >
          <TextareaControlled
            id="notes-complementaires"
            initialValue={fiche.notes_complementaires ?? ''}
            onBlur={e =>
              e.target.value.trim().length > 0 &&
              e.target.value.trim() !== fiche.notes_complementaires &&
              updateFiche({
                ...fiche,
                notes_complementaires: e.target.value.trim(),
              })
            }
            placeholder="Écrire ici..."
            maxLength={20000}
            className="outline-transparent resize-none"
            disabled={isReadonly}
          />
        </FormField>
      </Section>
      {/* <Section icon={<PictoBook />} title="Documents et liens">
        Hello
      </Section> */}
      {/* <Checkbox
        label="Mise à jour de la fiche terminée"
        onCheck={() =>
          updateFiche({
            ...fiche,
            maj_termine: !fiche.maj_termine,
          })
        }
        checked={fiche.maj_termine ?? false}
      /> */}
    </div>
  );
};

export default FicheActionForm;
