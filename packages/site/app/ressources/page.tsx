'use server';

import Section from '@components/sections/Section';
import {Metadata} from 'next';
import fs from 'fs'
import path from 'path'
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Ressources du programme',
  };
}

type Directory = {
  name: string,
  path: string,
  filenames: string[]
  subDirectory: Directory[]
}


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
        subDirectory: []
      };
      directory.subDirectory.push(subDirectory);
      await fillDirectory(subDirectory);
    } else {
      if (!filePath.endsWith('.md'))
        directory.filenames.push(filePath);
    }
  }
}

export default async function Page() {
  const kit: Directory = {
    name: 'Kit de communication',
    path: path.resolve('./public', 'fichiers/kit de communication'),
    filenames: [],
    subDirectory: []
  };
  const reglement: Directory = {
    name: 'Règlement',
    path: path.resolve('./public', 'fichiers/reglement'),
    filenames: [],
    subDirectory: []
  };

  await fillDirectory(kit);
  await fillDirectory(reglement);

  return (
    <Section>
      <h1 className="fr-header__body">Ressources</h1>
      <Dossier directory={reglement} depth={1}/>
      <Dossier directory={kit} depth={1}/>
    </Section>
  );
}

/**
 * Affiche un dossier et son contenu de façon recursive.
 */
function Dossier({directory, depth}: { directory: Directory, depth: number }) {
  const H = `h${Math.min(depth, 6)}` as keyof JSX.IntrinsicElements;
  const isEmpty = directory.filenames.length === 0;
  const publicPath = path.resolve('./public');

  return <Section key={directory.path}>
    <H>{directory.name}</H>

    {directory.filenames.map((filename, index) => {
      const href = filename.split(publicPath)[1];
      const name = path.basename(filename);
      return <Link key={index} href={href}>{name}</Link>;
    })}

    {directory.subDirectory.map((subdirectory, index) => {
      return <Dossier directory={subdirectory} depth={depth + 1} key={index}/>;
    })}
  </Section>
}
