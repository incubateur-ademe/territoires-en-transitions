import { useReferentielId } from '@/app/core-logic/hooks/params';
import { useReferentielDownToAction } from '@/app/core-logic/hooks/referentiel';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Referentiel } from '@/app/types/litterals';
import { ExpandableAction } from '@/app/ui/shared/actions/ExpandableAction';
import { Checkbox, Input, OptionValue, Select } from '@/ui';
import { useState } from 'react';
import { ReferentielCard } from '../../../../ui/referentiels/Card/ReferentielCard';
import { useExportScore } from './useExportScore';

export const ActionsReferentiels = () => {
  const referentielId = useReferentielId();
  const current = referentielId ?? 'eci';

  const actions = useReferentielDownToAction(current as Referentiel);
  const axes = actions.filter((a) => a.type === 'axe');
  const referentiel = actions.find((a) => a.type === 'referentiel')!;

  const collectivite = useCurrentCollectivite();
  const { mutate: exportScore, isLoading } = useExportScore(
    referentielId,
    collectivite
  );
  const [isDescriptionOn, setIsDescriptionOn] = useState(false);
  const [displayOption, setDisplayOption] = useState<OptionValue>('axes');

  if (!referentiel) return <></>;

  return (
    <main data-test="ActionsReferentiels" className="fr-container mt-2">
      <section>
        <>
          <div className="relative">
            <div className="relative z-[1] flex max-xl:flex-col justify-between xl:items-center gap-4 pb-6 border-b border-primary-3 mb-6">
              <div className="flex max-md:flex-col gap-x-8 gap-y-4 md:items-center">
                <div className="w-full md:w-64">
                  <Select
                    options={[
                      { value: 'axes', label: 'Par axes' },
                      { value: 'actions', label: 'Par actions' },
                      { value: 'competences', label: 'Par compétences' },
                    ]}
                    onChange={(value) => setDisplayOption(value ?? 'axes')}
                    values={[displayOption]}
                    customItem={(v) => (
                      <span className="text-grey-8 font-normal">{v.label}</span>
                    )}
                    small
                  />
                </div>
              </div>

              <div className="flex gap-x-6">
                <Checkbox
                  label="Afficher la description des actions"
                  variant="switch"
                  labelClassname="font-normal text-sm !text-grey-7"
                  containerClassname="items-center"
                  checked={isDescriptionOn}
                  onChange={(evt) => {
                    setIsDescriptionOn(!isDescriptionOn);
                  }}
                  disabled={isLoading}
                />

                <Checkbox
                  label="Appliquer des actions groupées"
                  variant="switch"
                  labelClassname="font-normal text-sm !text-grey-7"
                  containerClassname="items-center"
                  checked={true}
                  onChange={() => {}}
                  disabled={isLoading}
                />
              </div>
              <div className="flex gap-x-8 gap-y-4">
                <Input
                  type="search"
                  onChange={() => {}}
                  onSearch={() => {}}
                  value={''}
                  containerClassname="w-full xl:w-96"
                  placeholder="Rechercher une action"
                  displaySize="sm"
                />
              </div>
            </div>
          </div>
        </>

        {displayOption === 'actions' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {actions
                .filter((action) => action.type === 'action')
                .map((action) => (
                  <ReferentielCard
                    key={action.id}
                    action={action}
                    isDescriptionOn={isDescriptionOn}
                  />
                ))}
            </div>
          </div>
        )}

        {displayOption === 'axes' &&
          axes.map((axe) => (
            <ExpandableAction
              action={axe}
              key={axe.id}
              isDescriptionOn={isDescriptionOn}
            />
          ))}
      </section>
      <button
        data-test="export-scores"
        className="fr-btn fr-btn--icon-left fr-fi-download-line fr-mt-6w"
        disabled={isLoading}
        onClick={() => {
          exportScore();
        }}
      >
        Exporter
      </button>
    </main>
  );
};

export default ActionsReferentiels;
