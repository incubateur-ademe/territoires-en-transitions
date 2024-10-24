import { Font, StyleSheet } from '@react-pdf/renderer';
import { preset } from '@tet/ui';

const { colors } = preset.theme.extend;

Font.register({
  family: 'Marianne',
  fonts: [
    { src: '/Marianne-Regular.woff2' },
    { src: '/Marianne-Regular_Italic.woff2', fontStyle: 'italic' },
    { src: '/Marianne-Medium.woff2', fontWeight: 500 },
    {
      src: '/Marianne-Medium_Italic.woff2',
      fontWeight: 500,
      fontStyle: 'italic',
    },
    { src: '/Marianne-Bold.woff2', fontWeight: 700 },
    {
      src: '/Marianne-Bold_Italic.woff2',
      fontWeight: 700,
      fontStyle: 'italic',
    },
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
