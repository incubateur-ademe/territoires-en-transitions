'use client';

import { isAfter } from 'date-fns';

import { getRejoindreCollectivitePath } from '@/api';
import { Button } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';

import { useUser } from '@/api/users/user-provider';
import ModifierCompteModal from './modifier-compte.modal';

export const Compte = () => {
  const user = useUser();

  // TODO : vérifier si on ne peut pas uniquement utilser user.new_email,
  // si après la confirmation, le champ new_email disparaît de UserDetails

  // soit il n'y a que la confirmation initiale sans jamais avoir eu de changements
  // soit il y a déjà eu une demande de changement d'email en plus de la confirmation initiale
  const isEmailConfirmed =
    (!!user.email_confirmed_at && !user.email_change_sent_at) ||
    (!!user.email_confirmed_at &&
      !!user.email_change_sent_at &&
      isAfter(
        new Date(user.email_confirmed_at),
        new Date(user.email_change_sent_at)
      ));

  return (
    <PageContainer dataTest="MonCompte">
      <div className="flex flex-wrap items-center justify-between gap-6 mb-12 pb-8 border-b border-primary-3">
        <h1 className="mb-0">Mon compte</h1>
        <Button
          href={getRejoindreCollectivitePath(document.location.origin)}
          size="sm"
        >
          Rejoindre une collectivité
        </Button>
      </div>
      {/** Bloc informations du compte */}
      <div className="flex flex-col gap-6 max-w-xl p-8 font-medium rounded-xl border border-grey-3 bg-white">
        <div className="flex flex-wrap justify-between items-center gap-6">
          <span className="text-lg font-bold">Informations de mon compte</span>
          <ModifierCompteModal user={user} isEmailConfirmed={isEmailConfirmed}>
            <Button size="xs" variant="grey" icon="pencil-line">
              Modifier
            </Button>
          </ModifierCompteModal>
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
          <div className="flex items-baseline gap-4">
            <span>{user.new_email ? user.new_email : user.email}</span>
            {!isEmailConfirmed && (
              <span className="text-info-1 italic text-sm font-normal">
                En attente de confirmation, consulter vos mails
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-grey-7">Numéro de téléphone</span>
          {user.phone ? (
            <span>{user.phone}</span>
          ) : (
            <span className="text-grey-8 italic">Non renseigné</span>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default Compte;
