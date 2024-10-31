// enregistre un blob dans un fichier
export const saveBlob = async (blob: Blob, filename: string) => {
  // crée une URL avec les données du blob
  const href = URL.createObjectURL(blob);

  // crée un élément lien invisible dans le DOM
  var a = document.createElement('a');

  // rattache le contenu à sauvegarder sous forme de fichier
  a.href = href;
  a.download = filename;

  document.body.appendChild(a);

  // déclenche le téléchargement puis supprime le lien
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(href);
    document.body.removeChild(a);
  }, 0);
};
