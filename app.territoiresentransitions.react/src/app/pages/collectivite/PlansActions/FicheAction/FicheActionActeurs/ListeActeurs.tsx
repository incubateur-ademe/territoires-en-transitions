type ListeActeursProps = {
  titre: string;
  liste: string[] | undefined;
  picto: (className: string) => React.ReactNode;
};

const ListeActeurs = ({titre, liste, picto}: ListeActeursProps) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        {picto('w-11 shrink-0')}
        <h6 className="text-sm leading-4 text-primary-9 uppercase mb-0 mt-1">
          {titre}
        </h6>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-11 shrink-0" />
        <ul className="list-disc list-inside text-sm mb-0">
          {liste && liste.length ? (
            liste.map((elt, index) => (
              <li key={`${elt}-${index}`} className="text-primary-10">
                {elt}
              </li>
            ))
          ) : (
            <li className="text-grey-7">Non renseigné</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ListeActeurs;
