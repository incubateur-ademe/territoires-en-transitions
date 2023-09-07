import classNames from 'classnames';
import Section from '@components/sections/Section';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {StrapiItem} from 'src/strapi/StrapiItem';

type AccueilBannerProps = {
  titre: string;
  couverture?: StrapiItem;
};

const AccueilBanner = ({titre, couverture}: AccueilBannerProps) => {
  return (
    <Section className="flex-col lg:flex-row">
      <div
        className={classNames('mb-8 lg:mb-0', {
          'lg:mr-10 xl:mr-20': !!couverture,
        })}
      >
        <h1>{titre}</h1>
        {/* <p>Quelles sont les prochaines étapes pour ma collectivité ?</p>
      <SearchInput
        id="collectivite"
        placeholder="Rechercher un EPCI, un syndicat, une commune, un PETR, un EPT"
      />
      <a
        href="/programme#carte"
        className="fr-link fr-icon-arrow-right-line fr-link--icon-right"
      >
        Voir la carte de toutes les collectivités
      </a> */}
        <p>
          Territoires en Transitions est une plateforme pour accompagner les
          démarches des collectivités engagées en transition écologique.
        </p>
      </div>
      {!!couverture && (
        <StrapiImage
          data={couverture}
          className="w-auto mx-auto"
          containerClassName="w-full lg:w-3/5 xl:w-2/5 min-w-[350px]"
          displayCaption={false}
        />
      )}
    </Section>
  );
};

export default AccueilBanner;
