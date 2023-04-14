/**
 * Télécharge un élément canvas en fichier de format png | jpg | jpeg
 *
 * @param canvas HTMLCanvasElement
 * @param fileName string
 * @param type 'png' | 'jpg' | 'jpeg'
 */

export const downloadFromCanvas = (
  canvas: HTMLCanvasElement,
  fileName: string,
  type: 'png' | 'jpg' | 'jpeg'
) => {
  const dataUrl = canvas.toDataURL(`image/${type}`);
  const link = document.createElement('a');
  document.body.appendChild(link);
  link.setAttribute('href', dataUrl);
  link.setAttribute('download', `${fileName}.${type}`);
  link.click();
  link.remove();
};
