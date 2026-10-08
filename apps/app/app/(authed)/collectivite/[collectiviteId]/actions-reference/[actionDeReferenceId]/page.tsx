import { appLabels } from '@/app/labels/catalog';
import { ActionDeReferenceView } from '@/app/shared/actions-de-reference/action-de-reference.view';
import { actionDeReferenceIdSchema } from '@tet/domain/shared';
import { z } from 'zod';

const parametersSchema = z.object({
  actionDeReferenceId: z.coerce.number().pipe(actionDeReferenceIdSchema),
});

export default async function ActionDeReferencePage({
  params,
}: {
  params: Promise<{ actionDeReferenceId: string }>;
}) {
  const { success, data } = parametersSchema.safeParse(await params);
  if (!success) {
    return <div>{appLabels.urlNonValide}</div>;
  }

  return (
    <ActionDeReferenceView actionDeReferenceId={data.actionDeReferenceId} />
  );
}
