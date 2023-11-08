import {Metadata} from 'next';

export const getUpdatedMetadata = (
  metadata: Metadata,
  newData: {
    title?: string;
    description?: string;
    image?: {
      url: string;
      width: number;
      height: number;
      type: string;
      alt: string;
    };
  },
) => {
  return {
    title: newData.title ?? metadata.title,
    description: newData.description ?? metadata.description,
    viewport: metadata.viewport,
    icons: metadata.icons,
    robots: metadata.robots,
    twitter: metadata.twitter,
    openGraph: {
      ...metadata.openGraph,
      title: newData.title ?? metadata.openGraph?.title,
      description: newData.description ?? metadata.openGraph?.description,
      images: newData.image ?? metadata.openGraph?.images,
    },
  };
};
