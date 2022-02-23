// expose les variables d'environnement pour le plugin vscode "httpyac"
//
// nécessite la présence d'un fichier http-client.env.json copié et complété à
// partir de http-client.sample.json

const environments = require('./http-client.env.json');

module.exports = {
  environments,
};
