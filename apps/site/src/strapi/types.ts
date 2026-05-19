import { Attributes, StrapiItem } from './StrapiItem';

export type ImageGetData = {
  id: number;
  name: string;
  alternativeText?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  formats?: Attributes['formats'];
  hash: string;
  ext?: string;
  mime?: string;
  size?: number;
  sizeInBytes?: number;
  url?: string;
  previewUrl?: string | null;
  path?: string | null;
  provider?: string;
  provider_metadata?: Record<string, unknown> | null;
  isUrlSigned?: boolean;
  folder?: number | string | null;
  folderPath?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  updatedBy?: number;
};

export type StrapiImageData = StrapiItem | ImageGetData;
