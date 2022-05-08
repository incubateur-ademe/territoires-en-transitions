import {useState} from 'react';
import {LabellisationDemandeRead} from 'generated/dataLayer/labellisation_demande_read';
import {labellisationDemandeWriteEndpoint} from 'core-logic/api/endpoints/LabellisationDemandeWriteEndpoint';
import {LabellisationDemandeWrite} from 'generated/dataLayer/labellisation_demande_write';

export const useEnvoiDemande = () => {
  const [isLoading, setIsLoading] = useState(false);

  const envoiDemande = async (
    demande: LabellisationDemandeRead
  ): Promise<LabellisationDemandeWrite | null> => {
    setIsLoading(true);
    const reply = await labellisationDemandeWriteEndpoint.save({
      ...demande,
      en_cours: false,
    });
    setIsLoading(false);
    return reply;
  };

  return {
    isLoading,
    envoiDemande,
  };
};
