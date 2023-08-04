import {fetchItem} from 'src/strapi';

import {remark} from 'remark';
import html from 'remark-html';
import {notFound} from 'next/navigation';
import {StrapiItem} from 'src/StrapiItem';
import {StrapiImage} from '@components/strapiImage/StrapiImage';

export default async function Page({params}: {params: {slug: string}}) {
  const id = parseInt(params.slug);
  const data = await fetchItem('actualites', id);

  if (!data) return notFound();

  return (
    <div className="fr-container">
      <div className="fr-mt-1w fr-mt-md-4w fr-mb-5w">
        {/* @ts-expect-error Async Server Component */}
        <Actu actu={data} />
      </div>
    </div>
  );
}

async function Actu(props: {actu: StrapiItem}) {
  const actu = props.actu;
  const processedContent = await remark()
    .use(html)
    .process(`${actu['attributes']['Corps']}`);
  const contentHtml = processedContent.toString();

  return (
    <div>
      <StrapiImage
        data={actu['attributes']['Couverture']['data'] as unknown as StrapiItem}
        size="small"
      />
      <h1 className="fr-title">{`${actu['attributes']['Titre']}`}</h1>
      <div dangerouslySetInnerHTML={{__html: contentHtml}} />
    </div>
  );
}
