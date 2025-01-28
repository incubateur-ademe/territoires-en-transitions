import { ActionPage } from 'app.territoiresentransitions.react/app/collectivite/[collectiviteId]/referentiel/[referentielId]/action/[actionId]/[[...actionTab]]/action.page';

export default async function Page({
  params,
}: {
  params: Promise<{ actionId: string }>;
}) {
  const { actionId } = await params;
  return <ActionPage actionId={actionId} />;
}
