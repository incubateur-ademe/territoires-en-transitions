/**
 * Personnalisation des composants utilisés dans les pages mdx
 */
import Link from 'next/link';

// surcharge les ancres pour ouvrir les liens vers des domaines externes dans un nouvel onglet
/*const A = ({children, href, ...props}: React.ComponentPropsWithoutRef<'a'>) => {
  return !href || href?.startsWith('/') || href?.includes('localhost') ? (
    <Link href={href || ''}>
      <a>{children}</a>
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
};
*/

export function useMDXComponents(components: any) {
  //return {a: A, ...components};
  return components;
}
