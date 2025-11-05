import { htmlToText as htmlToTextBase } from 'html-to-text';

export function htmlToText(
  html: string,
  options: { wordwrap: number | false } = { wordwrap: false }
) {
  return htmlToTextBase(html.replaceAll('\n', '<br />'), options);
}


