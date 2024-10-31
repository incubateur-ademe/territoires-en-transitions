import { signInPath, signUpPath } from '@tet/app/paths';
import { Button } from '@tet/ui';

const Home = () => {
  return (
    <section
      data-test="home"
      className="pt-20 bg-gradient-to-b from-primary-1 to-white"
    >
      <div className="flex flex-col items-center max-w-6xl mx-auto px-6 text-center">
        <h1 className="text-primary-9">À vous de jouer !</h1>
        <p className="mb-0">
          Territoires en Transitions est un outil public gratuit et open-source
          pour les collectivités, financé par l'ADEME.
          <br />
          Actuellement à ses débuts, la plateforme a besoin de vous pour évoluer
          dans le sens de vos besoins.
          <br />
          Rejoignez-nous dans sa co-construction en créant votre compte en moins
          d'une minute.
        </p>
        <Button
          href="https://www.territoiresentransitions.fr/outil-numerique"
          external
          variant="white"
          size="xs"
          className="my-6"
        >
          En savoir plus sur l’outil
        </Button>
        <div className="flex gap-3 mb-12">
          <Button href={signUpPath} variant="outlined">
            Créer un compte
          </Button>
          <Button href={signInPath}>Se connecter</Button>
        </div>
        <img
          className="-mb-8 rounded-t-3xl border-t border-l border-r border-primary-4"
          src="/public/home.png"
          alt="interface territoires en transition"
        />
      </div>
    </section>
  );
};

export default Home;
