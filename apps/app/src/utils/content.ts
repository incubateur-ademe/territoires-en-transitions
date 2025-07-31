/**
 * Returns the content with modified anchors so links are opened in a new tab.
 * @param content
 */
export const addTargetToContentAnchors = (content: string) =>
  content.replaceAll('href', 'target="_blank" href');
