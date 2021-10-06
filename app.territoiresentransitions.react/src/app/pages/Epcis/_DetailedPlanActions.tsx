import {Spacer} from 'ui/shared';
import {ficheActionAvancementColors} from 'app/theme';
import {FicheActionAvancement} from 'types';
import {DetailedEpciCardPropsLink} from 'app/pages/Epcis/_DetailedEpciCardPropsLink';
import {
  useAllStorables,
  useEpciPlanActionAvancementSummmary,
} from 'core-logic/hooks';
import * as R from 'ramda';
import React, {useState} from 'react';
import {UiDialogButton} from 'ui';
import {PlanCreationForm} from 'app/pages/collectivite/PlanActions/Forms/PlanCreationForm';
import {PlanActionStorable} from 'storables';
import {getPlanActionStoreForEpci} from 'core-logic/api/hybridStores';
import {PlanActionTyped} from 'types/PlanActionTypedInterface';

const addSAtTheEndOfWordIfCountGreaterThan1 = (props: {
  count: number;
  word: string;
}): string => `${props.word}${props.count === 1 ? '' : 's'}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hiddenIfNullable = (variable: any) => `${variable ? '' : 'hidden'}`;

export const DetailedPlanActions = ({epciId}: {epciId: string}) => {
  const [creating, setCreating] = useState<boolean>(false);
  const store = getPlanActionStoreForEpci(epciId);
  const plans = useAllStorables<PlanActionStorable>(store);
  plans.sort((a, b) => a.nom.localeCompare(b.nom));

  return (
    <div>
      {' '}
      <div className="flex justify-between items-center">
        <div className="text-lg font-bold">Plan d'actions</div>
        <UiDialogButton
          title="Nouveau"
          opened={creating}
          setOpened={setCreating}
          useFrBtn={false}
          buttonClasses="whitespace-nowrap pt-2"
        >
          <Spacer />
          <PlanCreationForm onSave={() => setCreating(false)} />
        </UiDialogButton>
      </div>
      {plans.map(plan => (
        <div key={plan.id} className="flex flex-col">
          <Spacer size={1} />
          <div className="flex justify-between items-center">
            <div className="text-sm font-bold">{plan.nom}</div>
            <DetailedEpciCardPropsLink
              label="Voir"
              linkTo={`/collectivite/${epciId}/plan_action/${plan.uid}`}
            />
          </div>
          <Spacer size={2} />
          <div className="flex flex-col items-center">
            <FicheActionAvancementCountBarAndLegend
              plan={plan as PlanActionTyped}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const FicheActionAvancementCountBarAndLegend = ({
  plan,
}: {
  plan: PlanActionTyped;
}) => {
  const epciPlanActionAvancementSummmary =
    useEpciPlanActionAvancementSummmary(plan);

  if (
    !epciPlanActionAvancementSummmary.avancementsCount ||
    epciPlanActionAvancementSummmary.total === 0
  )
    return <></>;
  const avancementsCount = epciPlanActionAvancementSummmary.avancementsCount;

  const avancementToGetAdjectiveFromCount: Record<
    FicheActionAvancement,
    (count: number) => string
  > = {
    faite: count =>
      addSAtTheEndOfWordIfCountGreaterThan1({count, word: 'faite'}),
    en_cours: () => 'en cours',
    pas_faite: count =>
      addSAtTheEndOfWordIfCountGreaterThan1({count, word: 'non faite'}),
  };

  const avancementLegends = R.keys(avancementToGetAdjectiveFromCount).map(
    avancement => {
      const count = avancementsCount[avancement as FicheActionAvancement] ?? 0;
      if (count > 0)
        return `${count} ${avancementToGetAdjectiveFromCount[avancement](
          count
        )}`;
      return undefined;
    }
  );

  const enCoursPercentage =
    ((epciPlanActionAvancementSummmary.avancementsCount['en_cours'] ?? 0) /
      epciPlanActionAvancementSummmary.total) *
    100;
  const faitePercentage =
    ((epciPlanActionAvancementSummmary.avancementsCount['faite'] ?? 0) /
      epciPlanActionAvancementSummmary.total) *
    100;

  return (
    <div className="w-5/6">
      <div>
        <div className="h-5 bg-gray-300 flex">
          <div
            className=" h-5"
            style={{
              width: `${faitePercentage}%`,
              backgroundColor: ficheActionAvancementColors['faite'],
            }}
          />
          <div
            className=" h-5"
            style={{
              width: `${enCoursPercentage}%`,
              backgroundColor: ficheActionAvancementColors['en_cours'],
            }}
          />
        </div>
      </div>

      <div className="flex justify-evenly text-xs">
        {avancementLegends.map((legend, index) => (
          <div key={index} className={hiddenIfNullable(legend)}>
            {legend}
          </div>
        ))}
      </div>
      <div
        className={`flex justify-center text-xs ${hiddenIfNullable(
          epciPlanActionAvancementSummmary.enRetardCount
        )}`}
      >
        <div className="text-red-600">
          {'( '} {epciPlanActionAvancementSummmary.enRetardCount}{' '}
          {addSAtTheEndOfWordIfCountGreaterThan1({
            word: 'action',
            count: epciPlanActionAvancementSummmary.enRetardCount,
          })}
          {' en retard )'}
        </div>
      </div>
    </div>
  );
};
