import {fetchItem} from 'src/strapi';

import {remark} from 'remark';
import html from 'remark-html';
import {notFound} from 'next/navigation';
import {StrapiItem} from 'src/StrapiItem';
import {StrapiImage} from '@components/strapiImage/StrapiImage';

export default async function Page({params}: {params: {slug: string}}) {
  const id = parseInt(params.slug);
  const actu = await fetchItem('actualites', id);

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
  return (
    <div>
      <StrapiImage
        data={
          props.actu['attributes']['Couverture'][
            'data'
          ] as unknown as StrapiItem
        }
        size="small"
      />
      <h1 className="fr-title">{`${props.actu['attributes']['Titre']}`}</h1>
      <div dangerouslySetInnerHTML={{__html: props.bodyHtml}} />
    </div>
  );
}
