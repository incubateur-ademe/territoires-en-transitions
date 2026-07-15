// Petits partagés de l'interface : rendu htm (syntaxe quasi-JSX dans du .mts
// pur — le type-stripping de node n'exécute pas de JSX, htm nous en passe),
// barre d'aide, ouverture d'URL dans le navigateur de l'hôte.
// htm/react = htm.bind(createElement) pré-lié, et ses types passent nodenext
// (le default export de htm nu est typé CJS et casse sous tsc).
import { spawn } from 'node:child_process';
import { html } from 'htm/react';
import { Text } from 'ink';
import type { ReactNode } from 'react';

export { html };

// truncate-end : une barre qui déborde est tronquée, jamais repliée sur deux
// rangées (ça décalerait la hauteur fixe du layout).
export const HelpBar = ({ children }: { children?: ReactNode }) =>
  html`<${Text} dimColor wrap="truncate-end"> ${children}<//>`;

export const openUrl = (url: string): void => {
  spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], {
    detached: true,
    stdio: 'ignore',
  }).unref();
};
