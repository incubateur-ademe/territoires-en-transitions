import { useReferentielId } from '@/app/core-logic/hooks/params';
import { useReferentielDownToAction } from '@/app/core-logic/hooks/referentiel';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Referentiel } from '@/app/types/litterals';
import { ExpandableAction } from '@/app/ui/shared/actions/ExpandableAction';
import { Button, Checkbox, OptionValue, Select } from '@/ui';
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
  const [displayOption, setDisplayOption] = useState<OptionValue>('axe');

  if (!referentiel) return <></>;

  return (
    <main data-test="ActionsReferentiels" className="fr-container mt-2">
      <section>
        <div className="relative z-[1] flex justify-between max-xl:flex-col xl:items-center gap-4 pb-6 border-b border-primary-3 mb-6">
          <div className="flex max-md:flex-col gap-x-8 gap-y-4 md:items-center">
            <div className="w-full md:w-64">
              <Select
                options={[
                  { value: 'axe', label: 'Par axe' },
                  { value: 'action', label: 'Par action' },
                  // *** For future use ***
                  // { value: 'competences', label: 'Par compétences' },
                ]}
                onChange={(value) => setDisplayOption(value ?? 'axe')}
                values={[displayOption]}
                customItem={(v) => (
                  <span className="text-grey-8 font-normal">{v.label}</span>
                )}
                small
              />
            </div>

            <Checkbox
              label="Afficher la description des actions"
              variant="switch"
              labelClassname="font-normal text-sm !text-grey-7"
              containerClassname="items-center"
              checked={isDescriptionOn}
              onChange={() => setIsDescriptionOn(!isDescriptionOn)}
              disabled={isLoading}
            />
          </div>

          <Button
            data-test="export-scores"
            icon={'download-fill'}
            disabled={isLoading}
            onClick={() => exportScore()}
            size="sm"
          />
        </div>

        {displayOption === 'axe' &&
          axes.map((axe) => (
            <ExpandableAction
              action={axe}
              key={axe.id}
              isDescriptionOn={isDescriptionOn}
            />
          ))}

        {displayOption === 'action' && (
          <div>
            <div
              className={`grid grid-cols-1 ${
                !isDescriptionOn ? 'sm:grid-cols-2 lg:grid-cols-3' : ''
              } gap-4 grid-rows-1`}
            >
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
      </section>
    </main>
  );
};

export default ActionsReferentiels;
