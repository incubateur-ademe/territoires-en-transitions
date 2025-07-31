import { Metadata } from 'next';

export const getUpdatedMetadata = (
  metadata: Metadata,
  newData: {
    title?: string;
    networkTitle?: string;
    description?: string;
    image?: {
      url: string;
      width: number;
      height: number;
      type: string;
      alt: string;
    };
  }
) => {
  return {
    title: newData.title ?? metadata.title,
    description: newData.description ?? metadata.description,
    robots: metadata.robots,
    twitter: metadata.twitter,
    openGraph: {
      ...metadata.openGraph,
      title: newData.networkTitle ?? metadata.openGraph?.title,
      description: newData.description ?? metadata.openGraph?.description,
      images: newData.image ?? metadata.openGraph?.images,
    },
  };
};
