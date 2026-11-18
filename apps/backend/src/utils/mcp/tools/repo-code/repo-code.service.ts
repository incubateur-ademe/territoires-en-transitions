import { Injectable } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { z } from 'zod';
import { REPO_FULL_NAME } from '../../resources/carte-du-depot.doc';
import { GithubRepoClient, GithubRepoError } from './github-repo.client';
import {
  buildCodeSearchQuery,
  CodeExcerpt,
  DEFAULT_READ_LINES,
  isReadableFile,
  listRepoFolder,
  MAX_READ_LINES,
  MAX_SEARCH_RESULTS,
  normalizeRepoPath,
  RepoListing,
  shortenFragment,
  sliceCode,
} from './repo-code.rules';

export type RepoCodeError = GithubRepoError | 'PATH_NOT_ALLOWED';

export const searchCodeInputSchema = z.object({
  termes: z
    .string()
    .min(2)
    .max(120)
    .describe(
      'Un à trois mots présents dans le code : terme métier français (fiche, mesure, preuve), nom de fonction ou de fichier, ou "texte exact" entre guillemets pour un libellé vu à l\'écran. Tous les mots doivent figurer dans le même fichier : moins il y en a, plus il y a de résultats.'
    ),
  dossier: z
    .string()
    .max(200)
    .optional()
    .describe(
      'Dossier où chercher, pris dans la carte du dépôt (ex. apps/backend/src/plans/fiches). Absent : tout le dépôt.'
    ),
});

export const listRepoFilesInputSchema = z.object({
  dossier: z
    .string()
    .max(200)
    .describe(
      'Dossier à lister (ex. apps/backend/src/plans/fiches) ; chaîne vide pour la racine.'
    ),
  filtre: z
    .string()
    .min(2)
    .max(80)
    .optional()
    .describe(
      'Texte à trouver dans le chemin des fichiers du dossier et de ses sous-dossiers (ex. delete-fiche, .rules.ts, permission).'
    ),
});

export const readCodeInputSchema = z.object({
  chemin: z
    .string()
    .min(1)
    .max(300)
    .describe('Chemin du fichier depuis la racine du dépôt.'),
  debut: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe('Première ligne à lire (défaut : 1).'),
  lignes: z
    .number()
    .int()
    .min(1)
    .max(MAX_READ_LINES)
    .optional()
    .describe(`Nombre de lignes (défaut ${DEFAULT_READ_LINES}).`),
});

export type SearchCodeOutput = {
  total: number;
  resultats: { chemin: string; extraits: string[] }[];
  conseil?: string;
};

export type ReadCodeOutput = CodeExcerpt & { chemin: string; url: string };

/** Recherche, arborescence et lecture du dépôt public, en lecture seule. */
@Injectable()
export class RepoCodeService {
  constructor(private readonly githubRepoClient: GithubRepoClient) {}

  async search(
    input: z.infer<typeof searchCodeInputSchema>
  ): Promise<Result<SearchCodeOutput, RepoCodeError>> {
    const folder = input.dossier ? normalizeRepoPath(input.dossier) : '';
    if (folder === null) {
      return failure('PATH_NOT_ALLOWED');
    }
    const result = await this.githubRepoClient.searchCode(
      buildCodeSearchQuery(input.termes, REPO_FULL_NAME, folder || undefined),
      MAX_SEARCH_RESULTS
    );
    if (!result.success) {
      return result;
    }
    const resultats = result.data.matches
      .filter((match) => isReadableFile(match.path))
      .map((match) => ({
        chemin: match.path,
        extraits: match.fragments.slice(0, 2).map(shortenFragment),
      }));
    return success({
      total: result.data.total,
      resultats,
      ...(resultats.length === 0
        ? {
            conseil:
              'Aucun fichier ne contient tous ces mots : réessayer avec un seul terme métier, ou parcourir le dossier du domaine avec list_repo_files.',
          }
        : {}),
    });
  }

  async list(
    input: z.infer<typeof listRepoFilesInputSchema>
  ): Promise<Result<RepoListing, RepoCodeError>> {
    const folder = normalizeRepoPath(input.dossier);
    if (folder === null) {
      return failure('PATH_NOT_ALLOWED');
    }
    const paths = await this.githubRepoClient.listPaths();
    if (!paths.success) {
      return paths;
    }
    const listing = listRepoFolder(paths.data, folder, input.filtre);
    return listing.totalFichiers === 0 && !input.filtre
      ? failure(
          'FILE_NOT_FOUND',
          new Error(
            `Aucun fichier sous « ${folder} » : vérifier le chemin dans la carte du dépôt`
          )
        )
      : success(listing);
  }

  async read(
    input: z.infer<typeof readCodeInputSchema>
  ): Promise<Result<ReadCodeOutput, RepoCodeError>> {
    const path = normalizeRepoPath(input.chemin);
    if (!path || !isReadableFile(path)) {
      return failure('PATH_NOT_ALLOWED');
    }
    const file = await this.githubRepoClient.readFile(path);
    if (!file.success) {
      return file.error === 'FILE_NOT_FOUND'
        ? failure(
            'FILE_NOT_FOUND',
            new Error(
              `« ${path} » n'existe pas (ou c'est un dossier) : le retrouver avec list_repo_files`
            )
          )
        : file;
    }
    return success({
      chemin: path,
      url: `https://github.com/${REPO_FULL_NAME}/blob/main/${path}`,
      ...sliceCode(file.data, input.debut, input.lignes),
    });
  }
}
