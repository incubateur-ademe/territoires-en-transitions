import {authBloc, AuthBloc} from 'core-logic/observables';
import {observer} from 'mobx-react-lite';
import {Link} from 'react-router-dom';
import {
  allCollectivitesPath,
  myCollectivitesPath,
  signInPath,
  signUpPath,
} from 'app/paths';

const ConnexionSwitchLink = observer(({bloc}: {bloc: AuthBloc}) => {
  if (bloc.connected)
    return (
      <Link
        className="fr-link"
        data-test="logoutBtn"
        to={signUpPath}
        onClick={() => {
          bloc.disconnect();
        }}
      >
        <div className="fr-fi-account-line m-1"></div>
        Se déconnecter
      </Link>
    );
  return (
    <Link data-test="signin" className="fr-link" to={signInPath}>
      <div className="fr-fi-account-line m-1"></div>
      Se connecter
    </Link>
  );
});

const HeaderNavigation = () => {
  return (
    <div className="fr-header__tools">
      <div className="fr-header__tools-links">
        <ul className="fr-links-group">
          {authBloc.connected && (
            <>
              <Link className="fr-link" to={myCollectivitesPath}>
                Mes collectivités
              </Link>
              <Link className="fr-link" to={allCollectivitesPath}>
                Toutes les collectivités
              </Link>
            </>
          )}
          <ConnexionSwitchLink bloc={authBloc} />
        </ul>
      </div>
    </div>
  );
};

export default HeaderNavigation;
