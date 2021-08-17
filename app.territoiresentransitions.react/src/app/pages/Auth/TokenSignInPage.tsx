import {Field, Form, Formik} from 'formik';
import React, {useState} from 'react';
import {
  connected,
  currentAccessToken,
  currentRefreshToken,
  currentUser,
  saveTokens,
} from 'core-logic/api/authentication';

interface TokenFormData {
  accessToken: string;
  refreshToken: string;
}

export const TokenSignInPage = () => {
  const [state, setState] = useState<TokenFormData>({
    accessToken: currentAccessToken() ?? '',
    refreshToken: currentRefreshToken() ?? '',
  });

  const isConnected = connected();
  const user = currentUser();

  const save = (data: TokenFormData) => {
    saveTokens(data.accessToken.trim(), data.refreshToken.trim());
    setState(data);
  };

  return (
    <div className="fr-container">
      <div className="fr-grid-row fr-mb-2w">
        <h1 className="fr-h1">Connexion par token</h1>
        <div>
          Cette action permet d'enregistrer un <pre>AccessToken</pre> collecté
          via sandbox ou la production dans
          <pre>LocalStorage</pre>. Pour cela :
          <ul>
            <li className="fr-pl-2w">
              -{' '}
              <a
                href="https://sandbox.territoiresentransitions.fr/auth/signin"
                target="_blank"
              >
                Se connecter
              </a>
            </li>
            <li className="fr-pl-2w">
              - Puis, récupérer les tokens dans les dev tools sur la réponse de
              l'endpoint
              <pre>v2/auth/token</pre> ou depuis <pre>LocalStorage</pre> et les
              coller dans leschamps suivants.
            </li>
          </ul>
        </div>
      </div>

      <h4>Statut</h4>
      {isConnected && (
        <p>
          <h6>Connecté </h6>
          {user && (
            <p>
              en tant que {user.prenom} {user.nom} ({user.email})
            </p>
          )}
        </p>
      )}
      {!isConnected && <h6>Non connecté</h6>}

      <Formik<TokenFormData> initialValues={state} onSubmit={save}>
        {() => (
          <Form>
            <div className="fr-grid-row">
              <h2 className="fr-h2">Access token</h2>
            </div>
            <Field name="accessToken" as="textarea" />
            <div className="p-5" />
            <div className="fr-grid-row">
              <h2 className="fr-h2">Refresh token</h2>
            </div>
            <Field name="refreshToken" as="textarea" />
            <div className="p-5" />
            <button type="submit">Submit</button>
          </Form>
        )}
      </Formik>
    </div>
  );
};
