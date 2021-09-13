import type {EpciStorable} from 'storables/EpciStorable';
import {useEpciFicheAction} from 'core-logic/hooks';
import * as R from 'ramda';
import {FicheActionStorable} from 'storables/FicheActionStorable';
import {Spacer} from 'ui/shared';
import {ficheActionAvancementColors} from 'app/theme';
import {Avancement} from 'types';
import {DetailedEpciCardPropsLink} from 'app/pages/Epcis/_DetailedEpciCardPropsLink';

const addSAtTheEndOfWordIfCountGreaterThan1 = (props: {
  count: number;
  word: string;
}): string => `${props.word}${props.count === 1 ? '' : 's'}`;

const hiddenIfCountIsZero = (count: number) => `${count ? '' : 'hidden'}`;

export const DetailedPlanActions = ({epci}: {epci: EpciStorable}) => {
  const monPlanDActions = useEpciFicheAction({
    epciId: epci.id,
  });

  return (
    <div>
      {' '}
      <div className="flex justify-between items-center">
        <div className="text-lg font-bold">Plan d'actions</div>
        {/* <button className="fr-btn fr-btn--secondary fr-btn--sm">
          + Nouveau{' '}
        </button> */}
      </div>
      <Spacer size={1} />
      <div className="flex justify-between items-center">
        <div className="text-sm font-bold">Mon plan d'action</div>
        <DetailedEpciCardPropsLink
          label="Voir"
          linkTo={`/collectivite/${epci.id}/plan_actions`} // TODO link to specific plan d'action
        />
      </div>
      <Spacer size={2} />
      <FicheActionAvancementCountBarAndLegend ficheActions={monPlanDActions} />
    </div>
  );
};

const FicheActionAvancementCountBarAndLegend = ({
  ficheActions,
}: {
  ficheActions: FicheActionStorable[];
}) => {
  const actionCountByAvancement = R.countBy(
    ficheAction => ficheAction.avancement,
    ficheActions
  ) as Record<Avancement, number>; // TODO : infer type with Ramda
  const actionsEnRetard = ficheActions.filter(
    ficheAction => ficheAction.en_retard
  ).length;
  const nbOfActions = ficheActions.length;

  const enCoursPercentage =
    (actionCountByAvancement['en_cours'] / nbOfActions) * 100;
  const faitePercentage =
    (actionCountByAvancement['faite'] / nbOfActions) * 100;
  return (
    <div>
      <div className="">
        <div className="h-5 bg-gray-300 flex">
          <div
            className=" h-5"
            style={{
              width: `${faitePercentage}%`,
              backgroundColor: ficheActionAvancementColors['faite'],
            }}
          ></div>
          <div
            className=" h-5"
            style={{
              width: `${enCoursPercentage}%`,
              backgroundColor: ficheActionAvancementColors['en_cours'],
            }}
          ></div>
        </div>
      </div>
      <div className="flex justify-evenly text-xs">
        <div className={hiddenIfCountIsZero(actionCountByAvancement['faite'])}>
          {actionCountByAvancement['faite']}{' '}
          {addSAtTheEndOfWordIfCountGreaterThan1({
            word: 'finie',
            count: actionCountByAvancement['faite'],
          })}
        </div>

        <div
          className={hiddenIfCountIsZero(actionCountByAvancement['en_cours'])}
        >
          {actionCountByAvancement['en_cours']} en cours
        </div>
        <div
          className={hiddenIfCountIsZero(actionCountByAvancement['pas_faite'])}
        >
          {actionCountByAvancement['pas_faite']}{' '}
          {addSAtTheEndOfWordIfCountGreaterThan1({
            word: 'non faite',
            count: actionCountByAvancement['pas_faite'],
          })}
        </div>
      </div>
      <div className="flex justify-center text-xs">
        <div className="text-red-600">
          {actionsEnRetard}{' '}
          {addSAtTheEndOfWordIfCountGreaterThan1({
            word: 'action',
            count: actionsEnRetard,
          })}
          {' en retard'}
        </div>
      </div>
    </div>
  );
};
