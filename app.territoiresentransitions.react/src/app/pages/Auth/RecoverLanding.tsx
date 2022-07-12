import {useState} from 'react';
import {useQuery} from 'react-query';
import {useHistory} from 'react-router-dom';
import {ENV} from 'environmentVariables';
import {supabaseClient} from 'core-logic/api/supabase';
import {resetPwdPath, resetPwdToken} from 'app/paths';

/**
 * Réponse de l'appel à la fonction verify de gotrue.
 */
type VerifyResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

/**
 * Permet de s'authentifier avec un recovery token.
 *
 * Consomme le recovery token et authentifie l'utilisateur.
 *
 * Port d'une fonction présente dans lib gotrue-js
 * mais absente de la version supabase.
 *
 * @param token: recovery token provenant du mail.
 * @returns un access token.
 */
async function recover(token: String): Promise<VerifyResponse> {
  const url = `${ENV.supabase_url!}/auth/v1/verify`;
  const type = 'recovery';
  const body = JSON.stringify({token, type});

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ENV.supabase_anon_key!,
    },
    body,
  });
  const data = await response.json();
  // supabaseClient.auth.setAuth(data.access_token); ne fonctionne pas.
  // fixme va sans doute être redirigée.
  await supabaseClient.auth.signIn({refreshToken: data.refresh_token});
  return data;
}

/**
 * Consomme le recovery token pour obtenir un auth token.
 * Affiche le statut de la vérification du token.
 */
const Recovery = ({token}: {token: string}) => {
  const history = useHistory();
  const {isError, data} = useQuery(['recover', token], () => recover(token));

  if (data) {
    history.push(resetPwdPath.replace(`:${resetPwdToken}`, data.access_token));
  }

  if (isError) {
    return <span>Une erreur est survenue</span>;
  }

  return <span>Vérification en cours</span>;
};

/**
 * Oblige l'utilisateur à cliquer sur un bouton
 * pour que le renouvellement du mot de passe puisse avoir lieu.
 *
 * Empêche les robots qui visitent le lien du mail de consommer le
 * recovery token.
 *
 * @param token: recovery token provenant du mail.
 */
const RecoverLanding = ({token}: {token: string}) => {
  const [recovering, setRecovering] = useState<boolean>(false);

  if (recovering) return <Recovery token={token} />;
  return (
    <section className="max-w-2xl mx-auto p-5">
      <h2 className="fr-h2 flex justify-center">Changer de mot de passe</h2>
      <p>Vous avez demandé le renouvellement de votre mot de passe.</p>
      <button
        className="fr-btn"
        data-test="Recovering"
        onClick={() => setRecovering(true)}
      >
        Changer de mot de passe
      </button>
    </section>
  );
};

export default RecoverLanding;
