import Image from 'next/image';

import { signInPath, signUpPath } from '@/app/app/paths';
import homeImage from '@/app/app/static/img/home.jpg';
import { Button } from '@tet/ui';

export const HomePage = () => {
  return (
    <section
      data-test="home"
      className="pt-20 bg-gradient-to-b from-primary-1 to-white"
    >
      <div className="flex flex-col items-center max-w-6xl mx-auto px-6 text-center">
        <h1 className="text-primary-9">À vous de jouer !</h1>
        <p className="my-4 text-lg text-primary-10">
          Territoires en Transitions est un service numérique gratuit et open
          source destiné à toutes les collectivités. Que vous soyez engagé ou
          non dans le programme Territoire Engagé Transition Écologique de
          l’ADEME, vous bénéficiez d&apos;un espace de travail collaboratif pour
          piloter l&apos;ensemble de vos plans d&apos;actions et de vos
          indicateurs.
          <br />
          <br />
          Créez votre compte en moins d&apos;une minute, rejoignez le profil de
          votre collectivité et faites vos premiers pas sur la plateforme.
          <br />
          <br />
          Des questions ? Utilisez le chat en bas à droite de votre écran.
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
          <Button href={signUpPath} prefetch={false} variant="outlined">
            Créer un compte
          </Button>
          <Button href={signInPath} prefetch={false}>
            Se connecter
          </Button>
        </div>
        <Image
          className="rounded-t-3xl border-t border-l border-r border-primary-4"
          src={homeImage}
          alt="interface territoires en transition"
        />
      </div>
    </section>
  );
};
