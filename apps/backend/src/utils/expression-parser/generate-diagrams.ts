import { createSyntaxDiagramsCode, CstParser } from 'chevrotain';
import fs from 'fs';

/**
 * Permet de générer la documentation d'un parser sous la forme de diagrammes
 */
export function generateDiagrams(parser: CstParser, dirname: string) {
  fs.writeFileSync(
    `${dirname}/generated-diagrams.html`,
    createSyntaxDiagramsCode(parser.getSerializedGastProductions())
  );
}
