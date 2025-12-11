type ListeActeursProps = {
  dataTest?: string;
  titre: string;
  liste: string[] | undefined;
  comment?: string;
  picto: (className: string) => React.ReactNode;
};

const ListeActeurs = ({
  titre,
  liste,
  comment,
  picto,
  dataTest,
}: ListeActeursProps) => {
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
        <div className="flex flex-col gap-1">
          {((liste && liste.length) || !comment) && (
            <ul
              className="list-disc list-inside text-sm mb-0"
              data-test={dataTest}
            >
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
          )}
          {comment && <p className="text-sm text-primary-10 mb-0">{comment}</p>}
        </div>
      </div>
    </div>
  );
};

export default ListeActeurs;
