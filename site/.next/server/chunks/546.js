"use strict";
exports.id = 546;
exports.ids = [546];
exports.modules = {

/***/ 53330:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   $: () => (/* binding */ useFilteredCollectivites),
/* harmony export */   G: () => (/* binding */ useCollectivite)
/* harmony export */ });
/* harmony import */ var app_initSupabase__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(37121);
/* harmony import */ var swr__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(97146);


const useFilteredCollectivites = (search)=>{
    return (0,swr__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .ZP)(`site_labellisation-filtered-${search}`, async ()=>{
        const query = app_initSupabase__WEBPACK_IMPORTED_MODULE_0__/* .supabase */ .O.from("site_labellisation").select().order("nom").limit(10);
        if (search) {
            const processedSearch = search.split(" ").map((w)=>w.trim()).filter((w)=>w !== "").join(" ");
            const processedSearchWithDash = processedSearch.split(" ").join("-");
            const processedSearchWithDashAndSpace = processedSearch.split(" ").join(" - ");
            const processedSearchWithoutDash = processedSearch.split("-").join(" ");
            query.or(`"nom".ilike.%${processedSearch}%,"nom".ilike.%${processedSearchWithDash}%,"nom".ilike.%${processedSearchWithDashAndSpace}%,"nom".ilike.%${processedSearchWithoutDash}%`);
        }
        const { error, data } = await query;
        if (error) {
            throw new Error(`site_labellisation-filtered-${search}`);
        }
        if (!data || !data.length) {
            return null;
        }
        return {
            filteredCollectivites: data || []
        };
    });
};
const useCollectivite = (code_siren_insee)=>{
    return (0,swr__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .ZP)(`site_labellisation-${code_siren_insee}`, async ()=>{
        const { data, error } = await app_initSupabase__WEBPACK_IMPORTED_MODULE_0__/* .supabase */ .O.from("site_labellisation").select().match({
            code_siren_insee
        });
        if (error) {
            throw new Error(`site_labellisation-${code_siren_insee}`);
        }
        if (!data || !data.length) {
            return null;
        }
        return data;
    });
};


/***/ }),

/***/ 37121:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   O: () => (/* binding */ supabase)
/* harmony export */ });
/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(22730);
/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__);

const supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__.createClient)("https://rlarzronkgoyvtdkltqy.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXJ6cm9ua2dveXZ0ZGtsdHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDQ0MjM3NTcsImV4cCI6MTk1OTk5OTc1N30.Ciu6o-2Tnjm0yY7UuYcUeZNZbRGDOIQ4I6kA6hwkSuw", {
    db: {
        schema: "public"
    }
});


/***/ }),

/***/ 30814:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  LE: () => (/* binding */ convertNameToSlug),
  GD: () => (/* binding */ toLocaleFixed)
});

// UNUSED EXPORTS: getData, getMetaData, sortByRank

;// CONCATENATED MODULE: ./src/strapi/strapi.ts
const baseURL = (/* unused pure expression or super */ null && ("https://passionate-wonder-8e064cba29.strapiapp.com"));
const apiKey = "34027b5596a144e1e2c53d0cb4eee826b7f7e5166d1e80752ca1fd769e5d2a8e8d575c040867902bb98225c0ce83781ea21611d0e16afd84897e96b0ab160806aa697ec64eb6c5eeb1e3803d1837c3fa28e2f7e1e49428c3cd64b9643ae1dde4ff5164c6a3dba79bc563ecbe4fefb8cc0bc8ee7987f4ce1d21194422264655d6";
const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
};
async function strapi_fetchCollection(path, params = [
    [
        "populate",
        "*"
    ]
]) {
    const url = new URL(`${baseURL}/api/${path}`);
    params.forEach((p)=>url.searchParams.append(...p));
    const response = await fetch(`${url}`, {
        cache: "no-store",
        method: "GET",
        headers
    });
    const body = await response.json();
    return body["data"];
}
const strapi_fetchSingle = async (path, params = [
    [
        "populate",
        "*"
    ]
])=>{
    const url = new URL(`${baseURL}/api/${path}`);
    params.forEach((p)=>url.searchParams.append(...p));
    const response = await fetch(`${url}`, {
        cache: "no-store",
        method: "GET",
        headers
    });
    const body = await response.json();
    return body.data;
};
async function fetchItem(path, id, params = [
    [
        "populate",
        "*"
    ]
]) {
    const url = new URL(`${baseURL}/api/${path}/${id}`);
    params.forEach((p)=>url.searchParams.append(...p));
    const response = await fetch(`${url}`, {
        cache: "no-store",
        method: "GET",
        headers
    });
    const body = await response.json();
    return body["data"];
}

;// CONCATENATED MODULE: ./app/utils.ts

const getMetaData = async ()=>{
    const data = await fetchSingle("metadata", [
        [
            "populate[0]",
            "Metadata"
        ],
        [
            "populate[1]",
            "Metadata.Titre"
        ],
        [
            "populate[2]",
            "Metadata.Description"
        ],
        [
            "populate[3]",
            "Metadata.Image"
        ]
    ]);
    const image = (data?.attributes.Metadata?.Image?.data)?.attributes;
    return {
        title: (data?.attributes.Metadata?.Titre) ?? undefined,
        description: (data?.attributes.Metadata?.Description) ?? undefined,
        image: image ? {
            url: image.url,
            width: image.width,
            height: image.height,
            type: image.mime,
            alt: image.alternativeText
        } : undefined
    };
};
const sortByRank = (array)=>array.sort((a, b)=>{
        const aRank = a.attributes.Rang ?? undefined;
        const bRank = b.attributes.Rang ?? undefined;
        if (aRank && bRank) return aRank - bRank;
        else if (aRank && !bRank) return -1;
        else if (!aRank && bRank) return 1;
        else return a.id - b.id;
    });
const getData = async ()=>{
    // Fetch du contenu de la page d'accueil
    const data = await fetchSingle("accueil", [
        [
            "populate[0]",
            "Titre"
        ],
        [
            "populate[1]",
            "Couverture"
        ],
        [
            "populate[2]",
            "Accompagnement"
        ],
        [
            "populate[3]",
            "Accompagnement.Programme"
        ],
        [
            "populate[4]",
            "Accompagnement.Programme.Image"
        ],
        [
            "populate[5]",
            "Accompagnement.Compte"
        ],
        [
            "populate[6]",
            "Accompagnement.Compte.Image"
        ],
        [
            "populate[7]",
            "Temoignages"
        ],
        [
            "populate[8]",
            "Informations"
        ],
        [
            "populate[9]",
            "Newsletter"
        ]
    ]);
    // Fetch de la liste des témoignages
    const temoignages = await fetchCollection("temoignages", [
        [
            "populate[0]",
            "Image"
        ],
        [
            "sort[0]",
            "Rang:asc"
        ]
    ]);
    // Formattage de la data
    const formattedData = data ? {
        titre: data.attributes.Titre,
        couverture: data.attributes.Couverture.data ?? undefined,
        accompagnement: {
            titre: data.attributes.Accompagnement.Titre,
            description: data.attributes.Accompagnement.Description,
            contenu: [
                {
                    titre: data.attributes.Accompagnement.Programme.Titre,
                    description: data.attributes.Accompagnement.Programme.Description,
                    image: data.attributes.Accompagnement.Programme.Image.data,
                    button: {
                        titre: "D\xe9couvrir le programme",
                        href: "/programme"
                    }
                },
                {
                    titre: data.attributes.Accompagnement.Compte.Titre,
                    description: data.attributes.Accompagnement.Compte.Description,
                    image: data.attributes.Accompagnement.Compte.Image.data,
                    button: {
                        titre: "Cr\xe9er un compte",
                        href: "https://app.territoiresentransitions.fr/auth/signup"
                    }
                }
            ]
        },
        temoignages: temoignages ? {
            titre: data.attributes.Temoignages.Titre,
            description: data.attributes.Temoignages.Description,
            contenu: sortByRank(temoignages).map((d)=>({
                    id: d.id,
                    auteur: d.attributes.Auteur,
                    description: d.attributes.Description ?? undefined,
                    contenu: d.attributes.Contenu,
                    image: d.attributes.Image.data ?? undefined
                }))
        } : null,
        informations: {
            titre: data.attributes.Informations.Titre,
            description: data.attributes.Informations.Description
        },
        newsletter: {
            titre: data.attributes.Newsletter.Titre,
            description: data.attributes.Newsletter.Description
        }
    } : null;
    return formattedData;
};
const convertNameToSlug = (name)=>{
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "").trim().toLowerCase().split(" ").filter((el)=>el.length > 0).join("-");
};
// Copié depuis l'app
/**
 * Formate un nombre avec le nombre de décimales voulu et en tenant compte de la
 * langue du navigateur (utilise la virgule comme séparateur des décimales, et
 * l'espace comme séparateur des milliers en français)
 */ const toLocaleFixed = (n, maximumFractionDigits = 1)=>n ? n.toLocaleString(undefined, {
        maximumFractionDigits
    }) : "0";


/***/ })

};
;