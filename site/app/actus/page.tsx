import {fetchCollection} from 'src/strapi';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {StrapiItem} from 'src/StrapiItem';

export default async function Page() {
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

function Actu(actu: StrapiItem) {
  return (
    <div key={actu['id']} className="fr-grid-row fr-mb-3w">
      <div className="fr-col fr-col-md-6">
        <div className="fr-card fr-enlarge-link">
          <div className="fr-card__body">
            <div className="fr-card__content">
              <h3 className="fr-card__title">
                <a
                  href={`/actus/${actu['id']}`}
                >{`${actu['attributes']['Titre']}`}</a>
              </h3>

              <p className="fr-card__desc">{`${actu['attributes']['Corps']}`}</p>
            </div>
          </div>
          <div className="fr-card__header">
            {actu['attributes']['Couverture'] ? (
              <div className="fr-card__img">
                <StrapiImage
                  data={
                    actu['attributes']['Couverture'][
                      'data'
                    ] as unknown as StrapiItem
                  }
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
