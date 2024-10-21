import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import Html from 'react-pdf-html';
import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './documentStyles';

/** Transform our react component to string html */
const getHtmlString = (htmlElement: JSX.Element) => {
  const div = document.createElement('div');
  const root = createRoot(div);

  flushSync(() => root.render(htmlElement));

  const htmlString = div.innerHTML;
  div.remove();

  return htmlString;
};

type DocumentToExportProps = {
  content: JSX.Element;
};

const DocumentToExport = ({ content }: DocumentToExportProps) => {
  const htmlString = getHtmlString(content);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View fixed style={styles.header}>
          {/* Logos */}
          <Image src="/repFrancaiseLogo.png" style={styles.logo} />
          <Image src="/ademeLogo.png" style={styles.logo} />

          {/* Titles */}
          <View style={styles.titlesBlock}>
            <Text style={styles.title}>Territoires en transitions</Text>
            <Text style={styles.subtitle}>
              Accompagner la transition écologique des collectivités
            </Text>
          </View>

          {/* Pagination */}
          <View style={styles.pagination}>
            <Text
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber}/${totalPages}`
              }
            />
          </View>
        </View>

        {/* Body */}
        {/* <Html/> allows us to transform string html into components readable by react-pdf */}
        <Html style={styles.body}>{htmlString}</Html>

        {/* Footer */}
        <View fixed style={styles.footer} />
      </Page>
    </Document>
  );
};

export default DocumentToExport;
