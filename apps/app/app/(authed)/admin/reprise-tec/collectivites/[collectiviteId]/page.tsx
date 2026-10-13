import { RepriseTecCollectiviteView } from '@/app/demarches/pcaet/reprise-tec/collectivite/reprise-tec-collectivite.view';
import { appLabels } from '@/app/labels/catalog';
import { z } from 'zod';

const parametersSchema = z.object({
  collectiviteId: z.coerce.number().int().positive(),
});

export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: string }>;
}) {
  const { success, data } = parametersSchema.safeParse(await params);
  if (!success) {
    return <div>{appLabels.urlNonValide}</div>;
  }
  return <RepriseTecCollectiviteView collectiviteId={data.collectiviteId} />;
}
