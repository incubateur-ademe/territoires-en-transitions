'use client';
import {
  profilAssistantExemplesUrl,
  profilAssistantPath,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Badge, Button } from '@tet/ui';
import { AssistantConnectionBadge } from './assistant-connection.badge';

/** Carte « Assistant TeT » des Préférences, affichée aux seuls comptes support. */
export const AssistantCard = () => (
  <div
    className="flex flex-col gap-6 max-w-xl p-8 font-medium rounded-xl border border-grey-3 bg-white"
    data-test="profil.assistant"
  >
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-lg font-bold">{appLabels.assistantTitre}</span>
      <Badge size="xs" variant="info" title={appLabels.assistantBadgeSupport} />
      <Badge
        size="xs"
        variant="grey"
        type="outlined"
        title={appLabels.assistantBadgeLectureSeule}
      />
    </div>
    <div className="h-px w-full bg-grey-3" />
    <p className="m-0 text-sm text-grey-8">{appLabels.assistantCarteResume}</p>
    <AssistantConnectionBadge />
    <div className="flex flex-wrap gap-3">
      <Button
        size="sm"
        href={profilAssistantPath}
        dataTest="profil.assistant.configurer"
      >
        {appLabels.assistantConfigurer}
      </Button>
      <Button
        size="sm"
        variant="outlined"
        href={profilAssistantExemplesUrl}
        dataTest="profil.assistant.exemples"
      >
        {appLabels.assistantVoirExemples}
      </Button>
    </div>
  </div>
);
