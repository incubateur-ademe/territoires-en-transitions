import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import { JSX } from 'react';
import { styles } from './styles';

export type ImageSources = {
  repFrancaiseLogo: string;
  ademeLogo: string;
};

const defaultImageSources: ImageSources = {
  repFrancaiseLogo: '/repFrancaiseLogo.png',
  ademeLogo: '/ademeLogo.png',
};

type DocumentToExportProps = {
  content: JSX.Element | JSX.Element[];
  imageSources?: ImageSources;
};

const Header = ({ imageSources = defaultImageSources }: { imageSources?: ImageSources }) => (
  <View fixed style={styles.header}>
    {/* Logos */}
    <Image src={imageSources.repFrancaiseLogo} style={styles.logo} />
    <Image src={imageSources.ademeLogo} style={styles.logo} />

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

const DocumentToExport = ({ content, imageSources }: DocumentToExportProps) => {
  return (
    <Document>
      {Array.isArray(content) ? (
        content.map((c, index) => (
          <Page key={index} size="A4" style={styles.page}>
            <Header imageSources={imageSources} />
            <View style={styles.body}>{c}</View>
          </Page>
        ))
      ) : (
        <Page size="A4" style={styles.page}>
          <Header imageSources={imageSources} />
          <View style={styles.body}>{content}</View>
        </Page>
      )}
    </Document>
  );
};

export default DocumentToExport;
