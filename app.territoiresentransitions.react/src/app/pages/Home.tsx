import React from 'react';
import {signInRedirect} from 'core-logic/api/authRedirect';

function Home() {
  return (
    <section className="max-w-2xl mx-auto p-5">
      <h1 className="fr-h1">À vous de jouer !</h1>

      <p>
        Territoires en Transitions est un outil public gratuit et open-source
        pour les collectivités, financé par l'ADEME. Actuellement à ses débuts,
        la plateforme a besoin de vous pour évoluer dans le sens de vos besoins.
        Rejoignez-nous dans sa co-construction en créant votre compte en moins
        d'une minute.
      </p>

      <div className="flex flex-row-reverse">
        <button className="fr-btn mr-4" onClick={signInRedirect}>
          Se connecter
        </button>
        <a className="fr-btn fr-btn--secondary mr-4" href="/auth/register/">
          Créer un compte
        </a>
      </div>
    </section>
  );
}

export default Home;
