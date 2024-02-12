'use server';

const LandingPage = async () => {
  return (
    <main>
      <h1>Panier action impact</h1>
      <p>
        Pour créer un nouveau panier sans lien avec aucune collectivité :
      </p>
      <pre>/landing</pre>
      <p>
        Pour créer un nouveau panier pour une collectivité, ou revenir sur le panier récent créé pour cette collectivité :
      </p>
      <pre>/landing/collectivite/[collectivite_id]</pre>
      <p>
        Pour revenir sur un panier existant :
      </p>
      <pre>/panier/[panier_id]</pre>
    </main>
  );
};

export default LandingPage;
