'use client';

import { getRejoindreCollectivitePath } from '@/api';
import { useUser } from '@/api/users';
import { Button } from '@/ui';
import { ModifierProfilModal } from './_components/modifier-profil.modal';
import { ResendConfirmationLinkButton } from './_components/resend-confirmation-link.button';

export default function Page() {
  const user = useUser();
  const rejoindreCollectivitePath = getRejoindreCollectivitePath(
    document.location.origin
  );

  const isEmailChangeWaitingForConfirmation = user.newEmail !== undefined;

  return (
    <div data-test="MonCompte">
      <div className="flex flex-wrap items-center justify-between gap-6 mb-12 pb-8 border-b border-primary-3">
        <h1 className="mb-0">Mon compte</h1>
        <Button href={rejoindreCollectivitePath} size="sm">
          Rejoindre une collectivité
        </Button>
      </div>
      {/** Bloc informations du compte */}
      <div className="flex flex-col gap-6 max-w-xl p-8 font-medium rounded-xl border border-grey-3 bg-white">
        <div className="flex flex-wrap justify-between items-center gap-6">
          <span className="text-lg font-bold">Informations de mon compte</span>
          <ModifierProfilModal
            user={user}
            isEmailConfirmed={!isEmailChangeWaitingForConfirmation}
          >
            <Button size="xs" variant="grey" icon="pencil-line">
              Modifier
            </Button>
          </ModifierProfilModal>
        </div>
        <div className="h-px w-full bg-grey-3" />
        <div className="flex flex-col gap-2">
          <span className="text-sm text-grey-7">Prénom et nom</span>
          <span>
            {user.prenom} {user.nom}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-grey-7">Email</span>
          <span>{user.newEmail ? user.newEmail : user.email}</span>
          {isEmailChangeWaitingForConfirmation && (
            <>
              <span className="text-info-1 text-sm font-bold">
                En attente de confirmation, consulter votre boite mail.
              </span>
              <span className="text-info-1 text-sm font-normal">
                {
                  "Si vous n'avez pas reçu le lien de confirmation par email, vous pouvez le renvoyer en cliquant sur ce lien :"
                }

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
          <span className="text-sm text-grey-7">Numéro de téléphone</span>
          {user.telephone ? (
            <span>{user.telephone}</span>
          ) : (
            <span className="text-grey-8 italic">Non renseigné</span>
          )}
        </div>
      </div>
    </div>
  );
}
