import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './styles';

type DocumentToExportProps = {
  content: JSX.Element | JSX.Element[];
};

const Header = () => (
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
);

const DocumentToExport = ({ content }: DocumentToExportProps) => {
  return (
    <Document>
      {Array.isArray(content) ? (
        content.map((c, index) => (
          <Page key={index} size="A4" style={styles.page}>
            {/* Header */}
            <Header />

            {/* Body */}
            <View style={styles.body}>{c}</View>
          </Page>
        ))
      ) : (
        <Page size="A4" style={styles.page}>
          {/* Header */}
          <Header />

          {/* Body */}
          <View style={styles.body}>{content}</View>
        </Page>
      )}
    </Document>
  );
};

export default DocumentToExport;
