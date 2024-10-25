import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './documentStyles';

type DocumentToExportProps = {
  content: JSX.Element;
};

const DocumentToExport = ({ content }: DocumentToExportProps) => {
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
        <View style={styles.body}>{content}</View>

        {/* Footer */}
        <View fixed style={styles.footer} />
      </Page>
    </Document>
  );
};

export default DocumentToExport;
