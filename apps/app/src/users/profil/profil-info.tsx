import { appLabels } from '@/app/labels/catalog';
import { UserWithRolesAndPermissions } from '@tet/domain/users';
import { Button } from '@tet/ui';
import { ModifierProfilModal } from './modifier-profil.modal';
import { ResendConfirmationLinkButton } from './resend-confirmation-link.button';

export const ProfilInfo = ({ user }: { user: UserWithRolesAndPermissions }) => {
  const isEmailChangeWaitingForConfirmation = !!user.newEmail;

  return (
    <div className="flex flex-col gap-6 max-w-xl p-8 font-medium rounded-xl border border-grey-3 bg-white">
      <div className="flex flex-wrap justify-between items-center gap-6">
        <span className="text-lg font-bold">
          {appLabels.informationsDeMonCompte}
        </span>
        <ModifierProfilModal
          user={user}
          isEmailConfirmed={!isEmailChangeWaitingForConfirmation}
        >
          <Button size="xs" variant="grey" icon="pencil-line">
            {appLabels.modifier}
          </Button>
        </ModifierProfilModal>
      </div>
      <div className="h-px w-full bg-grey-3" />
      <div className="flex flex-col gap-2">
        <span className="text-sm text-grey-7">{appLabels.prenomEtNom}</span>
        <span>
          {user.prenom} {user.nom}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-grey-7">{appLabels.email}</span>
        <span>{user.newEmail ? user.newEmail : user.email}</span>
        {isEmailChangeWaitingForConfirmation && (
          <>
            <span className="text-info-1 text-sm font-bold">
              {appLabels.emailEnAttenteConfirmation}
            </span>
            <span className="text-info-1 text-sm font-normal">
              {appLabels.confirmationEmailRenvoyerLien}

              <ResendConfirmationLinkButton
                newEmail={user.newEmail as string}
                size="xs"
                variant="underlined"
                className="mt-2"
              />
            </span>
          </>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-grey-7">
          {appLabels.numeroDeTelephone}
        </span>
        {user.telephone ? (
          <span>{user.telephone}</span>
        ) : (
          <span className="text-grey-8 italic">{appLabels.nonRenseigne}</span>
        )}
      </div>
    </div>
  );
};
