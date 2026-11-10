import { PlanPage } from '@/app/plans/plans/show-plan/plan.page';

export default function Page({
  params,
}: {
  params: Promise<{ planId: string; collectiviteId: string }>;
}) {
  return <PlanPage params={params} tab="pilotage" />;
}
