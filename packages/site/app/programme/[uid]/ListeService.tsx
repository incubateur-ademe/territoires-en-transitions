import Section from '@tet/site/components/sections/Section';
import { ListeData } from './types';
import classNames from 'classnames';
import Markdown from '@tet/site/components/markdown/Markdown';
import ThumbnailsList from '@tet/site/components/galleries/ThumbnailsList';
import ListeVerticaleService from './ListeVerticaleService';
import ListeGrilleService from './ListeGrilleService';
import ListeGallerieService from './ListeGallerieService';

const ListeService = ({
  tailleListe,
  titre,
  sousTitre,
  introduction,
  dispositionCartes,
  liste,
}: ListeData) => {
  const Titre = (
    tailleListe === 'md' ? 'h2' : 'h1'
  ) as keyof JSX.IntrinsicElements;

  return (
    <Section
      containerClassName={classNames({
        'bg-primary-1':
          dispositionCartes === 'Grille' || dispositionCartes === 'Vignettes',
        '!py-24': dispositionCartes === 'Vignettes',
      })}
      className={classNames({ '!gap-12': dispositionCartes === 'Verticale' })}
    >
      <div className="flex flex-col gap-4">
        <Titre
          className={classNames('mb-0', {
            'text-center': dispositionCartes === 'Vignettes',
            'mb-8': dispositionCartes === 'Vignettes' && !sousTitre,
          })}
        >
          {titre}
        </Titre>
        {!!sousTitre && (
          <h3
            className={classNames('text-primary', {
              'mb-0': dispositionCartes !== 'Vignettes' || !!introduction,
              'text-center': dispositionCartes === 'Vignettes',
              'mb-8 ': dispositionCartes === 'Vignettes' && !introduction,
            })}
          >
            {sousTitre}
          </h3>
        )}
        {!!introduction && (
          <Markdown
            texte={introduction}
            className={classNames('-mb-6', {
              'paragraphe-22': tailleListe === 'lg' || !tailleListe,
              'paragraphe-18': tailleListe === 'md',
              'mb-8 text-center': dispositionCartes === 'Vignettes',
            })}
          />
        )}
      </div>

      {/* Liste de cartes sous forme de masonry gallery */}
      {dispositionCartes === 'Gallerie' && (
        <ListeGallerieService liste={liste} />
      )}

      {/* Liste de cartes sous forme de grille */}
      {dispositionCartes === 'Grille' && <ListeGrilleService liste={liste} />}

      {/* Liste de cartes alignées verticalement */}
      {dispositionCartes === 'Verticale' && (
        <ListeVerticaleService liste={liste} />
      )}

      {/* Liste de vignettes alignées horizontalement */}
      {dispositionCartes === 'Vignettes' && (
        <ThumbnailsList
          thumbnails={liste.slice(0, 4).map((l) => ({ ...l, legend: l.texte }))}
        />
      )}
    </Section>
  );
};

export default ListeService;
