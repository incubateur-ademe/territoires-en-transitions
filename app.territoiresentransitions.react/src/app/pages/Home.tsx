import {useLocation} from 'react-router-dom';
import {Spacer} from 'ui/shared/Spacer';
import {SignInLink, RegisterLink} from 'ui/shared/Links';
import ResetPasswordForm from './Auth/ResetPasswordForm';

const Home = () => {
  const {hash} = useLocation();
  const {type: _type, access_token} = parseHash(hash);
  // on est en mode récupération de mdp
  if (access_token && _type === 'recovery') {
    return <ResetPasswordForm token={access_token} />;
  }

  return (
    <section data-test="home" className="max-w-2xl mx-auto p-5">
      <h1 className="fr-h1">À vous de jouer !</h1>

      <p>
        Territoires en Transitions est un outil public gratuit et open-source
        pour les collectivités, financé par l'ADEME. Actuellement à ses débuts,
        la plateforme a besoin de vous pour évoluer dans le sens de vos besoins.
        Rejoignez-nous dans sa co-construction en créant votre compte en moins
        d'une minute.
      </p>
      <Spacer />
      <div className="flex flex-row-reverse gap-3">
        <SignInLink />
        <RegisterLink />
      </div>
    </section>
  );
};

// génère un dictionnaire de clé/valeur à partir d'une chaîne de la forme
// #cle=valeur&cle2=val2
type TKeyValues = {[k: string]: string};
const parseHash = (hash: string): TKeyValues =>
  hash
    .substring(1) // saute le # en début de chaîne
    .split('&') // sépare les groupes de clé/valeur
    .reduce((dict, kv) => {
      // ajoute la clé/valeur au dictionnaire
      const [k, v] = kv.split('=');
      return {
        ...dict,
        [k]: v,
      };
    }, {});

export default Home;
