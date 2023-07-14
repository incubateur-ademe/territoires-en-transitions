export default function Accueil() {
  return (
    <div className="fr-container-fluid fr-mt-3w fr-mt-md-9w fr-mb-3w fr-mb-md-9w">
      <div className="container fr-container">
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-mb-5w text-center">
            <h2 className="">
              Pilotez efficacement la transition écologique de votre
              collectivité
            </h2>
            <p className="">
              Territoires en Transitions est une plateforme pour accompagner les
              démarches des collectivités engagées en transition écologique sur
              les thématiques climat, air, énergie et économie circulaire.
            </p>
          </div>
        </div>
      </div>

      <div className="container fr-container  ">
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-4 fr-col-lg-4">
            <div className="fr-card fr-card--no-arrow">
              <div className="fr-card__body">
                <h3 className="fr-card__title">
                  Situez-vous par rapport aux référentiels nationaux
                </h3>
                <p className="fr-card__desc fr-text--sm">
                  Évaluez vos politiques économie circulaire et
                  climat-air-énergie et faites labelliser le score de
                  performance de vos actions réalisées.
                </p>
              </div>
              <img
                src="accueil/picto-4.svg"
                title="Titre"
                alt=""
                className=" fr-ratio-1x1"
              />
            </div>
          </div>
          <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-4 fr-col-lg-4 ">
            <div className="fr-card fr-card--no-arrow">
              <div className="fr-card__body">
                <h3 className="fr-card__title">
                  Gérez votre plan d&apos;actions{' '}
                </h3>
                <p className="fr-card__desc fr-text--sm">
                  Créez ou embarquez votre plan d&apos;actions existant dans
                  l&apos;outil. Complétez ou renforcez votre plan avec les
                  actions des référentiels nationaux des programmes
                  climat-air-énergie (Cit&apos;ergie) et économie circulaire.
                </p>
              </div>
              <div className="fr-card__img">
                <img
                  src="accueil/picto-1.svg"
                  title="Titre"
                  alt=""
                  className=" fr-ratio-1x1"
                />
              </div>
            </div>
          </div>
          <div className="Cards fr-col-xs-12 fr-col-sm-12 fr-col-md-4 fr-col-lg-4 ">
            <div className="fr-card fr-card--no-arrow">
              <div className="fr-card__body">
                <h3 className="fr-card__title">Suivez vos indicateurs</h3>
                <p className="fr-card__desc fr-text--sm">
                  Gérez collectivement et facilement la mise à jour des actions
                  et des données. Intégrez vos propres indicateurs et comparez
                  vos résultats aux autres collectivités.
                </p>
              </div>
              <div className="fr-card__img">
                <img
                  src="accueil/picto-2.svg"
                  title="Titre"
                  alt=""
                  className=" fr-ratio-1x1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container fr-container fr-mt-10w ">
        <div className="fr-grid-row fr-grid-row--gutters">
          <h2 className="">A vous de jouer !</h2>
          <p className="">
            Territoires en Transitions est un outil public gratuit et
            open-source pour les collectivités, financé par l&apos;ADEME.
            Actuellement à ses débuts, la plateforme a besoin de vous pour
            évoluer dans le sens de vos besoins. Rejoignez-nous dans sa
            co-construction en créant votre compte en moins d&apos;une minute.
          </p>
        </div>
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center fr-mb-10w">
          <p></p>
          <div className="fr-col-md-3 fr-grid-row fr-grid-row--center">
            <a
              href="https://app.territoiresentransitions.fr/auth/signup"
              className="fr-btn fr-btn"
            >
              Créer un compte
            </a>
          </div>
          <p></p>
        </div>
      </div>

      <div className="container fr-container fr-mt-10w ">
        <div className="fr-grid-row fr-grid-row--gutters">
          <h2 className="">
            Territoires en Transitions - Deux offres complémentaires
          </h2>
          <p className="">
            Renforcez, structurez et valorisez votre projet territorial, suivez
            vos plans d&apos;actions et vos indicateurs sur les dimensions
            Climat, Air, Énergie et Économie Circulaire avec l&apos;appui des
            référentiels nationaux du programme Territoire Engagé Transition
            Écologique,{' '}
            <a
              href="https://territoiresentransitions.fr/"
              rel="external"
              className=""
            >
              https://territoiresentransitions.fr/
            </a>
            .
          </p>
          <p className="">
            Pour en savoir plus sur le programme Territoire Engagé Transition
            Écologique et les labels, rendez-vous sur :{' '}
            <a
              href="https://territoireengagetransitionecologique.ademe.fr/"
              rel="external"
              className=""
            >
              https://territoireengagetransitionecologique.ademe.fr/
            </a>
            .
          </p>
          <p className="">
            Développez une approche collaborative des enjeux de transition
            écologique au-delà des thématiques Climat, Air, Énergie et Économie
            Circulaire (sociaux, environnementaux, économiques) dans votre
            projet de territoire, et accédez à des fonctionnalités de pilotage
            global, avec la plateforme des territoires démonstrateurs de la
            transition écologique,{' '}
            <a
              href="https://territoires-en-transition.ecologie.gouv.fr/"
              rel="external"
              className=""
            >
              https://territoires-en-transition.ecologie.gouv.fr/
            </a>
            .
          </p>
          <h2 className="">Contactez-nous</h2>
          <p className="">
            Nous sommes à votre disposition pour répondre à toutes vos questions
            et écouter vos retours. Contactez nous par mail à{' '}
            <a
              href="mailto:contact@territoiresentransitions.fr?subject=Contact%20via%20territoiresentransitions.fr"
              className=""
            >
              contact@territoiresentransitions.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
