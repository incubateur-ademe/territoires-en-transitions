import Section from '@/site/components/sections/Section';
import fs from 'fs';
import { Metadata } from 'next';
import Link from 'next/link';
import path from 'path';
import Markdown from 'react-markdown';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Ressources du programme',
  };
}

type Directory = {
  name: string;
  path: string;
  markdown?: string;
  filenames: string[];
  subDirectory: Directory[];
};

// La solution telle que préconisée dans la doc https://vercel.com/guides/loading-static-file-nextjs-api-route
// ne fonctionne pas dans le container, `process.cwd()` pointant alors vers `/app`.
// On utilise une variable d'environnement pour contourner le problème, voir `+site-build`
const publicPath =
  process.env.PUBLIC_PATH ?? path.join(process.cwd(), './public');

/**
 * Remplit un objet Directory avec ses fichiers et ses sous-dossiers.
 *
 * @param {Directory} directory - Le Directory à remplir
 * @return {Promise<void>} - La Promesse qui se résout une fois le Directory remplit
 */
async function fillDirectory(directory: Directory) {
  const files = fs.readdirSync(directory.path);
  files.sort();

  for (const file of files) {
    const filePath = path.join(directory.path, file);
    if (fs.statSync(filePath).isDirectory()) {
      const subDirectory: Directory = {
        name: file,
        path: filePath,
        filenames: [],
        subDirectory: [],
      };
      directory.subDirectory.push(subDirectory);
      await fillDirectory(subDirectory);
    } else {
      if (filePath.endsWith('.md')) {
        const markdown = fs.readFileSync(filePath, 'utf8');
        directory.markdown = markdown;
      } else {
        directory.filenames.push(filePath);
      }
    }
  }
}

export default async function Page() {
  const kit: Directory = {
    name: 'Kit de communication',
    path: path.join(publicPath, 'fichiers/kit_de_communication'),
    filenames: [],
    subDirectory: [],
  };
  const reglement: Directory = {
    name: 'Règlement',
    path: path.join(publicPath, 'fichiers/reglement'),
    filenames: [],
    subDirectory: [],
  };

  await fillDirectory(kit);
  await fillDirectory(reglement);

  return (
    <Section>
      <h1 className="pb-8">Ressources</h1>
      <Dossier directory={reglement} depth={1} />
      <Dossier directory={kit} depth={1} />
    </Section>
  );
}

/**
 * Affiche un dossier et son contenu de façon recursive.
 */
function Dossier({
  directory,
  depth,
}: {
  directory: Directory;
  depth: number;
}) {
  const H = `h${Math.min(depth + 1, 6)}` as keyof JSX.IntrinsicElements;

  return (
    <div key={directory.path} className="flex flex-col">
      {directory.markdown ? (
        <Markdown>{directory.markdown}</Markdown>
      ) : (
        <H>{directory.name}</H>
      )}

      {directory.filenames.length > 0 && (
        <div className="flex flex-col gap-1 pb-12">
          {directory.filenames.map((filename, index) => {
            const relHref = filename.split(publicPath)[1];
            const sanitizedHref = sanitizeHref(relHref);
            const name = path.basename(filename);
            return (
              <Link
                key={index}
                href={sanitizedHref}
                className="bg-none underline underline-offset-4"
              >
                {name}
              </Link>
            );
          })}
        </div>
      )}

      <div className="pl-6">
        {directory.subDirectory.map((subdirectory, index) => {
          return (
            <Dossier directory={subdirectory} depth={depth + 1} key={index} />
          );
        })}

// Simple sanitizer: ensures href is URI encoded, and prevents dangerous protocols.
function sanitizeHref(href: string): string {
  // Trim leading/trailing whitespace
  let safeHref = href.trim();
  // Prevent dangerous protocols
  if (/^(javascript:|data:|vbscript:)/i.test(safeHref)) {
    return "#";
  }
  // Encode URI component, but keep '/' for relative paths
  safeHref = safeHref
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
  // If original path started with '/', keep it
  if (href.startsWith('/')) safeHref = '/' + safeHref.replace(/^\/+/, '');
  return safeHref;
}
      </div>
    </div>
  );
}
