import {remark} from 'remark';
import html from 'remark-html';

export const processMarkedContent = async (content: string) => {
  const processedContent = await remark().use(html).process(`${content}`);
  return processedContent.toString();
};
