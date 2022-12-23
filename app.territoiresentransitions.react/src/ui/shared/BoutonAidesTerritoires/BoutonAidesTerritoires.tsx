import {useCurrentCollectivite} from "core-logic/hooks/useCurrentCollectivite";

const url = 'https://aides-territoires.beta.gouv.fr/'
const apiURL = url + 'api/';
const aidesURL = url + 'aides/';
const perimetersURL = apiURL + 'perimeters/'
type Perimeter = {
    id: string,
    name: string,
}
type PerimeterApiResponse = {
    count: number,
    results: Perimeter[]
}

/**
 * Navigue vers Aides Territoires sur la page concernant la collectivité.
 */
export const BoutonAidesTerritoires = () => {
    const currentCollectivite = useCurrentCollectivite();

    // Lors du clic, on fait une recherche des `perimeters` qui
    // correspondent à notre collectivité, puis on redirige vers la
    // page d'aides filtrée sur le premier `perimeter` trouvé.
    const clickHandler = async () => {
        const url = perimetersURL + '?' + new URLSearchParams({q: currentCollectivite?.nom!});
        const perimeters: PerimeterApiResponse = await fetch(url).then(r => r.json());
        const matches = perimeters.results;

        let redirect = aidesURL;
        if (matches.length > 0) {
            const match = perimeters.results[0].id;
            redirect += '?' + new URLSearchParams({perimeter: match});
        }
        window.location.replace(redirect);
    };

    return <button className="fr-btn" onClick={clickHandler}>Aides territoires</button>;
}
