import { profilPath } from '@/app/app/paths';
import { AssistantView } from '@/app/users/assistant/assistant.view';
import { canUseAssistant } from '@/app/users/assistant/can-use-assistant';
import { getUser } from '@tet/api/users/user-details.fetch.server';
import { redirect } from 'next/navigation';

export default async function Page() {
  const user = await getUser();
  if (!canUseAssistant(user)) {
    redirect(profilPath);
  }

  return <AssistantView />;
}
