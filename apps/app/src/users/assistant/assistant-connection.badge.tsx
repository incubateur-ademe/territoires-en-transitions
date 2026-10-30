'use client';
import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { Badge } from '@tet/ui';
import { useListMcpGrants } from './data/use-list-mcp-grants';

/** État du connecteur Claude ; rien tant que Supabase n'a pas répondu. */
export const AssistantConnectionBadge = () => {
  const { data: grants, isError } = useListMcpGrants();

  if (isError) {
    return (
      <span className="text-sm text-grey-7">
        {appLabels.assistantEtatIndisponible}
      </span>
    );
  }
  if (!grants) {
    return null;
  }

  const [latest] = [...grants].sort((a, b) =>
    b.granted_at.localeCompare(a.granted_at)
  );

  return (
    <div
      className="flex flex-wrap items-center gap-2 text-sm text-grey-8"
      data-test="profil.assistant.etat"
    >
      <Badge
        size="sm"
        variant={latest ? 'success' : 'grey'}
        title={
          latest
            ? appLabels.assistantEtatConnecte
            : appLabels.assistantEtatNonConnecte
        }
      />
      <span>
        {latest
          ? appLabels.assistantEtatAutoriseLe(
              getTextFormattedDate({ date: latest.granted_at })
            )
          : appLabels.assistantEtatNonConnecteDetail}
      </span>
    </div>
  );
};
