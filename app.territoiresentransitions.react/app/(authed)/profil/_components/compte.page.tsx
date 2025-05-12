'use client';

import { isAfter } from 'date-fns';

import { getRejoindreCollectivitePath } from '@/api';
import { UserDetails } from '@/api/users/user-details.fetch.server';
import { useUser } from '@/api/users/user-provider';
import { Button } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';

import ModifierCompteModal from './modifier-compte.modal';
import { useGetUser } from './use-get-user';

// Nécessaire d'utiliser 2 composants afin de ne jamais avoir un email undefined,
// or l'email fourni par Supabase peut être undefined dans les types.
// La route tRPC nécessite un email pour récupérer les informations utilisateur
// et par la suite pouvoir les modifier et invalider le cache de react-query.

const Compte = () => {
  const userSupabase = useUser();

  if (userSupabase.email === undefined) {
    return null;
  }

  return (
    <CompteWithEmail
      userSupabase={{ ...userSupabase, email: userSupabase.email }}
    />
  );
};

export default Compte;

type Props = {
  userSupabase: Omit<UserDetails, 'email'> & {
    email: string;
  };
};

export const CompteWithEmail = ({ userSupabase }: Props) => {
  const { data: userBDD } = useGetUser(userSupabase.email);

  if (!userBDD?.user) {
    return null;
  }

  // soit il n'y a que la confirmation initiale sans jamais avoir eu de changements
  // soit il y a déjà eu une demande de changement d'email en plus de la confirmation initiale
  const isEmailConfirmed =
    (!!userSupabase.email_confirmed_at && !userSupabase.email_change_sent_at) ||
    (!!userSupabase.email_confirmed_at &&
      !!userSupabase.email_change_sent_at &&
      isAfter(
        new Date(userSupabase.email_confirmed_at),
        new Date(userSupabase.email_change_sent_at)
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
          <ModifierCompteModal
            user={userBDD.user}
            defaultEmail={
              userSupabase.new_email
                ? userSupabase.new_email
                : userBDD.user.email
            }
            isEmailConfirmed={isEmailConfirmed}
          >
            <Button size="xs" variant="grey" icon="pencil-line">
              Modifier
            </Button>
          </ModifierCompteModal>
        </div>
        <div className="h-px w-full bg-grey-3" />
        <div className="flex flex-col gap-2">
          <span className="text-sm text-grey-7">Prénom et nom</span>
          <span>
            {userSupabase.prenom} {userSupabase.nom}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-grey-7">Email</span>
          <div className="flex items-baseline gap-4">
            <span>
              {userSupabase.new_email
                ? userSupabase.new_email
                : userBDD.user.email}
            </span>
            {!isEmailConfirmed && (
              <span className="text-info-1 italic text-sm font-normal">
                En attente de confirmation, consulter vos mails
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-grey-7">Numéro de téléphone</span>
          {userSupabase.phone ? (
            <span>{userSupabase.phone}</span>
          ) : (
            <span className="text-grey-8 italic">Non renseigné</span>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
