import {useQuery} from 'react-query';
import {MIME_XLSX} from './config';

/** Fourni le modèle de fichier nécessaire à l'export des scores pendant l'audit */
export const useExportTemplate = (referentiel: string | null) =>
  useQuery(
    ['export_audit_template', referentiel],
    async () => {
      if (!referentiel) {
        return null;
      }
      const response = await fetch(
        `${process.env.PUBLIC_URL}/export_audit_${referentiel}.xlsx`,
        {
          headers: {
            'Content-Type': MIME_XLSX,
            Accept: MIME_XLSX,
          },
        }
      );
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        return buffer;
      }
      return null;
    },
    {
      // on ne charge les données que lors d'un appel explicite à `refetch`
      enabled: false,
      // et on évite les rechargements automatiques
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );
