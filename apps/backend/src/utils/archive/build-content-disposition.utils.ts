const toExtValue = (filename: string): string =>
  encodeURIComponent(filename).replace(
    /['()*!]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );

export const buildAttachmentContentDisposition = (filename: string): string =>
  `attachment; filename*=UTF-8''${toExtValue(filename)}`;
