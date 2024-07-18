import PictoCalendar from 'ui/pictogrammes/PictoCalendar';
import PictoCommunity from 'ui/pictogrammes/PictoCommunity';
import PictoDataViz from 'ui/pictogrammes/PictoDataViz';
import PictoDocument from 'ui/pictogrammes/PictoDocument';
import PictoInformation from 'ui/pictogrammes/PictoInformation';
import Checkbox from 'ui/shared/form/Checkbox';
import TextareaControlled from 'ui/shared/form/TextareaControlled';
import MultiSelectTagsDropdown from 'ui/shared/select/MultiSelectTagsDropdown';
import SelectDropdown from 'ui/shared/select/SelectDropdown';
import {
  ficheActionCiblesOptions,
  ficheActionNiveauPrioriteOptions,
  ficheActionResultatsAttendusOptions,
  ficheActionStatutOptions,
} from '../../../../../../ui/dropdownLists/listesStatiques';
import {FicheAction} from '../data/types';
import {useEditFicheAction} from '../data/useUpsertFicheAction';
import BadgeStatut from '../../components/BadgeStatut';
import FicheActionFormBudgetInput from './FicheActionFormBudgetInput';
import FicheActionFormDateInput from './FicheActionFormDateInput';
import Section from './Section';
import StructurePiloteDropdown from './StructurePiloteDropdown';
import PartenairesDropdown from './PartenairesDropdown';
import SousThematiquesDropdown from './SousThematiquesDropdown';
import {
  TFicheActionNiveauxPriorite,
  TFicheActionStatuts,
  TSousThematiqueRow,
  TThematiqueRow,
} from 'types/alias';
import {DSFRbuttonClassname} from 'ui/shared/select/commons';
import ServicePiloteDropdown from './ServicePiloteDropdown';
import Financeurs from './Financeurs';
import PictoLeaf from 'ui/pictogrammes/PictoLeaf';
import ActionsLiees from './ActionsLiees';
import PictoBook from 'ui/pictogrammes/PictoBook';
import {AddAnnexeButton} from './AddAnnexeButton';
import PreuveDoc from 'ui/shared/preuves/Bibliotheque/PreuveDoc';
import {useAnnexesFicheAction} from '../data/useAnnexesFicheAction';
import {TPreuve} from 'ui/shared/preuves/Bibliotheque/types';
import FichesLiees from './FichesLiees';
import IndicateursLies from './indicateurs/IndicateursLies';
import BadgePriorite from '../../components/BadgePriorite';
import {Field} from '@tet/ui';
import ThematiquesDropdown from 'ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {getPersonneStringId} from 'ui/dropdownLists/PersonnesDropdown/utils';

type TFicheActionForm = {
  fiche: FicheAction;
  isReadonly: boolean;
};

const FicheActionForm = ({fiche, isReadonly}: TFicheActionForm) => {
  const {mutate: updateFiche} = useEditFicheAction();
  const {data: annexes} = useAnnexesFicheAction(fiche.id);

  return (
    <div className="flex flex-col gap-6">
      <Section
        dataTest="section-presentation"
        icon={<PictoInformation />}
        title="Présentation"
        childrenContainerClassName="gap-6"
      >
        <Field title="Description de l'action" htmlFor="description">
          <TextareaControlled
            id="description"
            initialValue={fiche.description ?? ''}
            onBlur={e => {
              if (fiche.description) {
                e.target.value !== fiche.description &&
                  updateFiche({...fiche, description: e.target.value.trim()});
              } else {
                e.target.value.trim().length > 0 &&
                  updateFiche({...fiche, description: e.target.value.trim()});
              }
            }}
            placeholder="Écrire ici..."
            maxLength={20000}
            className="outline-transparent resize-none"
            disabled={isReadonly}
          />
        </Field>
        <Field title="Thématique">
          <ThematiquesDropdown
            values={fiche.thematiques?.map(t => t.id)}
            onChange={({thematiques}) => updateFiche({...fiche, thematiques})}
            disabled={isReadonly}
          />
        </Field>
        <Field title="Sous-thématique">
          <SousThematiquesDropdown
            thematiques={
              fiche.thematiques
                ? fiche.thematiques.map((t: TThematiqueRow) => t.id)
                : []
            }
            sousThematiques={fiche.sous_thematiques as TSousThematiqueRow[]}
            onSelect={sous_thematiques =>
              updateFiche({...fiche, sous_thematiques})
            }
            isReadonly={isReadonly}
          />
        </Field>
      </Section>

      <Section icon={<PictoDataViz />} title="Objectifs et indicateurs">
        <Field title="Objectifs" className="mb-6">
          <TextareaControlled
            initialValue={fiche.objectifs ?? ''}
            onBlur={e => {
              if (fiche.objectifs) {
                e.target.value !== fiche.objectifs &&
                  updateFiche({...fiche, objectifs: e.target.value.trim()});
              } else {
                e.target.value.trim().length > 0 &&
                  updateFiche({...fiche, objectifs: e.target.value.trim()});
              }
            }}
            placeholder="Écrire ici..."
            maxLength={10000}
            className="outline-transparent resize-none"
            disabled={isReadonly}
          />
        </Field>
        <IndicateursLies
          fiche={fiche}
          indicateurs={fiche.indicateurs}
          onSelect={indicateurs => updateFiche({...fiche, indicateurs})}
          isReadonly={isReadonly}
        />
        <Field title="Effets attendus">
          <MultiSelectTagsDropdown
            buttonClassName={DSFRbuttonClassname}
            values={fiche.resultats_attendus ?? []}
            options={ficheActionResultatsAttendusOptions}
            onSelect={values =>
              updateFiche({...fiche, resultats_attendus: values})
            }
            disabled={isReadonly}
          />
        </Field>
      </Section>

      <Section
        icon={<PictoCommunity />}
        title="Acteurs"
        dataTest="section-acteurs"
        childrenContainerClassName="gap-6"
      >
        <Field title="Structure pilote">
          <StructurePiloteDropdown
            structures={fiche.structures}
            onSelect={structures => updateFiche({...fiche, structures})}
            isReadonly={isReadonly}
          />
        </Field>
        <Field title="Personne pilote">
          <PersonnesDropdown
            dataTest="personnes-pilotes"
            values={fiche.pilotes?.map(p => getPersonneStringId(p))}
            onChange={({personnes}) =>
              updateFiche({...fiche, pilotes: personnes})
            }
            disabled={isReadonly}
          />
        </Field>
        <Field
          title="Moyens humains et techniques"
          htmlFor="moyens-humains-tech"
        >
          <TextareaControlled
            id="moyens-humains-tech"
            initialValue={fiche.ressources ?? ''}
            onBlur={e => {
              if (fiche.ressources) {
                e.target.value !== fiche.ressources &&
                  updateFiche({...fiche, ressources: e.target.value.trim()});
              } else {
                e.target.value.trim().length > 0 &&
                  updateFiche({...fiche, ressources: e.target.value.trim()});
              }
            }}
            placeholder="Écrire ici..."
            maxLength={10000}
            className="outline-transparent resize-none"
            disabled={isReadonly}
          />
        </Field>
        <div className="border-t border-gray-300" />
        <Field title="Élu·e référent·e">
          <PersonnesDropdown
            values={fiche.referents?.map(p => getPersonneStringId(p))}
            onChange={({personnes}) =>
              updateFiche({...fiche, referents: personnes})
            }
            disabled={isReadonly}
          />
        </Field>
        <Field title="Direction ou service pilote">
          <ServicePiloteDropdown
            services={fiche.services}
            onSelect={services => updateFiche({...fiche, services})}
            isReadonly={isReadonly}
          />
        </Field>
        <div className="border-t border-gray-300" />
        <Field title="Partenaires">
          <PartenairesDropdown
            partenaires={fiche.partenaires}
            onSelect={partenaires => updateFiche({...fiche, partenaires})}
            isReadonly={isReadonly}
          />
        </Field>
        <div className="border-t border-gray-300" />
        <Field title="Cibles">
          <MultiSelectTagsDropdown
            buttonClassName={DSFRbuttonClassname}
            values={fiche.cibles ?? []}
            options={ficheActionCiblesOptions}
            onSelect={values => updateFiche({...fiche, cibles: values})}
            disabled={isReadonly}
          />
        </Field>
      </Section>

      <Section
        dataTest="section-modalites"
        icon={<PictoCalendar />}
        title="Modalités de mise en œuvre"
        childrenContainerClassName="gap-6"
      >
        <Field
          title="Financements"
          htmlFor="financements"
          hint="Coûts unitaires, fonctionnement, investissement, recettes attendues, subventions …"
        >
          <TextareaControlled
            id="financements"
            initialValue={fiche.financements ?? ''}
            onBlur={e => {
              if (fiche.financements) {
                e.target.value !== fiche.financements &&
                  updateFiche({...fiche, financements: e.target.value.trim()});
              } else {
                e.target.value.trim().length > 0 &&
                  updateFiche({...fiche, financements: e.target.value.trim()});
              }
            }}
            placeholder="Écrire ici..."
            className="outline-transparent resize-none"
            disabled={isReadonly}
          />
        </Field>
        <div className="border-t border-gray-300" />
        <Field title="Budget prévisionnel total " htmlFor="budget-previsionnel">
          <FicheActionFormBudgetInput
            budget={fiche.budget_previsionnel}
            onBlur={e => {
              if (fiche.budget_previsionnel) {
                parseInt(e.target.value) !== fiche.budget_previsionnel &&
                  updateFiche({
                    ...fiche,
                    budget_previsionnel: parseInt(e.target.value.trim()),
                  });
              } else {
                e.target.value.length > 0 &&
                  updateFiche({
                    ...fiche,
                    budget_previsionnel: parseInt(e.target.value.trim()),
                  });
              }
            }}
            disabled={isReadonly}
          />
        </Field>
        <div className="pt-6 border-y border-gray-300">
          <Financeurs
            fiche={fiche}
            onUpdate={newFiche => updateFiche(newFiche)}
            isReadonly={isReadonly}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field title="Statut">
            <SelectDropdown
              data-test="Statut"
              buttonClassName={DSFRbuttonClassname}
              value={fiche.statut ?? undefined}
              options={ficheActionStatutOptions}
              onSelect={value => updateFiche({...fiche, statut: value})}
              placeholderText="Sélectionnez une option"
              renderSelection={v => <BadgeStatut statut={v} />}
              renderOption={option => (
                <BadgeStatut statut={option.value as TFicheActionStatuts} />
              )}
              disabled={isReadonly}
            />
          </Field>
          <Field title="Niveau de priorité">
            <SelectDropdown
              buttonClassName={DSFRbuttonClassname}
              value={fiche.niveau_priorite ?? undefined}
              options={ficheActionNiveauPrioriteOptions}
              onSelect={value =>
                updateFiche({...fiche, niveau_priorite: value})
              }
              renderSelection={v => <BadgePriorite priorite={v} />}
              renderOption={option => (
                <BadgePriorite
                  priorite={option.value as TFicheActionNiveauxPriorite}
                />
              )}
              placeholderText="Sélectionnez une option"
              disabled={isReadonly}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field title="Date de début">
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
          </Field>
          <Field title="Date de fin prévisionnelle">
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
            <div className="mt-2">
              <Checkbox
                label="Action en amélioration continue, sans date de fin"
                labelClassName="!text-sm"
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
            </div>
          </Field>
        </div>
        <Field
          title="Calendrier"
          htmlFor="calendrier"
          hint="Si l’action est en pause ou abandonnée, expliquez pourquoi"
        >
          <TextareaControlled
            id="calendrier"
            initialValue={fiche.calendrier ?? ''}
            onBlur={e => {
              if (fiche.calendrier) {
                e.target.value !== fiche.calendrier &&
                  updateFiche({...fiche, calendrier: e.target.value.trim()});
              } else {
                e.target.value.trim().length > 0 &&
                  updateFiche({...fiche, calendrier: e.target.value.trim()});
              }
            }}
            placeholder="Écrire ici..."
            className="outline-transparent resize-none"
            disabled={isReadonly}
          />
        </Field>
      </Section>
      <Section
        icon={<PictoLeaf />}
        title="Actions et fiches liées"
        childrenContainerClassName="gap-6"
      >
        <ActionsLiees
          actions={fiche.actions}
          onSelect={actions => updateFiche({...fiche, actions})}
          isReadonly={isReadonly}
        />
        <FichesLiees
          ficheCouranteId={fiche.id}
          fiches={fiche.fiches_liees}
          onSelect={fiches_liees => updateFiche({...fiche, fiches_liees})}
          isReadonly={isReadonly}
        />
      </Section>
      <Section icon={<PictoBook />} title="Notes">
        <Field
          title="Notes complémentaires"
          hint="Évaluation ou autres informations sur l’action "
          htmlFor="notes-complementaires"
        >
          <TextareaControlled
            id="notes-complementaires"
            initialValue={fiche.notes_complementaires ?? ''}
            onBlur={e => {
              if (fiche.notes_complementaires) {
                e.target.value !== fiche.notes_complementaires &&
                  updateFiche({
                    ...fiche,
                    notes_complementaires: e.target.value.trim(),
                  });
              } else {
                e.target.value.trim().length > 0 &&
                  updateFiche({
                    ...fiche,
                    notes_complementaires: e.target.value.trim(),
                  });
              }
            }}
            placeholder="Écrire ici..."
            maxLength={20000}
            className="outline-transparent resize-none"
            disabled={isReadonly}
          />
        </Field>
      </Section>
      <Section icon={<PictoDocument />} title="Documents et liens">
        {annexes?.map((doc, index) => (
          <PreuveDoc key={index} preuve={doc as unknown as TPreuve} />
        ))}
        <div className={annexes?.length ? 'fr-mt-2w' : undefined}>
          <AddAnnexeButton fiche_id={fiche.id!} />
        </div>
      </Section>
    </div>
  );
};

export default FicheActionForm;
