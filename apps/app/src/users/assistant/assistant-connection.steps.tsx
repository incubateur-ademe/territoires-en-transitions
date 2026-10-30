'use client';
import { appLabels } from '@/app/labels/catalog';
import { useSuperAdminMode } from '@/app/users/authorizations/super-admin-mode/super-admin-mode.provider';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { Badge, Button, useCopyToClipboard } from '@tet/ui';
import { ReactNode, useId } from 'react';
import { getMcpConnectorUrl } from './mcp-connector-url';

const Step = ({
  index,
  title,
  description,
  children,
}: {
  index: number;
  title: string;
  description: string;
  children?: ReactNode;
}) => (
  <li className="flex gap-4">
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-1 text-sm font-bold text-primary-9"
    >
      {index}
    </span>
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div>
        <h3 className="mb-1 text-base font-bold text-primary-9">{title}</h3>
        <p className="m-0 text-sm text-grey-8">{description}</p>
      </div>
      {children}
    </div>
  </li>
);

const ConnectorUrlField = () => {
  const id = useId();
  const url = getMcpConnectorUrl();
  const { copy } = useCopyToClipboard();
  const { setToast } = useToastContext();

  const handleCopy = async () => {
    const ok = await copy(url);
    setToast(
      ok ? 'success' : 'error',
      ok ? appLabels.copie : appLabels.copieErreur
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-primary-9">
        {appLabels.assistantAdresseConnecteur}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id={id}
          readOnly
          value={url}
          onFocus={(event) => event.target.select()}
          className="min-w-0 flex-1 rounded-md border border-grey-4 bg-grey-1 p-2 font-mono text-sm"
          data-test="profil.assistant.adresse-connecteur"
        />
        <Button
          variant="outlined"
          size="sm"
          icon="file-copy-line"
          onClick={handleCopy}
          dataTest="profil.assistant.copier-adresse"
        >
          {appLabels.assistantCopierAdresse}
        </Button>
      </div>
    </div>
  );
};

/** Mode super-admin du compte, que l'assistant applique comme l'interface. */
export const SuperAdminModeState = () => {
  const { isSuperAdminRoleEnabled } = useSuperAdminMode();
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-grey-8">
      <span>{appLabels.assistantModeSuperAdmin}</span>
      <Badge
        size="xs"
        variant={isSuperAdminRoleEnabled ? 'success' : 'grey'}
        title={
          isSuperAdminRoleEnabled
            ? appLabels.assistantModeSuperAdminActif
            : appLabels.assistantModeSuperAdminInactif
        }
      />
      {!isSuperAdminRoleEnabled && (
        <span>{appLabels.assistantModeSuperAdminAide}</span>
      )}
    </div>
  );
};

/** Les trois étapes pour brancher Claude ; Crisp n'en a pas besoin. */
export const AssistantConnectionSteps = () => (
  <ol className="m-0 flex list-none flex-col gap-6 p-0">
    <Step
      index={1}
      title={appLabels.assistantEtapeAjouterTitre}
      description={appLabels.assistantEtapeAjouterDescription}
    >
      <ConnectorUrlField />
    </Step>
    <Step
      index={2}
      title={appLabels.assistantEtapeAutoriserTitre}
      description={appLabels.assistantEtapeAutoriserDescription}
    />
    <Step
      index={3}
      title={appLabels.assistantEtapeSuperAdminTitre}
      description={appLabels.assistantEtapeSuperAdminDescription}
    >
      <SuperAdminModeState />
    </Step>
  </ol>
);
