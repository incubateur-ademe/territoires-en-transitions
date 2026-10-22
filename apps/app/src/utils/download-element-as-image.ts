import html2canvas from 'html2canvas';

export type ImageFileType = 'png' | 'jpg' | 'jpeg';

export const downloadElementAsImage = async (
  element: HTMLElement,
  fileName: string,
  fileType: ImageFileType
) => {
  const canvas = await html2canvas(element, { scale: 2 });
  const link = document.createElement('a');
  document.body.appendChild(link);
  link.setAttribute('href', canvas.toDataURL(`image/${fileType}`));
  link.setAttribute('download', `${fileName}.${fileType}`);
  link.click();
  link.remove();
};
