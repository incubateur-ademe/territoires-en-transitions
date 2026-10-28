'use client';

import { makeSignInUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useSupabase } from '@tet/api';
import { Alert, Button } from '@tet/ui';
import { useEffect, useState } from 'react';

type ConsentState =
  | { status: 'loading' }
  | { status: 'absent' }
  | { status: 'error' }
  | {
      status: 'ready';
      clientName: string;
      redirectUri: string;
      email: string;
      scopes: string[];
    };

const titleClassName =
  'm-0 text-xl font-bold leading-snug text-balance text-primary-9';

/**
 * Écran de consentement du serveur OAuth 2.1 de Supabase Auth : un client
 * (connecteur MCP de Claude, par exemple) demande à agir au nom de
 * l'utilisateur. Supabase redirige ici avec `authorization_id` ; approuver ou
 * refuser renvoie l'utilisateur vers le client.
 */
export const OauthConsentView = ({
  authorizationId,
}: {
  authorizationId: string | null;
}) => {
  const supabase = useSupabase();
  const [state, setState] = useState<ConsentState>(() =>
    authorizationId ? { status: 'loading' } : { status: 'absent' }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authorizationId) {
      return;
    }

    let cancelled = false;
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.assign(
          makeSignInUrl(`${window.location.pathname}${window.location.search}`)
        );
        return;
      }

      const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(
        authorizationId
      );
      if (cancelled) {
        return;
      }
      if (error || !data) {
        setState({ status: 'error' });
        return;
      }
      // Consentement déjà donné : Supabase renvoie directement vers le client.
      if (!('authorization_id' in data)) {
        window.location.assign(data.redirect_url);
        return;
      }
      setState({
        status: 'ready',
        clientName: data.client.name,
        redirectUri: data.redirect_uri,
        email: data.user.email,
        scopes: data.scope ? data.scope.split(' ').filter(Boolean) : [],
      });
    };
    void load();

    return () => {
      cancelled = true;
    };
  }, [authorizationId, supabase]);

  const decide = async (decision: 'approve' | 'deny') => {
    if (!authorizationId) {
      return;
    }
    setIsSubmitting(true);
    const { error } =
      decision === 'approve'
        ? await supabase.auth.oauth.approveAuthorization(authorizationId)
        : await supabase.auth.oauth.denyAuthorization(authorizationId);
    if (error) {
      setIsSubmitting(false);
      setState({ status: 'error' });
    }
  };

  return (
    <div className="flex justify-center px-4 py-10">
      <div
        className="w-full max-w-lg rounded-xl border border-grey-3 bg-white p-6 shadow-lg md:p-8 flex flex-col gap-4"
        data-test="oauth.consent"
      >
        <h1 className={titleClassName}>{appLabels.oauthConsentTitre}</h1>

        {state.status === 'loading' && (
          <p className="m-0 text-grey-8">{appLabels.oauthConsentChargement}</p>
        )}

        {state.status === 'absent' && (
          <Alert state="info" description={appLabels.oauthConsentAbsent} />
        )}

        {state.status === 'error' && (
          <Alert state="error" description={appLabels.oauthConsentErreur} />
        )}

        {state.status === 'ready' && (
          <>
            <p className="m-0 text-grey-8">
              {appLabels.oauthConsentDescription(state.clientName)}
            </p>
            <p className="m-0 text-sm text-grey-7">
              {appLabels.oauthConsentCompte(state.email)}
            </p>
            {state.scopes.length > 0 && (
              <ul className="m-0 text-sm text-grey-7">
                {state.scopes.map((scope) => (
                  <li key={scope}>{scope}</li>
                ))}
              </ul>
            )}
            <Alert
              state="warning"
              description={appLabels.oauthConsentReserveEquipe}
            />
            <p className="m-0 text-sm text-grey-7">
              {appLabels.oauthConsentRedirection(state.redirectUri)}
            </p>
            <div className="mt-2 flex flex-wrap justify-end gap-3">
              <Button
                variant="outlined"
                dataTest="oauth.consent.deny"
                disabled={isSubmitting}
                onClick={() => decide('deny')}
              >
                {appLabels.oauthConsentRefuser}
              </Button>
              <Button
                dataTest="oauth.consent.approve"
                disabled={isSubmitting}
                onClick={() => decide('approve')}
              >
                {appLabels.oauthConsentAutoriser}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
