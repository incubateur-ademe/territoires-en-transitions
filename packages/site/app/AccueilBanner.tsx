import classNames from 'classnames';
import Section from '@components/sections/Section';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {StrapiItem} from 'src/strapi/StrapiItem';
import CollectiviteSearch from './CollectiviteSearch';

type AccueilBannerProps = {
  titre: string;
  couverture?: StrapiItem;
};

const AccueilBanner = ({titre, couverture}: AccueilBannerProps) => {
  return (
    <Section
      className={classNames('flex-col', {
        'lg:flex-col': !couverture,
        'lg:flex-row': !!couverture,
      })}
    >
      <div
        className={classNames('mb-8 lg:mb-0 mr-0', {
          'lg:mr-10 xl:mr-20': !!couverture,
        })}
      >
        <h1 className="text-[2.5rem]">{titre}</h1>
        <p>Quelles sont les prochaines étapes pour ma collectivité ?</p>
        <CollectiviteSearch />
        <a
          href="/programme#carte"
          className="fr-link fr-icon-arrow-right-line fr-link--icon-right"
        >
          Voir la carte de toutes les collectivités
        </a>
      </div>
      {!!couverture && (
        <StrapiImage
          data={couverture}
          className="w-full mx-auto"
          containerClassName="w-full lg:w-3/5 xl:w-2/5 min-w-[350px]"
          displayCaption={false}
        />
      )}
    </Section>
  );
};

export default AccueilBanner;
