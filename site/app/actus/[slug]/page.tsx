import {fetchItem} from 'src/strapi';

import {remark} from 'remark';
import html from 'remark-html';
import {notFound} from 'next/navigation';
import {StrapiItem} from 'src/StrapiItem';
import {StrapiImage} from '@components/strapiImage/StrapiImage';

export default async function Page({params}: {params: {slug: string}}) {
  const id = parseInt(params.slug);
  const actu = await fetchItem('actualites', id, [
    ['populate[0]', 'Couverture'],
    ['populate[1]', 'Sections'],
    ['populate[2]', 'Sections.Image'],
  ]);

  if (!actu) return notFound();

  const processedContent = await remark()
    .use(html)
    .process(`${actu['attributes']['Corps']}`);
  const bodyHtml = processedContent.toString();

  return (
    <div className="fr-container">
      <div className="fr-mt-1w fr-mt-md-4w fr-mb-5w">
        <Actu bodyHtml={bodyHtml} actu={actu} />
      </div>
    </div>
  );
}

function Actu(props: {actu: StrapiItem; bodyHtml: string}) {
  const couverture = props.actu['attributes']['Couverture']['data'];
  const sections = props.actu['attributes'][
    'Sections'
  ] as unknown as SectionContenu[];
  return (
    <div>
      {couverture ? (
        <StrapiImage data={couverture as unknown as StrapiItem} size="small" />
      ) : null}
      <h1 className="fr-title">{`${props.actu['attributes']['Titre']}`}</h1>
      <div dangerouslySetInnerHTML={{__html: props.bodyHtml}} />
      {sections ? sections.map(s => <Section key={s.id} contenu={s} />) : null}
    </div>
  );
}

type SectionContenu = {
  id: number;
  Titre?: string;
  Contenu?: string;
  Image?: {data?: any};
};

const Section = (props: {contenu: SectionContenu}) => {
  const {Titre, Contenu, Image} = props.contenu;
  return (
    <section>
      {Titre ? <h2>{Titre}</h2> : null}
      {Contenu ? <div>{Contenu}</div> : null}
      {Image?.data ? <StrapiImage data={Image.data} size="medium" /> : null}
    </section>
  );
};
