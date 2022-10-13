const AdmZip = require('adm-zip');
const fs = require('fs');

/**
 * Expose une fonction permettant de vérifier le contenu d'un zip
 *
 * `expectedFiles` est un tableau contenant une ligne par fichier devant
 * se trouver dans l'archive sous la forme : `[[nom du fichier attendu, contenu attendu], ...]`
 */
module.exports = (on, config) => {
  on('task', {
    validateZip: async ({ filename, expectedFiles, removeAfter }) => {
      const zip = new AdmZip(filename);
      const zipEntries = zip.getEntries();
      const names = zipEntries.map((entry) => entry.entryName);
      const list = names.join(',');
      const expectedList = expectedFiles.map(([name]) => name).join(',');

      // vérifie le nombre de fichiers contenus dans le zip
      if (names.length !== expectedFiles.length) {
        throw new Error(
          `La liste de fichiers "${list}" de l'archive ${filename} n'est pas celle attendue "${expectedList}"`
        );
      }

      // puis le nom et le contenu de chaque fichier
      expectedFiles.forEach(([expectedName, expectedContent]) => {
        if (!names.includes(expectedName)) {
          throw new Error(
            `Le fichier attendu ${expectedName} est manquant dans la liste ${list}`
          );
        }

        const content = zip.readAsText(expectedName).trim();
        if (expectedContent !== content) {
          throw new Error(
            `Le contenu du fichier ${expectedName} "${content}" est différent de celui attendu "${expectedContent}" `
          );
        }
      });

      // supprime le fichier après vérification
      if (removeAfter) {
        fs.rmSync(filename);
      }

      // zip validé !
      return null;
    },
  });
};
