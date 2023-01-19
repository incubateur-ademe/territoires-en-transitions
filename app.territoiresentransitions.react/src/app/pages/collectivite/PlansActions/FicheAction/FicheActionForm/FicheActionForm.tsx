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

type TFicheActionForm = {
  fiche: FicheActionVueRow;
};

export const selectButtonClassNames = 'fr-select !flex !px-4 !bg-none';

const FicheActionForm = ({fiche}: TFicheActionForm) => {
  const {mutate: updateFiche} = useEditFicheAction();

  return (
    <div className="flex flex-col gap-6">
      <Section isDefaultOpen icon={<PictoInformation />} title="Présentation">
        <FormField
          label="Nom de la fiche"
          hint="Exemple : 1.3.2.5 Limiter les émissions liées au chauffage résidentiel au bois"
          htmlFor="title"
        >
          <TextareaControlled
            id="title"
            initialValue={fiche.titre ?? ''}
            onBlur={e => updateFiche({...fiche, titre: e.target.value})}
            placeholder="Écrire ici..."
            maxLength={300}
            className="outline-transparent resize-none"
          />
        </FormField>
        <FormField label="Description de l'action" htmlFor="description">
          <TextareaControlled
            id="description"
            initialValue={fiche.description ?? ''}
            onBlur={e => updateFiche({...fiche, description: e.target.value})}
            placeholder="Écrire ici..."
            maxLength={20000}
            className="outline-transparent resize-none"
          />
        </FormField>
        <FormField label="Thématique">
          <ThematiquesDropdown
            thematiques={fiche.thematiques}
            onSelect={thematiques => updateFiche({...fiche, thematiques})}
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
          />
        </FormField>
      </Section>

      <Section icon={<PictoDataViz />} title="Objectifs et indicateurs">
        <FormField label="Objectifs">
          <TextareaControlled
            initialValue={fiche.objectifs ?? ''}
            onBlur={e => updateFiche({...fiche, objectifs: e.target.value})}
            placeholder="Écrire ici..."
            maxLength={10000}
            className="outline-transparent resize-none"
          />
        </FormField>
        <FormField label="Indicateurs liés">
          <IndicateursDropdown
            indicateurs={fiche.indicateurs}
            onSelect={indicateurs => updateFiche({...fiche, indicateurs})}
          />
        </FormField>
        <FormField label="Résultats attendus">
          <MultiSelectDropdown
            buttonClassName={selectButtonClassNames}
            values={fiche.resultats_attendus ?? []}
            options={ficheActionResultatsAttendusOptions}
            onSelect={values =>
              updateFiche({...fiche, resultats_attendus: values})
            }
          />
        </FormField>
      </Section>

      <Section icon={<PictoCommunity />} title="Acteurs">
        <FormField label="Cibles">
          <MultiSelectTagsDropdown
            buttonClassName={selectButtonClassNames}
            values={fiche.cibles ?? []}
            options={ficheActionCiblesOptions}
            onSelect={values => updateFiche({...fiche, cibles: values})}
          />
        </FormField>
        <FormField label="Structure pilote">
          <StructurePiloteDropdown
            structures={fiche.structures}
            onSelect={structures => updateFiche({...fiche, structures})}
          />
        </FormField>
        <FormField
          label="Moyens humains et techniques"
          htmlFor="moyens-humains-tech"
        >
          <TextareaControlled
            id="moyens-humains-tech"
            initialValue={fiche.ressources ?? ''}
            onBlur={e => updateFiche({...fiche, ressources: e.target.value})}
            placeholder="Écrire ici..."
            maxLength={10000}
            className="outline-transparent resize-none"
          />
        </FormField>
        <FormField label="Partenaires">
          <PartenairesDropdown
            partenaires={fiche.partenaires}
            onSelect={partenaires => updateFiche({...fiche, partenaires})}
          />
        </FormField>
        <FormField label="Personne pilote">
          <PersonnePiloteDropdown
            personnes={fiche.pilotes}
            onSelect={pilotes => updateFiche({...fiche, pilotes})}
          />
        </FormField>
        <FormField label="Élu·e référent·e">
          <PersonneReferenteDropdown
            personnes={fiche.referents}
            onSelect={referents => updateFiche({...fiche, referents})}
          />
        </FormField>
      </Section>

      <Section icon={<PictoCalendar />} title="Modalités de mise en œuvre">
        <FormField label="Financements" htmlFor="financements">
          <TextareaControlled
            id="financements"
            initialValue={fiche.financements ?? ''}
            onBlur={e => updateFiche({...fiche, financements: e.target.value})}
            placeholder="Écrire ici..."
            className="outline-transparent resize-none"
          />
        </FormField>
        <FormField
          label="Budget prévisionnel total "
          htmlFor="budget-previsionnel"
        >
          <FicheActionFormBudgetInput
            budget={fiche.budget_previsionnel}
            onBlur={e => {
              updateFiche({
                ...fiche,
                budget_previsionnel: parseInt(e.target.value),
              });
            }}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Statut">
            <SelectDropdown
              buttonClassName={selectButtonClassNames}
              value={fiche.statut ?? undefined}
              options={ficheActionStatutOptions}
              onSelect={value => updateFiche({...fiche, statut: value})}
              placeholderText="Sélectionnez une option"
              renderSelection={v => <FicheActionBadgeStatut statut={v} />}
              renderOption={option => (
                <FicheActionBadgeStatut statut={option} />
              )}
            />
          </FormField>
          <FormField label="Niveau de priorité">
            <SelectDropdown
              buttonClassName={selectButtonClassNames}
              value={fiche.niveau_priorite ?? undefined}
              options={ficheActionNiveauPrioriteOptions}
              onSelect={value =>
                updateFiche({...fiche, niveau_priorite: value})
              }
              placeholderText="Sélectionnez une option"
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
            />
          </FormField>
          <FormField label="Date de fin prévisionnelle">
            <FicheActionFormDateInput
              initialValue={fiche.date_fin_provisoire}
              disabled={fiche.amelioration_continue ?? false}
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
            onBlur={e => updateFiche({...fiche, calendrier: e.target.value})}
            placeholder="Écrire ici..."
            className="outline-transparent resize-none"
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
              updateFiche({...fiche, notes_complementaires: e.target.value})
            }
            placeholder="Écrire ici..."
            maxLength={20000}
            className="outline-transparent resize-none"
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
