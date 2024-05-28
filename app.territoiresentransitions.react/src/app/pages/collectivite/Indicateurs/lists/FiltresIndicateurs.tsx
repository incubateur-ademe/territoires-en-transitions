import {useState} from 'react';
import {AccordionControlled} from 'ui/Accordion';
import FormField from 'ui/shared/form/FormField';
import {Checkbox} from '@tet/ui';
import {IndicateurViewParamOption} from 'app/paths';
import FiltrePersonnes from './FiltrePersonnes';
import {UseFilterState} from './useIndicateursFilterState';
import FiltreServices from './FiltreServices';
import FiltrePlans from './FiltrePlans';
import FiltreComplet from './FiltreComplet';
import {UiSearchBar} from 'ui/UiSearchBar';
import {InfoTooltip} from 'ui/shared/floating-ui/InfoTooltip';
import ThematiquesDropdown from 'app/components/DropdownLists/ThematiquesDropdown';
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
      <FormField label="Filtrer par nom ou description">
        <UiSearchBar
          debouncePeriod={500}
          placeholder=""
          value={text?.[0] || ''}
          search={value => updateFilterParam('text', [value])}
        />
      </FormField>
      <AccordionControlled
        id="filtres-indicateurs"
        className="mb-8"
        titre="Filtres complémentaires"
        icon={`fr-icon-filter-${filterParamsCount > 0 ? 'fill' : 'line'}`}
        html={
          isOpen && (
            <>
              <FormField label="Thématique" className="z-10">
                <ThematiquesDropdown
                  values={
                    thematiques?.length
                      ? thematiques.map(t => parseInt(t))
                      : undefined
                  }
                  onChange={values =>
                    updateFilterParam(
                      'thematiques',
                      values.map(t => t.id.toString())
                    )
                  }
                />
              </FormField>
              <div className="grid lg:grid-cols-2 gap-x-8 gap-y-0">
                <FormField label="Personne pilote">
                  <FiltrePersonnes
                    values={pilotes}
                    onSelect={values => updateFilterParam('pilotes', values)}
                  />
                </FormField>
                <FormField label="Direction ou service pilote">
                  <FiltreServices
                    values={services}
                    onSelect={values => updateFilterParam('services', values)}
                  />
                </FormField>
                <FormField label="Plan d'action">
                  <FiltrePlans
                    values={plans}
                    onSelect={values => updateFilterParam('plans', values)}
                  />
                </FormField>
                <FormField label="Indicateur complété">
                  <FiltreComplet
                    values={rempli}
                    onSelect={values => updateFilterParam('rempli', values)}
                  />
                </FormField>
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
                  <div className="flex flex-row">
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
                      label={() => (
                        <p>
                          Indicateur dont les résultats conditionnent certains
                          points dans le référentiel CAE
                        </p>
                      )}
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
