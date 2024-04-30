import {Spacer} from 'ui/dividers/Spacer';
import {SignInLink, RegisterLink} from 'ui/shared/Links';

const Home = () => {
  return (
    <section data-test="home" className="max-w-2xl mx-auto p-5">
      <h1 className="fr-h1">À vous de jouer !</h1>

      <p>
        Territoires en Transitions est un service numérique gratuit et
        open-source qui s’adresse à toutes les collectivités. Créez votre compte
        en moins d'une minute et rejoignez le profil de votre collectivité. Une
        question ? Utilisez le chat en bas à droite de votre écran !
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
