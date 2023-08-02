const baseURL = process.env.NEXT_PUBLIC_STRAPI_URL;

type Size = 'large' | 'medium' | 'small' | 'thumbnail';

type ImageData = {
  id: number;
  attributes: Attributes;
};
type Attributes = {[key: string]: Attributes};

export function StrapiImage(props: {data: ImageData; size: Size}) {
  const attributes = props.data['attributes'];

  return (
    <img
      className="fr-responsive-img"
      src={`${baseURL}${attributes['formats'][props.size]['url']}`}
      alt={`${attributes['alternativeText']}`}
    />
  );
}
