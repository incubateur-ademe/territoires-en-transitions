import {fetchCollection} from 'app/strapi';
import {StrapiImage} from 'app/StrapiImage';

export default async function Actus() {
  const data = await fetchCollection('actualites');

  return (
    <div className="fr-container">
      <div className="fr-mt-1w fr-mt-md-4w fr-mb-5w">
        <h1 className="fr-header__body">Actualités</h1>
        {data.map(actu => Actu(actu))}
      </div>
    </div>
  );
}

function Actu(actu: JSON) {
  return (
    <div key={actu['id']} className="fr-grid-row fr-mb-3w">
      <div class="fr-col fr-col-md-6">
        <div class="fr-card fr-enlarge-link">
          <div class="fr-card__body">
            <div class="fr-card__content">
              <h3 class="fr-card__title">
                <a href="#">{actu['attributes']['Titre']}</a>
              </h3>

              <p class="fr-card__desc">{actu['attributes']['Corps']}</p>
            </div>
          </div>
          <div class="fr-card__header">
            {actu['attributes']['Couverture'] ? (
              <div class="fr-card__img">
                <StrapiImage
                  data={actu['attributes']['Couverture']['data']}
                  size="small"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
