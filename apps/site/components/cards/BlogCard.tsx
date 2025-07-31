import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import Link from 'next/link';
import BlogCardContent from './BlogCardContent';

export type BlogCardProps = {
  title: string;
  date?: Date;
  description?: string;
  image?: StrapiItem | undefined;
  badge?: string;
  categories?: string[];
  href?: string;
  background?: 'light' | 'medium';
  fullHeight?: boolean;
  externalPage?: boolean;
};

const BlogCard = ({ href, externalPage, ...otherProps }: BlogCardProps) => {
  if (!href) return <BlogCardContent {...otherProps} />;

  return (
    <Link
      href={href}
      target={externalPage ? '_blank' : undefined}
      rel={externalPage ? 'noreferrer noopener' : undefined}
      className="bg-none after:hidden"
    >
      <BlogCardContent {...otherProps} href={href} />
    </Link>
  );
};

export default BlogCard;
