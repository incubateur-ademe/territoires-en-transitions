const DescriptionCouts = () => {
  return (
    <>
      <h5 className="mb-10">Description des catégories de coût</h5>
      <div className="flex flex-col gap-10">
        <div>
          <h4 className="text-primary-9 mb-1">
            Produit, Design, Développement, Déploiement
          </h4>
          <p className="paragraphe-16 text-primary-11 mb-0">
            Les coûts Produit, Design, Développement et Déploiement représentent
            la grande majorité de notre budget. Territoires en Transitions est
            constitué d’une petite équipe de freelances (membres visibles sur la
            page de présentation du service), pluridisciplinaires aussi bien sur
            les aspects techniques, stratégiques et métiers.
          </p>
        </div>
        <div>
          <h4 className="text-primary-9 mb-1">Logiciels et Services</h4>
          <p className="paragraphe-16 text-primary-11 mb-0">
            Notre modèle open-source nous permet d’accéder gratuitement à la
            majorité des outils que nous utilisons (hébergement de code,
            serveurs de tests, etc.). L’équipe travaille quasiment exclusivement
            en distanciel (télétravail). Une partie des prestations de services
            servent aux séminaires de travail de l’équipe répartie sur
            l’ensemble du territoire national et qui se réunit une fois par
            trimestre pour travailler en présentiel.
          </p>
        </div>
      </div>
    </>
  );
};

export default DescriptionCouts;
