import { StyleSheet } from '@react-pdf/renderer';
import { preset } from '../ui-compat';

const { colors } = preset.theme.extend;

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Marianne',
    paddingBottom: '25pt',
  },

  // Header
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '15pt',
    height: '45pt',
    borderBottomWidth: '0.5pt',
    borderBottomColor: colors.primary[5],
    padding: '8pt 25pt 8pt',
    // marginBottom: '12pt',
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
    fontSize: '10pt',
    fontWeight: 'bold',
  },
  subtitle: {
    color: colors.grey[8],
    fontSize: '6pt',
    fontWeight: 'medium',
  },
  pagination: {
    color: colors.primary[8],
    fontSize: '6pt',
    fontWeight: 'bold',
    marginLeft: 'auto',
    marginTop: 'auto',
  },

  // Body
  body: {
    padding: '0pt 25pt',
    fontFamily: 'Marianne',
  },
});
