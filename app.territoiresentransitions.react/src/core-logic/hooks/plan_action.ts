import {useEffect, useState} from 'react';
import {planActionReadEndpoint} from 'core-logic/api/endpoints/PlanActionReadEndpoint';
import {planActionWriteEndpoint} from 'core-logic/api/endpoints/PlanActionWriteEndpoint';
import {PlanActionRead} from 'generated/dataLayer/plan_action_read';

export const usePlanActionList = (collectiviteId: number) => {
  const [plans, setPlans] = useState<PlanActionRead[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const plans = await planActionReadEndpoint.getBy({
        collectivite_id: collectiviteId,
      });
      setPlans(plans);
    };
    planActionWriteEndpoint.addListener(fetch);
    fetch();
    return () => {
      planActionWriteEndpoint.removeListener(fetch);
    };
  });

  return plans;
};

export const usePlanAction = (
  collectiviteId: number,
  uid: string | undefined
) => {
  const [plan, setPlan] = useState<PlanActionRead | null>(null);

  useEffect(() => {
    const listener = async () => {
      const plans = await planActionReadEndpoint.getBy({
        collectivite_id: collectiviteId,
        plan_action_uid: uid,
      });
      if (plans.length === 0) {
        setPlan(null);
      } else {
        setPlan(plans[0]!);
      }
    };
    planActionWriteEndpoint.addListener(listener);
    listener();
    return () => {
      planActionWriteEndpoint.removeListener(listener);
    };
  });

  return plan;
};
