"use strict";
exports.id = 266;
exports.ids = [266];
exports.modules = {

/***/ 89266:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Y: () => (/* binding */ getData),
/* harmony export */   g: () => (/* binding */ getMetaData)
/* harmony export */ });
/* harmony import */ var src_strapi_strapi__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(11044);

const getMetaData = async (id)=>{
    const data = await (0,src_strapi_strapi__WEBPACK_IMPORTED_MODULE_0__/* .fetchItem */ .iY)("actualites", id, [
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
        ],
        [
            "populate[4]",
            "Couverture"
        ]
    ]);
    const image = (data?.attributes.Metadata?.Image?.data)?.attributes ?? (data?.attributes.Couverture.data)?.attributes;
    return {
        title: (data?.attributes.Metadata?.Titre) ? (data?.attributes.Metadata?.Titre) : (data?.attributes.Titre) ?? undefined,
        description: (data?.attributes.Metadata?.Description) ? (data?.attributes.Metadata?.Description) : (data?.attributes.Resume) ?? undefined,
        image: image ? {
            url: image.url,
            width: image.width,
            height: image.height,
            type: image.mime,
            alt: image.alternativeText
        } : undefined,
        publishedAt: data.attributes.DateCreation ?? data.attributes.createdAt,
        updatedAt: data.attributes.updatedAt
    };
};
const getData = async (id)=>{
    const data = await (0,src_strapi_strapi__WEBPACK_IMPORTED_MODULE_0__/* .fetchItem */ .iY)("actualites", id, [
        [
            "populate[0]",
            "Couverture"
        ],
        [
            "populate[1]",
            "Sections"
        ],
        [
            "populate[2]",
            "Sections.Image"
        ],
        [
            "populate[3]",
            "Sections.Gallerie"
        ]
    ]);
    if (data) {
        const idList = await (0,src_strapi_strapi__WEBPACK_IMPORTED_MODULE_0__/* .fetchCollection */ .lA)("actualites", [
            [
                "fields[0]",
                "DateCreation"
            ],
            [
                "fields[1]",
                "createdAt"
            ],
            [
                "fields[2]",
                "Epingle"
            ],
            [
                "sort[0]",
                "createdAt:desc"
            ]
        ]);
        const sortedIds = idList ? idList.map((d)=>({
                id: d.id,
                epingle: d.attributes.Epingle ?? false,
                dateCreation: d.attributes.DateCreation ?? d.attributes.createdAt
            })).sort((a, b)=>{
            if (a.epingle && !b.epingle) return -1;
            if (!a.epingle && b.epingle) return 1;
            return new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime();
        }) : null;
        const idPosition = sortedIds ? sortedIds.findIndex((el)=>el.id === id) : 0;
        const prevId = sortedIds ? idPosition !== 0 ? sortedIds[idPosition - 1].id : null : null;
        const nextId = sortedIds ? idPosition !== sortedIds.length - 1 ? sortedIds[idPosition + 1].id : null : null;
        const formattedData = {
            titre: data.attributes.Titre,
            dateCreation: data.attributes.DateCreation ?? data.attributes.createdAt,
            dateEdition: data.attributes.updatedAt,
            couverture: data.attributes.Couverture.data,
            contenu: data.attributes.Sections.map((section)=>{
                if (section.__component === "contenu.paragraphe") {
                    return {
                        type: "paragraphe",
                        data: {
                            titre: section.Titre,
                            texte: section.Texte,
                            image: section.Image.data,
                            alignementImage: section.AlignementImage,
                            legendeVisible: section.LegendeVisible
                        }
                    };
                } else if (section.__component === "contenu.image") {
                    return {
                        type: "image",
                        data: {
                            data: section.Image.data,
                            legendeVisible: section.LegendeVisible
                        }
                    };
                } else if (section.__component === "contenu.gallerie") {
                    return {
                        type: "gallerie",
                        data: {
                            data: section.Gallerie.data,
                            colonnes: section.NombreColonnes,
                            legende: section.Legende,
                            legendeVisible: section.LegendeVisible
                        }
                    };
                } else if (section.__component === "contenu.video") {
                    return {
                        type: "video",
                        data: section.URL
                    };
                } else if (section.__component === "contenu.info") {
                    return {
                        type: "info",
                        data: section.Texte
                    };
                } else return {
                    type: "paragraphe",
                    data: {}
                };
            }),
            prevId,
            nextId
        };
        return formattedData;
    } else return data;
};


/***/ })

};
;