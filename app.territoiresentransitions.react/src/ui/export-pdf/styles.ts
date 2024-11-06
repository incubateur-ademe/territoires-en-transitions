import { Font, StyleSheet } from '@react-pdf/renderer';
import { preset } from '@tet/ui';

const { colors } = preset.theme.extend;

const fontsRepo = `${window.location.origin}/fonts`;
const regularFont = `${fontsRepo}/Marianne-Regular.woff2`;
const regularItalicFont = `${fontsRepo}/Marianne-Regular_Italic.woff2`;
const mediumFont = `${fontsRepo}/Marianne-Medium.woff2`;
const mediumItalicFont = `${fontsRepo}/Marianne-Medium_Italic.woff2`;
const boldFont = `${fontsRepo}/Marianne-Bold.woff2`;
const boldItalicFont = `${fontsRepo}/Marianne-Bold_Italic.woff2`;

Font.register({
  family: 'Marianne',
  fonts: [
    { src: regularFont },
    { src: regularItalicFont, fontStyle: 'italic' },
    { src: mediumFont, fontWeight: 500 },
    { src: mediumItalicFont, fontWeight: 500, fontStyle: 'italic' },
    { src: boldFont, fontWeight: 700 },
    { src: boldItalicFont, fontWeight: 700, fontStyle: 'italic' },
  ],
});

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Marianne',
  },

  // Header
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '15pt',
    height: '60pt',
    borderBottomWidth: '1pt',
    borderBottomColor: colors.primary[5],
    padding: '12pt 25pt',
    marginBottom: '12pt',
  },
  logo: {
    height: '100%',
  },
  titlesBlock: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    color: colors.primary[8],
    fontSize: '12pt',
    fontWeight: 'bold',
  },
  subtitle: {
    color: colors.grey[8],
    fontSize: '7pt',
    fontWeight: 'medium',
  },
  pagination: {
    color: colors.primary[8],
    fontSize: '8pt',
    fontWeight: 'bold',
    marginLeft: 'auto',
  },

  // Body
  body: {
    padding: '0pt 25pt',
    fontFamily: 'Marianne',
  },

  // Footer
  footer: {
    height: '20pt',
    marginTop: 'auto',
  },
});
