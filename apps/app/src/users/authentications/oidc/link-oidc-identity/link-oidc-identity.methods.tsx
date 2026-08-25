'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RouterOutput, useTRPC, useUser } from '@tet/api';
import {
  Alert,
  Button,
  Event,
  Modal,
  ModalFooterOKCancel,
  ProConnectButton,
  useEventTracker,
} from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  buildLinkIdentityUrl,
  isLinkIdentityErrorCode,
} from './link-oidc-identity.profile-urls';

type OidcProvider =
  RouterOutput['users']['authentications']['oidc']['listActiveProviders'][number];
type IdentiteLiee =
  RouterOutput['users']['authentications']['oidc']['listUserIdentities'][number];

const ERREUR_LIAISON_PARAM = 'erreur-liaison';

/**
 * Les deux providers se présentent sous la marque « ProConnect » : la bascule
 * de l'un à l'autre doit rester invisible (décision produit), d'où l'absence
 * de mapping par provider.
 */
const OIDC_DISPLAY_NAME = appLabels.oidcProviderProconnect;

/**
 * Section « Méthodes de connexion » du profil : permet de lier/délier les
 * identités OIDC (ProConnect aujourd'hui, MonCompteAdeme demain) — générique,
 * piloté par `listActiveProviders` (n'affiche que les providers réellement
 * activés côté backend, dans l'ordre renvoyé).
 *
 * Gère aussi la lecture du paramètre `erreur-liaison` déposé par le callback
 * OIDC en cas d'échec de liaison, distinct du toast one-shot `comptes-associes`
 * géré par `ToastLiaisonComptes`. On garde ce composant séparé : `erreur-liaison`
 * ne peut arriver que sur `/profil` (seule origine du parcours `mode=link`),
 * pas besoin de le faire remonter au niveau racine.
 */
export const LinkOidcIdentityMethods = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trackEvent = useEventTracker();

  const { data: providersActifs } = useQuery(
    trpc.users.authentications.oidc.listActiveProviders.queryOptions()
  );
  const { data: identitesLiees } = useQuery(
    trpc.users.authentications.oidc.listUserIdentities.queryOptions()
  );

  const { mutate: unlinkIdentityFromUser } = useMutation(
    trpc.users.authentications.oidc.unlinkIdentityFromUser.mutationOptions({
      meta: {
        success: appLabels.methodeConnexionDelieeSucces,
        error: appLabels.methodeConnexionDelierErreurDernierMoyen,
      },
      onSuccess: (_, { provider }) => {
        trackEvent(Event.auth.oidc.unlinked, { provider });
        queryClient.invalidateQueries({
          queryKey:
            trpc.users.authentications.oidc.listUserIdentities.queryKey(),
        });
      },
      onError: (error, { provider }) => {
        trackEvent(Event.auth.oidc.unlinkError, {
          provider,
          erreurType: error.data?.code ?? 'inconnue',
        });
      },
    })
  );

  // Erreur de liaison déposée par le callback OIDC dans l'URL : on la CAPTURE en
  // state au montage, puis on nettoie l'URL. Sans ce state, l'alerte lue
  // directement depuis `searchParams` disparaîtrait aussitôt que `router.replace`
  // retire le paramètre (l'erreur flashait puis s'effaçait).
  const [erreurLiaisonCode, setErreurLiaisonCode] = useState<string | null>(
    null
  );

  useEffect(() => {
    const code = searchParams.get(ERREUR_LIAISON_PARAM);
    if (!code) {
      return;
    }

    setErreurLiaisonCode(code);
    trackEvent(Event.auth.oidc.linkError, { erreurType: code });

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete(ERREUR_LIAISON_PARAM);
    const query = nextSearchParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
    // Lu une seule fois au montage (même pattern que `ToastLiaisonComptes`) : on
    // ne redéclenche pas quand `searchParams`/`router` changent d'identité.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const user = useUser();

  // Chargement initial sans données, ou aucun provider activé : pas de
  // section vide disgracieuse.
  if (!providersActifs || providersActifs.length === 0) {
    return null;
  }

  const identiteParProvider = new Map<OidcProvider, IdentiteLiee>(
    (identitesLiees ?? []).map((identite) => [identite.provider, identite])
  );
  const unlinkedProviders = providersActifs.filter(
    (provider) => !identiteParProvider.has(provider)
  );

  return (
    <div className="flex flex-col gap-6 max-w-xl p-8 font-medium rounded-xl border border-grey-3 bg-white">
      <div className="flex flex-wrap justify-between items-center gap-6">
        <span className="text-lg font-bold">
          {appLabels.methodesDeConnexion}
        </span>
      </div>
      <div className="h-px w-full bg-grey-3" />

      {erreurLiaisonCode && (
        <Alert
          state="error"
          description={
            !isLinkIdentityErrorCode(erreurLiaisonCode)
              ? appLabels.erreurLiaisonGenerique
              : erreurLiaisonCode === 'oidc-identite-deja-liee-ailleurs'
              ? appLabels.erreurLiaisonIdentiteDejaLieeAilleurs
              : appLabels.erreurLiaisonCompteSupprime
          }
        />
      )}

      <div className="flex flex-col gap-4">
        {unlinkedProviders.length > 0 && (
          <WhyLinkCard
            providers={unlinkedProviders}
            lierUrl={(provider) =>
              buildLinkIdentityUrl({
                backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL as string,
                provider,
                next: pathname,
              })
            }
          />
        )}

        {providersActifs.map((provider) => (
          <OidcMethodRow
            key={provider}
            provider={provider}
            identite={identiteParProvider.get(provider)}
            onConfirmDelier={() => unlinkIdentityFromUser({ provider })}
          />
        ))}
        <PasswordRow email={user.email} />
      </div>
    </div>
  );
};

/** Gabarit commun à toutes les méthodes : intitulé, détail, action à droite. */
const ConnectionMethodCard = ({
  dataTest,
  title,
  detail,
  isDetailItalic,
  action,
}: {
  dataTest: string;
  title: string;
  detail?: string;
  isDetailItalic?: boolean;
  action?: React.ReactNode;
}) => (
  <div
    data-test={dataTest}
    className="flex items-center gap-4 rounded-lg border border-grey-3 px-4 py-3"
  >
    <span className="flex-1">
      <span className="block font-bold text-primary-9">{title}</span>
      {detail && (
        <span
          className={cn(
            'block text-xs text-grey-8 mt-0.5',
            isDetailItalic && 'italic'
          )}
        >
          {detail}
        </span>
      )}
    </span>
    {action}
  </div>
);

/** Ligne « Email et mot de passe » de la connexion unifiée. */
const PasswordRow = ({ email }: { email: string }) => (
  <ConnectionMethodCard
    dataTest="profil.methode-connexion.mot-de-passe"
    title={appLabels.methodeEmailMotDePasse}
    detail={`${email} · ${appLabels.methodeMotDePasseActif}`}
  />
);

/**
 * Seul point d'entrée vers le parcours de liaison : les cards de méthode
 * n'affichent que l'état.
 */
const WhyLinkCard = ({
  providers,
  lierUrl,
}: {
  providers: OidcProvider[];
  lierUrl: (provider: OidcProvider) => string;
}) => {
  const trackEvent = useEventTracker();

  return (
    <div
      data-test="profil.methode-connexion.pourquoi-relier"
      className="flex flex-col gap-3 rounded-lg border border-primary-3 bg-primary-1 px-5 py-4"
    >
      <div>
        <div className="font-bold text-primary-9">
          {appLabels.methodeConnexionPourquoiRelierTitre}
        </div>
        <div className="text-sm text-primary-10 mt-0.5">
          {appLabels.methodeConnexionPourquoiRelierMessage}
        </div>
      </div>
      {providers.map((provider) => (
        <ProConnectButton
          key={provider}
          id={`profil-methode-connexion-${provider}-lier`}
          url={lierUrl(provider)}
          dataTest={`profil.methode-connexion.${provider}.lier`}
          onClick={() =>
            trackEvent(Event.auth.oidc.linkClick, {
              provider,
              origine: 'profil',
            })
          }
        />
      ))}
    </div>
  );
};

type OidcMethodRowProps = {
  provider: OidcProvider;
  identite: IdentiteLiee | undefined;
  onConfirmDelier: () => void;
};

/** Card d'état d'une identité OIDC : rattachements et déliaison. */
const OidcMethodRow = ({
  provider,
  identite,
  onConfirmDelier,
}: OidcMethodRowProps) => {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const dataTest = `profil.methode-connexion.${provider}`;

  if (!identite) {
    return (
      <ConnectionMethodCard
        dataTest={dataTest}
        title={OIDC_DISPLAY_NAME}
        detail={appLabels.methodeConnexionAucunCompteLie}
        isDetailItalic
      />
    );
  }

  return (
    <>
      <ConnectionMethodCard
        dataTest={dataTest}
        title={OIDC_DISPLAY_NAME}
        detail={[identite.email, identite.organizationLabel]
          .filter(Boolean)
          .join(' · ')}
        action={
          <Button
            variant="grey"
            size="xs"
            icon="link-unlink"
            onClick={() => setIsConfirmationOpen(true)}
            dataTest={`${dataTest}.delier`}
          >
            {appLabels.methodeConnexionDelier}
          </Button>
        }
      />

      {isConfirmationOpen && (
        <Modal
          openState={{
            isOpen: isConfirmationOpen,
            setIsOpen: setIsConfirmationOpen,
          }}
          title={appLabels.methodeConnexionConfirmerDeliaisonTitre}
          render={() => (
            <Alert
              state="warning"
              description={appLabels.methodeConnexionConfirmerDeliaisonMessage({
                provider: OIDC_DISPLAY_NAME,
              })}
            />
          )}
          renderFooter={({ close }) => (
            <ModalFooterOKCancel
              btnCancelProps={{ onClick: close }}
              btnOKProps={{
                children: appLabels.methodeConnexionDelier,
                onClick: () => {
                  onConfirmDelier();
                  close();
                },
              }}
            />
          )}
        />
      )}
    </>
  );
};
