import {useState} from 'react';
import {AccordionControlled} from 'ui/Accordion';
import {Checkbox, Field, InfoTooltip} from '@tet/ui';
import {IndicateurViewParamOption} from 'app/paths';
import {UseFilterState} from './useIndicateursFilterState';
import FiltreServices from './FiltreServices';
import FiltrePlans from './FiltrePlans';
import FiltreComplet from './FiltreComplet';
import {UiSearchBar} from 'ui/UiSearchBar';
import ThematiquesDropdown from 'ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {getPersonneStringId} from 'ui/dropdownLists/PersonnesDropdown/utils';
//import FiltreType from './FiltreType';

export type FiltresIndicateursProps = {
  state: UseFilterState;
  view: IndicateurViewParamOption;
};

/**
 * Affiche le bloc de filtrage des indicateurs
 */
export const FiltresIndicateurs = (props: FiltresIndicateursProps) => {
  const {state, view} = props;
  const {filterParams, updateFilterParam, filterParamsCount} = state;
  const [isOpen, setIsOpen] = useState(filterParamsCount > 0);

  const {
    text,
    thematiques,
    pilotes,
    services,
    plans,
    rempli,
    participation_score,
    confidentiel,
    //    type,
  } = filterParams;

  return (
    <>
      <Field title="Filtrer par nom ou description" className="mb-6">
        <UiSearchBar
          debouncePeriod={500}
          placeholder=""
          value={text?.[0] || ''}
          search={value => updateFilterParam('text', [value])}
        />
      </Field>
      <AccordionControlled
        id="filtres-indicateurs"
        className="mb-8"
        titre="Filtres complémentaires"
        icon={`fr-icon-filter-${filterParamsCount > 0 ? 'fill' : 'line'}`}
        html={
          isOpen && (
            <>
              <Field title="Thématique" className="mb-6">
                <ThematiquesDropdown
                  values={thematiques?.map(t => parseInt(t))}
                  onChange={({thematiques}) =>
                    updateFilterParam(
                      'thematiques',
                      thematiques.map(t => t.id.toString())
                    )
                  }
                />
              </Field>
              <div className="grid lg:grid-cols-2 gap-x-8 gap-y-6">
                <Field title="Personne pilote">
                  <PersonnesDropdown
                    values={pilotes}
                    onChange={({personnes}) =>
                      updateFilterParam(
                        'pilotes',
                        personnes.map(p => getPersonneStringId(p))
                      )
                    }
                  />
                </Field>
                <Field title="Direction ou service pilote">
                  <FiltreServices
                    values={services}
                    onSelect={values => updateFilterParam('services', values)}
                  />
                </Field>
                <Field title="Plan d'action">
                  <FiltrePlans
                    values={plans}
                    onSelect={values => updateFilterParam('plans', values)}
                  />
                </Field>
                <Field title="Indicateur complété">
                  <FiltreComplet
                    values={rempli}
                    onSelect={values => updateFilterParam('rempli', values)}
                  />
                </Field>
                {/*view !== 'perso' && (
                <FormField label="Type">
                  <FiltreType
                    values={type}
                    onSelect={values => updateFilterParam('type', values)}
                  />
                </FormField>
              )*/}
                <Checkbox
                  label="Indicateurs privés"
                  checked={confidentiel?.includes('oui') || false}
                  onChange={() =>
                    updateFilterParam(
                      'confidentiel',
                      confidentiel?.includes('oui') ? [] : ['oui']
                    )
                  }
                />

                {view === 'cae' && (
                  <div className="flex flex-row items-center">
                    <Checkbox
                      label="Participe au score"
                      checked={participation_score?.includes('oui') || false}
                      onChange={() =>
                        updateFilterParam(
                          'participation_score',
                          participation_score?.includes('oui') ? [] : ['oui']
                        )
                      }
                    />
                    <InfoTooltip
                      label="Indicateur dont les résultats conditionnent certains points dans le référentiel CAE"
                      activatedBy="click"
                      iconClassName="ml-2 -mb-0.5"
                    />
                  </div>
                )}
              </div>
            </>
          )
        }
        expanded={isOpen}
        setExpanded={setIsOpen}
      />
    </>
  );
};
