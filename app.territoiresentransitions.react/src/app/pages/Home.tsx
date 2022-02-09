import {Spacer} from 'ui/shared/Spacer';
import {SignInLink, RegisterLink} from 'ui/shared/Links';

const Home = () => {
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

export default Home;
