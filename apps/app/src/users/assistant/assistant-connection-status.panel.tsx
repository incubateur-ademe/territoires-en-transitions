'use client';
import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { Alert, Badge, Button, Modal, ModalFooterOKCancel } from '@tet/ui';
import { useState } from 'react';
import { useListMcpGrants } from './data/use-list-mcp-grants';
import { useRevokeMcpGrant } from './data/use-revoke-mcp-grant';

type Grant = NonNullable<ReturnType<typeof useListMcpGrants>['data']>[number];

const GrantRow = ({ grant }: { grant: Grant }) => {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const { mutate: revoke, isPending } = useRevokeMcpGrant();

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-grey-3 px-4 py-3"
      data-test="profil.assistant.autorisation"
    >
      <Badge
        size="sm"
        variant="success"
        title={appLabels.assistantEtatConnecte}
      />
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-grey-7">{appLabels.assistantAutoriseLe}</dt>
        <dd className="m-0 font-medium">
          {getTextFormattedDate({ date: grant.granted_at })}
        </dd>
        <dt className="text-grey-7">{appLabels.assistantClient}</dt>
        <dd className="m-0 font-medium">{grant.client.name}</dd>
      </dl>
      <Button
        variant="grey"
        size="xs"
        icon="link-unlink"
        disabled={isPending}
        onClick={() => setIsConfirmationOpen(true)}
        dataTest="profil.assistant.revoquer"
      >
        {appLabels.assistantRevoquer}
      </Button>

      {isConfirmationOpen && (
        <Modal
          openState={{
            isOpen: isConfirmationOpen,
            setIsOpen: setIsConfirmationOpen,
          }}
          title={appLabels.assistantRevoquer}
          render={() => (
            <Alert
              state="warning"
              description={appLabels.assistantRevoquerConfirmation(
                grant.client.name
              )}
            />
          )}
          renderFooter={({ close }) => (
            <ModalFooterOKCancel
              btnCancelProps={{ onClick: close }}
              btnOKProps={{
                children: appLabels.assistantRevoquer,
                onClick: () => {
                  revoke(grant.client.id);
                  close();
                },
              }}
            />
          )}
        />
      )}
    </div>
  );
};

/** Connecteurs Claude autorisés sur ce compte, révocables sans passer par Claude. */
export const AssistantConnectionStatusPanel = () => {
  const { data: grants, isError } = useListMcpGrants();

  if (isError) {
    return (
      <p className="m-0 text-sm text-grey-7">
        {appLabels.assistantEtatIndisponible}
      </p>
    );
  }
  if (!grants) {
    return null;
  }
  if (grants.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-grey-8">
        <Badge
          size="sm"
          variant="grey"
          title={appLabels.assistantEtatNonConnecte}
        />
        <span>{appLabels.assistantEtatNonConnecteDetail}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {grants.map((grant) => (
        <GrantRow key={grant.client.id} grant={grant} />
      ))}
    </div>
  );
};
