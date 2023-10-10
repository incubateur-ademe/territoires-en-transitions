exports.id = 483;
exports.ids = [483];
exports.modules = {

/***/ 10635:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 62057))

/***/ }),

/***/ 75413:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 32862))

/***/ }),

/***/ 37121:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
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

/***/ 62057:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ stats_StatisticsDisplay)
});

// EXTERNAL MODULE: external "next/dist/compiled/react-experimental/jsx-runtime"
var jsx_runtime_ = __webpack_require__(76931);
// EXTERNAL MODULE: ./components/sections/Section.tsx
var Section = __webpack_require__(75846);
// EXTERNAL MODULE: ./node_modules/swr/core/dist/index.mjs + 1 modules
var dist = __webpack_require__(97146);
// EXTERNAL MODULE: ./node_modules/@nivo/line/dist/nivo-line.cjs.js
var nivo_line_cjs = __webpack_require__(98630);
// EXTERNAL MODULE: ./app/initSupabase.ts
var initSupabase = __webpack_require__(37121);
;// CONCATENATED MODULE: ./app/stats/shared.ts
/**
 * Thème partagé par tous les graphiques
 *
 * Surcharge les valeurs par défaut définies dans :
 * https://github.com/plouc/nivo/blob/master/packages/core/src/theming/defaultTheme.js
 */ const colors = [
    "#21AB8E",
    "#FFCA00",
    "#FF732C",
    "#FFB7AE",
    "#34BAB5"
];
const fontFamily = '"Marianne", arial, sans-serif';
const fromMonth = "2022-01-01";
const theme = {
    fontFamily,
    fontSize: 12,
    axis: {
        legend: {
            text: {
                fontFamily,
                fontSize: 14
            }
        }
    },
    legends: {
        text: {
            fontSize: 14
        }
    },
    tooltip: {
        container: {
            fontSize: 14,
            background: "white",
            padding: "9px 12px",
            border: "1px solid #ccc"
        }
    }
};
const dateAsMonthAndYear = (v)=>new Date(v).toLocaleDateString("fr", {
        month: "short",
        year: "numeric"
    });
const formatInteger = (value)=>value === null ? "" : Number(value).toLocaleString("fr-FR");
const axisBottomAsDate = {
    legendPosition: "end",
    tickSize: 5,
    tickPadding: 12,
    tickRotation: -35,
    format: dateAsMonthAndYear
};
const axisLeftMiddleLabel = (legend)=>({
        tickSize: 4,
        tickPadding: 5,
        tickRotation: 0,
        legend,
        legendOffset: -45,
        legendPosition: "middle"
    });
const bottomLegend = {
    anchor: "bottom",
    direction: "row",
    justify: false,
    translateX: 0,
    translateY: 56,
    itemsSpacing: 16,
    itemWidth: 140,
    itemHeight: 18,
    itemDirection: "left-to-right",
    itemOpacity: 1,
    symbolSize: 18,
    symbolShape: "circle",
    effects: [
        {
            on: "hover",
            style: {
                itemTextColor: "#000"
            }
        }
    ]
};
const getLegendData = (data, palette)=>data.map(({ id, label }, index)=>({
            id,
            label,
            color: (palette || colors)[index]
        }));
const getLabelsById = (data)=>data.reduce((byId, { id, label })=>({
            ...byId,
            [id]: label
        }), {});

;// CONCATENATED MODULE: ./app/stats/SliceTooltip.tsx
/* __next_internal_client_entry_do_not_use__ SliceTooltip auto */ 

const SliceTooltip = (props)=>{
    const { slice, labels } = props;
    return /*#__PURE__*/ jsx_runtime_.jsx("div", {
        style: theme.tooltip?.container,
        children: slice.points.map((point)=>/*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                style: {
                    padding: "3px 0"
                },
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx(Color, {
                        fill: point.serieColor
                    }),
                    labels[point.serieId],
                    " ",
                    /*#__PURE__*/ jsx_runtime_.jsx("b", {
                        children: point.data.yFormatted
                    })
                ]
            }, point.id))
    });
};
const Color = ({ fill })=>/*#__PURE__*/ jsx_runtime_.jsx("span", {
        style: {
            height: 12,
            width: 12,
            backgroundColor: fill,
            display: "inline-block",
            marginRight: 12
        }
    });

;// CONCATENATED MODULE: ./app/stats/utils.tsx
const addLocalFilters = (select, codeDepartement, codeRegion)=>{
    if (codeDepartement) {
        return select.eq("code_departement", codeDepartement);
    } else if (codeRegion) {
        return select.eq("code_region", codeRegion);
    } else {
        return select.is("code_region", null).is("code_departement", null);
    }
};

;// CONCATENATED MODULE: ./app/stats/ActiveUsers.tsx
/* __next_internal_client_entry_do_not_use__ default auto */ 






function useActiveUsers(codeRegion, codeDepartement) {
    return (0,dist/* default */.ZP)(`stats_locales_evolution_utilisateur-${codeRegion}-${codeDepartement}`, async ()=>{
        let select = initSupabase/* supabase */.O.from("stats_locales_evolution_utilisateur").select().gte("mois", fromMonth);
        select = addLocalFilters(select, codeDepartement, codeRegion);
        const { data, error } = await select;
        if (error) {
            throw new Error("stats_evolution_utilisateur");
        }
        if (!data || !data.length) {
            return null;
        }
        return {
            precedent: data[data.length - 2],
            courant: data[data.length - 1],
            evolution: [
                {
                    id: "utilisateurs",
                    label: "Nouveaux utilisateurs",
                    data: data.map((d)=>({
                            x: d.mois,
                            y: d.utilisateurs
                        }))
                },
                {
                    id: "total_utilisateurs",
                    label: "Total utilisateurs",
                    data: data.map((d)=>({
                            x: d.mois,
                            y: d.total_utilisateurs
                        }))
                }
            ]
        };
    });
}
function ActiveUsers({ region = "", department = "" }) {
    const { data } = useActiveUsers(region, department);
    if (!data) {
        return null;
    }
    const { precedent, courant, evolution } = data;
    const legendData = getLegendData(evolution);
    const labelById = getLabelsById(evolution);
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                className: "fr-grid-row fr-grid-row--center",
                children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("h6", {
                    children: [
                        "La plateforme est utilis\xe9e par\xa0",
                        courant?.total_utilisateurs,
                        " personne",
                        courant?.total_utilisateurs !== 1 && "s",
                        ", dont\xa0",
                        precedent?.utilisateurs,
                        precedent?.utilisateurs === 1 ? " nous a" : " nous ont",
                        " rejoint le mois dernier"
                    ]
                })
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                style: {
                    height: 400
                },
                children: /*#__PURE__*/ jsx_runtime_.jsx(nivo_line_cjs/* ResponsiveLine */.fH, {
                    theme: theme,
                    colors: colors,
                    data: evolution,
                    // les marges servent aux légendes
                    margin: {
                        top: 5,
                        right: 5,
                        bottom: 85,
                        left: 50
                    },
                    xScale: {
                        type: "point"
                    },
                    yScale: {
                        type: "linear",
                        min: 0,
                        max: "auto",
                        stacked: false
                    },
                    // on interpole la ligne de façon bien passer sur les points
                    curve: "monotoneX",
                    lineWidth: 4,
                    pointSize: 4,
                    yFormat: " >-.0f",
                    axisBottom: axisBottomAsDate,
                    axisLeft: axisLeftMiddleLabel("Nombre d'utilisateurs actifs"),
                    pointColor: {
                        theme: "background"
                    },
                    pointBorderWidth: 4,
                    pointBorderColor: {
                        from: "serieColor"
                    },
                    pointLabelYOffset: -12,
                    enableSlices: "x",
                    sliceTooltip: (props)=>/*#__PURE__*/ jsx_runtime_.jsx(SliceTooltip, {
                            ...props,
                            labels: labelById
                        }),
                    legends: [
                        {
                            ...bottomLegend,
                            data: legendData,
                            translateY: 85,
                            itemWidth: 180
                        }
                    ],
                    animate: false
                })
            })
        ]
    });
}

// EXTERNAL MODULE: ./node_modules/@nivo/geo/dist/nivo-geo.cjs.js
var nivo_geo_cjs = __webpack_require__(87906);
;// CONCATENATED MODULE: ./app/stats/CarteEpciParDepartement.tsx
/* __next_internal_client_entry_do_not_use__ default auto */ 




function useCarteEpciParDepartement() {
    return (0,dist/* default */.ZP)("stats_carte_epci_par_departement", async ()=>{
        const { data, error } = await initSupabase/* supabase */.O.from("stats_carte_epci_par_departement").select();
        if (error) {
            throw new Error("stats_carte_epci_par_departement");
        }
        if (!data || !data.length) {
            return null;
        }
        const actives_max = Math.max(...data.map((d)=>d.actives || 0));
        const total_max = Math.max(...data.map((d)=>d.total || 0));
        return {
            actives_max: actives_max,
            total_max: total_max,
            ratio_max: actives_max / total_max,
            valeurs: data.map((d)=>{
                return {
                    id: d.insee,
                    total: d.total,
                    actives: d.actives,
                    ratio: (d.actives || 0) / (d.total || 1)
                };
            }),
            geojson: {
                type: "FeatureCollection",
                features: data.map((d)=>{
                    return {
                        id: d.insee,
                        ...d.geojson
                    };
                })
            }
        };
    });
}
function CarteEpciParDepartement(props) {
    const { data } = useCarteEpciParDepartement();
    const { valeur, maximum } = props;
    if (!data) {
        return null;
    }
    // la taille est absolue, car Nivo ne peut pas centrer la carte un point
    // et les offsets sont relatifs à la taille.
    return /*#__PURE__*/ jsx_runtime_.jsx("div", {
        style: {
            height: 400
        },
        children: /*#__PURE__*/ jsx_runtime_.jsx(nivo_geo_cjs/* ResponsiveChoropleth */.Co, {
            colors: "nivo",
            theme: theme,
            data: data.valeurs,
            features: data.geojson.features,
            margin: {
                top: 0,
                right: 0,
                bottom: 60,
                left: 0
            },
            domain: [
                0,
                data[maximum]
            ],
            unknownColor: "#666666",
            label: "properties.libelle",
            value: valeur,
            valueFormat: ">-.0" + (valeur === "ratio" ? "%" : "f"),
            projectionScale: 1300,
            projectionTranslation: [
                0.35,
                3.5
            ],
            projectionRotation: [
                0,
                0,
                0
            ],
            enableGraticule: false,
            graticuleLineColor: "#dddddd",
            borderWidth: 0.5,
            borderColor: "#152538",
            legends: [
                bottomLegend
            ]
        })
    });
}

// EXTERNAL MODULE: ./node_modules/@nivo/waffle/dist/nivo-waffle.cjs.js
var nivo_waffle_cjs = __webpack_require__(11490);
;// CONCATENATED MODULE: ./app/stats/CollectiviteActivesEtTotalParType.tsx
/* __next_internal_client_entry_do_not_use__ default auto */ 





function useCollectiviteActivesEtTotalParType(codeRegion, codeDepartement) {
    return (0,dist/* default */.ZP)(`stats_locales_collectivite_actives_et_total_par_type-${codeRegion}-${codeDepartement}`, async ()=>{
        let select = initSupabase/* supabase */.O.from("stats_locales_collectivite_actives_et_total_par_type").select();
        select = addLocalFilters(select, codeDepartement, codeRegion);
        const { data, error } = await select;
        if (error) {
            throw new Error(error.message);
        }
        if (!data || !data.length) {
            return null;
        }
        const epcis = data.filter((d)=>d.typologie === "EPCI")[0];
        return {
            categories: [
                {
                    id: epcis.typologie + " activ\xe9s",
                    label: epcis.typologie + " activ\xe9s",
                    value: epcis.actives
                },
                {
                    id: epcis.typologie + " inactifs",
                    label: epcis.typologie + " inactifs",
                    value: (epcis.total || 0) - (epcis.actives || 0)
                }
            ],
            total: epcis.total
        };
    });
}
function CollectiviteActivesEtTotalParType({ region = "", department = "" }) {
    const { data } = useCollectiviteActivesEtTotalParType(region, department);
    if (!data) return null;
    const { categories, total } = data;
    return /*#__PURE__*/ jsx_runtime_.jsx("div", {
        style: {
            height: 400
        },
        children: /*#__PURE__*/ jsx_runtime_.jsx(nivo_waffle_cjs/* ResponsiveWaffle */.qx, {
            colors: [
                "#21AB8E",
                "#FF732C"
            ],
            theme: theme,
            data: categories,
            total: total || 0,
            rows: 10,
            columns: 10,
            margin: {
                top: 0,
                right: 30,
                bottom: 10,
                left: 30
            },
            animate: false,
            // @ts-ignore: la propriété `legends` est absente du typage (@nivo/waffle:0.80.0) mais bien supportée
            legends: [
                {
                    ...bottomLegend,
                    translateY: 5
                }
            ]
        })
    });
}

// EXTERNAL MODULE: ./node_modules/@nivo/pie/dist/nivo-pie.cjs.js
var nivo_pie_cjs = __webpack_require__(55283);
;// CONCATENATED MODULE: ./app/stats/CollectivitesLabellisees.tsx
/* __next_internal_client_entry_do_not_use__ default auto */ 





function useCollectivitesLabellisees(referentiel, codeRegion, codeDepartement) {
    const { data } = (0,dist/* default */.ZP)(`stats_locales_labellisation_par_niveau-${referentiel}-${codeRegion}-${codeDepartement}`, async ()=>{
        let select = initSupabase/* supabase */.O.from("stats_locales_labellisation_par_niveau").select().gte("etoiles", 1).eq("referentiel", referentiel).order("etoiles", {
            ascending: true
        });
        select = addLocalFilters(select, codeDepartement, codeRegion);
        const { data, error } = await select;
        if (error) {
            throw new Error("stats_labellisation_par_niveau");
        }
        if (!data) {
            return null;
        }
        return data;
    });
    return data?.map((d)=>({
            id: d.etoiles,
            label: `${d.etoiles} étoile${(d.etoiles || 0) > 1 ? "s" : ""}`,
            value: d.labellisations
        }));
}
function CollectivitesLabellisees({ referentiel, region = "", department = "" }) {
    let data = useCollectivitesLabellisees(referentiel, region, department);
    if (!data) return null;
    if (!data.length) {
        data = [
            {
                id: 1,
                label: "NA",
                value: 1
            }
        ];
    }
    return /*#__PURE__*/ jsx_runtime_.jsx("div", {
        style: {
            height: 300
        },
        children: /*#__PURE__*/ jsx_runtime_.jsx(nivo_pie_cjs/* ResponsivePie */.Y2, {
            colors: !data.filter((d)=>d.label === "NA").length ? [
                "#21AB8E",
                "#34BAB5",
                "#FFCA00",
                "#FFB7AE",
                "#FF732C"
            ] : [
                "#CCC"
            ],
            theme: theme,
            data: data,
            margin: {
                top: 40,
                right: 85,
                bottom: 80,
                left: 85
            },
            innerRadius: 0.5,
            padAngle: 0.7,
            cornerRadius: 3,
            activeOuterRadiusOffset: 8,
            borderWidth: 1,
            borderColor: {
                from: "color",
                modifiers: [
                    [
                        "darker",
                        0.2
                    ]
                ]
            },
            arcLinkLabel: "label",
            arcLinkLabelsDiagonalLength: 16,
            arcLinkLabelsStraightLength: 14,
            arcLinkLabelsTextColor: "#333333",
            arcLinkLabelsThickness: 2,
            arcLinkLabelsColor: {
                from: "color"
            },
            arcLabelsSkipAngle: 10,
            arcLabelsTextColor: {
                from: "color",
                modifiers: [
                    [
                        "darker",
                        2
                    ]
                ]
            },
            tooltip: ()=>null,
            startAngle: -10,
            enableArcLabels: !data.filter((d)=>d.label === "NA").length,
            animate: false
        })
    });
}

// EXTERNAL MODULE: external "next/dist/compiled/react-experimental"
var react_experimental_ = __webpack_require__(17640);
;// CONCATENATED MODULE: ./app/stats/headings.tsx


// titre au dessus d'une section
function SectionHead({ children }) {
    return /*#__PURE__*/ jsx_runtime_.jsx("h2", {
        children: children
    });
}
// titre au dessus d'un groupe de graphes
const chartHeadStyle = {
    marginTop: "2rem",
    textAlign: "center"
};
function ChartHead({ children }) {
    return /*#__PURE__*/ jsx_runtime_.jsx("h6", {
        style: chartHeadStyle,
        children: children
    });
}
// titre d'un graphe faisant parti d'un groupe
const chartTitleStyle = {
    textAlign: "center",
    display: "block"
};
function ChartTitle({ children }) {
    return /*#__PURE__*/ jsx_runtime_.jsx("em", {
        style: chartTitleStyle,
        children: children
    });
}

;// CONCATENATED MODULE: ./app/stats/TrancheCompletude.tsx
/* __next_internal_client_entry_do_not_use__ useTrancheCompletude,default auto */ 





function useTrancheCompletude(codeRegion, codeDepartement) {
    return (0,dist/* default */.ZP)(`stats_locales_tranche_completude-${codeRegion}-${codeDepartement}`, async ()=>{
        let select = initSupabase/* supabase */.O.from("stats_locales_tranche_completude").select().gt("lower_bound", 0).order("lower_bound", {
            ascending: false
        });
        select = addLocalFilters(select, codeDepartement, codeRegion);
        const { data, error } = await select;
        if (error) {
            throw new Error("stats_tranche_completude");
        }
        if (!data || !data.length) {
            return null;
        }
        return {
            tranches: data.map((d)=>{
                return {
                    id: d.lower_bound,
                    label: d.lower_bound + `${d.upper_bound ? "-" + d.upper_bound : ""}` + "%",
                    eci: d.eci ?? 0,
                    cae: d.cae ?? 0
                };
            }),
            inities: getSum(data),
            termines: getSum(data.filter((d)=>d.lower_bound === 100)),
            presqueTermines: getSum(data.filter((d)=>d.lower_bound !== null && d.lower_bound >= 80))
        };
    });
}
// somme des compteurs par référentiel pour calculer les décomptes
// initiés/terminés/remplis à 80% et plus
const getSum = (data)=>data.reduce((cnt, d)=>cnt + (d.cae ?? 0) + (d.eci ?? 0), 0);
function TrancheCompletude({ referentiel, region = "", department = "" }) {
    let { data } = useTrancheCompletude(region, department);
    if (!data) return null;
    let tranches = data.tranches;
    // Si le référentiel ne contient pas de données,
    // on affiche une seule tranche : NA
    if (referentiel === "eci" && !data.tranches.filter((tr)=>tr.eci !== 0).length || referentiel === "cae" && !data.tranches.filter((tr)=>tr.cae !== 0).length) {
        tranches = [
            {
                id: 1,
                label: "NA",
                eci: 1,
                cae: 1
            }
        ];
    }
    return /*#__PURE__*/ jsx_runtime_.jsx("div", {
        style: {
            height: 300
        },
        children: /*#__PURE__*/ jsx_runtime_.jsx(nivo_pie_cjs/* ResponsivePie */.Y2, {
            colors: !tranches.filter((tr)=>tr.label === "NA").length ? [
                "#21AB8E",
                "#34BAB5",
                "#FFCA00",
                "#FFB7AE",
                "#FF732C"
            ] : [
                "#CCC"
            ],
            theme: theme,
            data: tranches,
            value: referentiel,
            margin: {
                top: 40,
                right: 85,
                bottom: 25,
                left: 85
            },
            innerRadius: 0.5,
            padAngle: 0.7,
            cornerRadius: 3,
            activeOuterRadiusOffset: 8,
            borderWidth: 1,
            borderColor: {
                from: "color",
                modifiers: [
                    [
                        "darker",
                        0.2
                    ]
                ]
            },
            arcLinkLabel: "label",
            arcLinkLabelsDiagonalLength: 10,
            arcLinkLabelsSkipAngle: 10,
            arcLinkLabelsTextColor: "#333333",
            arcLinkLabelsThickness: 2,
            arcLinkLabelsColor: {
                from: "color"
            },
            arcLabelsSkipAngle: 10,
            arcLabelsTextColor: {
                from: "color",
                modifiers: [
                    [
                        "darker",
                        2
                    ]
                ]
            },
            tooltip: ()=>null,
            animate: false,
            enableArcLabels: !data.tranches.filter((tr)=>tr.label === "NA").length
        })
    });
}

;// CONCATENATED MODULE: ./app/stats/EtatDesLieux.tsx




function EtatDesLieux({ region = "", department = "" }) {
    const { data } = useTrancheCompletude(region, department);
    if (!data) return null;
    const { inities, termines, presqueTermines } = data;
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(jsx_runtime_.Fragment, {
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ChartHead, {
                children: [
                    "\xc9tats des lieux r\xe9alis\xe9s, ventil\xe9s par taux de progression",
                    /*#__PURE__*/ jsx_runtime_.jsx("br", {}),
                    inities,
                    " \xe9tat",
                    inities !== 1 && "s",
                    " des lieux initi\xe9",
                    inities !== 1 && "s",
                    ", dont ",
                    presqueTermines,
                    " r\xe9alis\xe9",
                    presqueTermines !== 1 && "s",
                    " \xe0 plus de 80% et ",
                    termines,
                    " termin\xe9",
                    termines !== 1 && "s",
                    " (100%)"
                ]
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                className: "fr-grid-row fr-grid-row--center fr-grid-row--gutters",
                children: [
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                        className: "fr-col-xs-12 fr-col-sm-12 fr-col-md-5 fr-col-lg-5 fr-responsive-img",
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx(ChartTitle, {
                                children: "Climat Air \xc9nergie"
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx(TrancheCompletude, {
                                referentiel: "cae",
                                region: region,
                                department: department
                            })
                        ]
                    }),
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                        className: "fr-col-xs-12 fr-col-sm-12 fr-col-md-5 fr-col-lg-5 fr-responsive-img",
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx(ChartTitle, {
                                children: "\xc9conomie circulaire"
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx(TrancheCompletude, {
                                referentiel: "eci",
                                region: region,
                                department: department
                            })
                        ]
                    })
                ]
            })
        ]
    });
}

;// CONCATENATED MODULE: ./app/stats/IndicateursRenseignes.tsx
/* __next_internal_client_entry_do_not_use__ default auto */ 






function useIndicateursRenseignes(codeRegion, codeDepartement) {
    return (0,dist/* default */.ZP)(`stats_locales_evolution_indicateur_referentiel-${codeRegion}-${codeDepartement}`, async ()=>{
        let select = initSupabase/* supabase */.O.from("stats_locales_evolution_indicateur_referentiel").select().gte("mois", fromMonth).order("mois", {
            ascending: true
        });
        select = addLocalFilters(select, codeDepartement, codeRegion);
        const { data, error } = await select;
        if (error) {
            throw new Error("stats_locales_evolution_indicateur_referentiel");
        }
        if (!data || !data.length) {
            return null;
        }
        return [
            {
                id: "Indicateurs",
                data: data.map((d)=>({
                        x: d.mois,
                        y: d.indicateurs
                    })),
                last: data[data.length - 1].indicateurs
            }
        ];
    });
}
function IndicateursRenseignes({ region = "", department = "" }) {
    const { data } = useIndicateursRenseignes(region, department);
    if (!data) return null;
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(jsx_runtime_.Fragment, {
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ChartTitle, {
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx("b", {
                        children: formatInteger(data[0].last)
                    }),
                    " indicateurs des r\xe9f\xe9rentiels renseign\xe9s"
                ]
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                style: {
                    height: "400px"
                },
                children: /*#__PURE__*/ jsx_runtime_.jsx(nivo_line_cjs/* ResponsiveLine */.fH, {
                    colors: colors,
                    theme: theme,
                    data: data,
                    // les marges servent aux légendes
                    margin: {
                        top: 5,
                        right: 5,
                        bottom: 85,
                        left: 55
                    },
                    xScale: {
                        type: "point"
                    },
                    yScale: {
                        type: "linear",
                        min: "auto",
                        max: "auto",
                        stacked: false
                    },
                    // on interpole la ligne de façon bien passer sur les points
                    curve: "monotoneX",
                    lineWidth: 4,
                    pointSize: 4,
                    yFormat: formatInteger,
                    axisBottom: axisBottomAsDate,
                    axisLeft: {
                        ...axisLeftMiddleLabel("Nombre d’indicateurs des r\xe9f\xe9rentiels renseign\xe9s"),
                        legendOffset: -50
                    },
                    pointBorderWidth: 4,
                    pointBorderColor: {
                        from: "serieColor"
                    },
                    pointLabelYOffset: -12,
                    enableSlices: "x",
                    animate: false
                })
            })
        ]
    });
}

;// CONCATENATED MODULE: ./app/stats/ValeursIndicateursRenseignees.tsx
/* __next_internal_client_entry_do_not_use__ default auto */ 






function useValeursIndicateursRenseignees(codeRegion, codeDepartement) {
    return (0,dist/* default */.ZP)(`stats_locales_evolution_resultat_indicateur_referentiel-${codeRegion}-${codeDepartement}`, async ()=>{
        let select = initSupabase/* supabase */.O.from("stats_locales_evolution_resultat_indicateur_referentiel").select().gte("mois", fromMonth);
        select = addLocalFilters(select, codeDepartement, codeRegion);
        const { data, error } = await select;
        if (error) {
            throw new Error("stats_locales_evolution_resultat_indicateur_referentiel");
        }
        if (!data || !data.length) {
            return null;
        }
        return [
            {
                id: "Valeurs renseign\xe9es",
                data: data.map((d)=>({
                        x: d.mois,
                        y: d.indicateurs
                    })),
                last: data[data.length - 1].indicateurs
            }
        ];
    });
}
function ValeursIndicateursRenseignees({ region = "", department = "" }) {
    const { data } = useValeursIndicateursRenseignees(region, department);
    if (!data) return null;
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(jsx_runtime_.Fragment, {
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ChartTitle, {
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx("b", {
                        children: formatInteger(data[0].last)
                    }),
                    " valeurs d’indicateurs des r\xe9f\xe9rentiels renseign\xe9s"
                ]
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                style: {
                    height: "400px"
                },
                children: /*#__PURE__*/ jsx_runtime_.jsx(nivo_line_cjs/* ResponsiveLine */.fH, {
                    colors: colors,
                    theme: theme,
                    data: data,
                    // les marges servent aux légendes
                    margin: {
                        top: 5,
                        right: 5,
                        bottom: 85,
                        left: 60
                    },
                    xScale: {
                        type: "point"
                    },
                    yScale: {
                        type: "linear",
                        min: "auto",
                        max: "auto",
                        stacked: false
                    },
                    // on interpole la ligne de façon bien passer sur les points
                    curve: "monotoneX",
                    lineWidth: 4,
                    pointSize: 4,
                    yFormat: formatInteger,
                    axisBottom: axisBottomAsDate,
                    axisLeft: {
                        ...axisLeftMiddleLabel("Valeurs d’indicateurs renseign\xe9es"),
                        legendOffset: -55
                    },
                    pointBorderWidth: 4,
                    pointBorderColor: {
                        from: "serieColor"
                    },
                    pointLabelYOffset: -12,
                    enableSlices: "x",
                    animate: false
                })
            })
        ]
    });
}

;// CONCATENATED MODULE: ./app/stats/ValeursIndicateursPersoRenseignees.tsx
/* __next_internal_client_entry_do_not_use__ default auto */ 






function useValeursIndicateursPersoRenseignees(codeRegion, codeDepartement) {
    return (0,dist/* default */.ZP)(`stats_locales_evolution_resultat_indicateur_personnalise-${codeRegion}-${codeDepartement}`, async ()=>{
        let select = initSupabase/* supabase */.O.from("stats_locales_evolution_resultat_indicateur_personnalise").select().gte("mois", fromMonth);
        select = addLocalFilters(select, codeDepartement, codeRegion);
        const { data, error } = await select;
        if (error) {
            throw new Error("stats_locales_evolution_resultat_indicateur_personnalise");
        }
        if (!data || !data.length) {
            return null;
        }
        return [
            {
                id: "Valeurs renseign\xe9es",
                data: data.map((d)=>({
                        x: d.mois,
                        y: d.indicateurs
                    })),
                last: data[data.length - 1].indicateurs
            }
        ];
    });
}
function ValeursIndicateursPersoRenseignees({ region = "", department = "" }) {
    const { data } = useValeursIndicateursPersoRenseignees(region, department);
    if (!data) return null;
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(jsx_runtime_.Fragment, {
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ChartTitle, {
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx("b", {
                        children: formatInteger(data[0].last)
                    }),
                    " indicateurs personnalis\xe9s renseign\xe9s"
                ]
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                style: {
                    height: "400px"
                },
                children: /*#__PURE__*/ jsx_runtime_.jsx(nivo_line_cjs/* ResponsiveLine */.fH, {
                    colors: colors,
                    theme: theme,
                    data: data,
                    // les marges servent aux légendes
                    margin: {
                        top: 5,
                        right: 5,
                        bottom: 85,
                        left: 55
                    },
                    xScale: {
                        type: "point"
                    },
                    yScale: {
                        type: "linear",
                        min: "auto",
                        max: "auto",
                        stacked: false
                    },
                    // on interpole la ligne de façon bien passer sur les points
                    curve: "monotoneX",
                    lineWidth: 4,
                    pointSize: 4,
                    yFormat: formatInteger,
                    axisBottom: axisBottomAsDate,
                    axisLeft: {
                        ...axisLeftMiddleLabel("Valeurs d’indicateurs personnalis\xe9s renseign\xe9es"),
                        legendOffset: -50
                    },
                    pointBorderWidth: 4,
                    pointBorderColor: {
                        from: "serieColor"
                    },
                    pointLabelYOffset: -12,
                    enableSlices: "x",
                    animate: false
                })
            })
        ]
    });
}

;// CONCATENATED MODULE: ./app/stats/EvolutionIndicateurs.tsx









const useCollectivitesAvecIndicateur = (codeRegion, codeDepartement)=>{
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-01`;
    return (0,dist/* default */.ZP)(`stats_locales_evolution_collectivite_avec_indicateur-${codeRegion}-${codeDepartement}`, async ()=>{
        let select = initSupabase/* supabase */.O.from("stats_locales_evolution_collectivite_avec_indicateur").select().gte("mois", formattedDate);
        select = addLocalFilters(select, codeDepartement, codeRegion);
        const { data, error } = await select;
        if (error) {
            throw new Error("stats_locales_evolution_collectivite_avec_indicateur");
        }
        if (!data || !data.length) return null;
        return data[0].collectivites;
    });
};
function EvolutionIndicateurs({ region = "", department = "" }) {
    const { data } = useCollectivitesAvecIndicateur(region, department);
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(jsx_runtime_.Fragment, {
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ChartHead, {
                children: [
                    "\xc9volution de l’utilisation des indicateurs",
                    /*#__PURE__*/ jsx_runtime_.jsx("br", {}),
                    data,
                    " collectivit\xe9",
                    data !== 1 && "s",
                    data === 1 ? " a" : " ont",
                    " renseign\xe9 des indicateurs"
                ]
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                className: "fr-grid-row fr-grid-row--center fr-grid-row--gutters",
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx(Column, {
                        children: /*#__PURE__*/ jsx_runtime_.jsx(IndicateursRenseignes, {
                            region: region,
                            department: department
                        })
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(Column, {
                        children: /*#__PURE__*/ jsx_runtime_.jsx(ValeursIndicateursRenseignees, {
                            region: region,
                            department: department
                        })
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(Column, {
                        children: /*#__PURE__*/ jsx_runtime_.jsx(ValeursIndicateursPersoRenseignees, {
                            region: region,
                            department: department
                        })
                    })
                ]
            })
        ]
    });
}
const Column = ({ children })=>/*#__PURE__*/ jsx_runtime_.jsx("div", {
        className: "fr-col-xs-12 fr-col-sm-12 fr-col-md-4 fr-col-lg-4",
        children: children
    });

;// CONCATENATED MODULE: ./app/stats/EvolutionFiches.tsx
/* __next_internal_client_entry_do_not_use__ useEvolutionFiches,default auto */ 





const colonneValeur = {
    stats_locales_evolution_nombre_fiches: "fiches",
    stats_locales_evolution_collectivite_avec_minimum_fiches: "collectivites"
};
const legende = {
    stats_locales_evolution_nombre_fiches: "Nombre total de fiches",
    stats_locales_evolution_collectivite_avec_minimum_fiches: "Collectivit\xe9s avec cinq fiches ou plus"
};
const labels = {
    fiches: "Fiches",
    collectivites: "Collectivit\xe9s"
};
function useEvolutionFiches(vue, codeRegion, codeDepartement) {
    return (0,dist/* default */.ZP)(`${vue}-${codeRegion}-${codeDepartement}`, async ()=>{
        let select = initSupabase/* supabase */.O.from(vue).select().gte("mois", fromMonth);
        select = addLocalFilters(select, codeDepartement, codeRegion);
        const { data, error } = await select;
        if (error) {
            throw new Error(vue);
        }
        if (!data || !data.length) {
            return null;
        }
        return {
            evolution: [
                {
                    id: labels[colonneValeur[vue]],
                    // @ts-ignore
                    data: data.map((d)=>({
                            x: d.mois,
                            y: d[colonneValeur[vue]]
                        }))
                }
            ],
            // @ts-ignore
            last: data[data.length - 1][colonneValeur[vue]]
        };
    });
}
function EvolutionFiches({ vue, region = "", department = "" }) {
    const { data } = useEvolutionFiches(vue, region, department);
    if (!data) {
        return null;
    }
    return /*#__PURE__*/ jsx_runtime_.jsx("div", {
        style: {
            height: 100 + "%",
            maxHeight: 400 + "px"
        },
        children: /*#__PURE__*/ jsx_runtime_.jsx(nivo_line_cjs/* ResponsiveLine */.fH, {
            colors: colors,
            theme: theme,
            data: data.evolution,
            // les marges servent aux légendes
            margin: {
                top: 5,
                right: 5,
                bottom: 55,
                left: 50
            },
            xScale: {
                type: "point"
            },
            yScale: {
                type: "linear",
                min: "auto",
                max: "auto",
                stacked: false
            },
            // on interpole la ligne de façon bien passer sur les points
            curve: "monotoneX",
            lineWidth: 4,
            enablePoints: true,
            yFormat: " >-.0f",
            axisTop: null,
            axisRight: null,
            axisBottom: axisBottomAsDate,
            axisLeft: axisLeftMiddleLabel(legende[vue]),
            pointColor: {
                theme: "background"
            },
            pointBorderWidth: 4,
            pointBorderColor: {
                from: "serieColor"
            },
            pointLabelYOffset: -12,
            enableSlices: "x",
            animate: false
        })
    });
}

;// CONCATENATED MODULE: ./app/stats/EvolutionPlansAction.tsx




function EvolutionPlansAction({ region = "", department = "" }) {
    const { data: collectivites } = useEvolutionFiches("stats_locales_evolution_collectivite_avec_minimum_fiches", region, department);
    const { data: fiches } = useEvolutionFiches("stats_locales_evolution_nombre_fiches", region, department);
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(jsx_runtime_.Fragment, {
        children: [
            collectivites && fiches && /*#__PURE__*/ jsx_runtime_.jsx(ChartHead, {
                children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)(jsx_runtime_.Fragment, {
                    children: [
                        "\xc9volution de l'utilisation des plans d'action",
                        /*#__PURE__*/ jsx_runtime_.jsx("br", {}),
                        collectivites.last,
                        " collectivit\xe9",
                        collectivites.last !== 1 && "s",
                        collectivites.last === 1 ? " a " : " ont ",
                        "cr\xe9\xe9 des plans d’actions et ",
                        fiches.last,
                        " fiche",
                        fiches.last !== 1 && "s",
                        " actions",
                        fiches.last === 1 ? " a \xe9t\xe9 cr\xe9\xe9e" : " ont \xe9t\xe9 cr\xe9\xe9es"
                    ]
                })
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                className: "fr-grid-row fr-grid-row--center fr-grid-row--gutters",
                children: [
                    collectivites && /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                        className: "fr-col-xs-12 fr-col-sm-12 fr-col-md-6 fr-col-lg-6 fr-ratio-16x9",
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx(ChartTitle, {
                                children: "Nombre de collectivit\xe9s avec 5+ fiches"
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx(EvolutionFiches, {
                                vue: "stats_locales_evolution_collectivite_avec_minimum_fiches",
                                region: region,
                                department: department
                            })
                        ]
                    }),
                    fiches && /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                        className: "fr-col-xs-12 fr-col-sm-12 fr-col-md-6 fr-col-lg-6 fr-ratio-16x9",
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx(ChartTitle, {
                                children: "Nombre de fiches action cr\xe9\xe9es"
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx(EvolutionFiches, {
                                vue: "stats_locales_evolution_nombre_fiches",
                                region: region,
                                department: department
                            })
                        ]
                    })
                ]
            })
        ]
    });
}

;// CONCATENATED MODULE: ./app/stats/EvolutionTotalActivationParType.tsx
/* __next_internal_client_entry_do_not_use__ default auto */ 





/**
 * L'évolution des activations par type de collectivité
 * Filtrable par département ou région.
 *
 * @param codeRegion le code de la région ou ''
 * @param codeDepartement le code du département ou ''
 */ function useEvolutionTotalActivation(codeRegion, codeDepartement) {
    return (0,dist/* default */.ZP)(`stats_locales_evolution_total_activation-${codeRegion}-${codeDepartement}`, async ()=>{
        let select = initSupabase/* supabase */.O.from("stats_locales_evolution_total_activation").select().gte("mois", fromMonth);
        select = addLocalFilters(select, codeDepartement, codeRegion);
        const { data, error } = await select;
        if (error) {
            throw new Error(error.message);
        }
        if (!data || !data.length) {
            return null;
        }
        return {
            courant: data[data.length - 1],
            evolution: [
                {
                    id: "total_epci",
                    label: "EPCI",
                    data: data.map((d)=>({
                            x: d.mois,
                            y: d.total_epci
                        }))
                },
                {
                    id: "total_syndicat",
                    label: "syndicats",
                    data: data.map((d)=>({
                            x: d.mois,
                            y: d.total_syndicat
                        }))
                },
                {
                    id: "total_commune",
                    label: "communes",
                    data: data.map((d)=>({
                            x: d.mois,
                            y: d.total_commune
                        }))
                }
            ]
        };
    });
}
function EvolutionTotalActivationParType({ region = "", department = "" }) {
    const { data } = useEvolutionTotalActivation(region, department);
    if (!data) return null;
    const { courant, evolution } = data;
    const legendData = getLegendData(evolution);
    const labelById = getLabelsById(evolution);
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                className: "fr-grid-row fr-grid-row--center",
                children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("h6", {
                    children: [
                        courant.total,
                        " ",
                        courant.total !== 1 ? "collectivit\xe9s activ\xe9es" : "collectivit\xe9 activ\xe9e",
                        " ",
                        "dont ",
                        courant.total_epci,
                        " EPCI,\xa0",
                        courant.total_syndicat,
                        " syndicat",
                        courant.total_syndicat !== 1 && "s",
                        " ",
                        "et\xa0",
                        courant.total_commune,
                        " commune",
                        courant.total_commune !== 1 && "s"
                    ]
                })
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                style: {
                    height: 400
                },
                children: /*#__PURE__*/ jsx_runtime_.jsx(nivo_line_cjs/* ResponsiveLine */.fH, {
                    colors: colors,
                    theme: theme,
                    data: evolution,
                    // les marges servent aux légendes
                    margin: {
                        top: 5,
                        right: 5,
                        bottom: 80,
                        left: 50
                    },
                    xScale: {
                        type: "point"
                    },
                    yScale: {
                        type: "linear",
                        min: 0,
                        max: "auto",
                        // on empile les lignes pour représenter le total
                        stacked: true
                    },
                    // les surfaces sous les lignes sont pleines
                    enableArea: true,
                    areaOpacity: 1,
                    // on interpole la ligne de façon bien passer sur les points
                    curve: "monotoneX",
                    enablePoints: false,
                    yFormat: " >-.0f",
                    axisBottom: axisBottomAsDate,
                    axisLeft: axisLeftMiddleLabel("\xc9volution des collectivit\xe9s activ\xe9es"),
                    pointColor: {
                        theme: "background"
                    },
                    pointBorderWidth: 3,
                    pointBorderColor: {
                        from: "serieColor"
                    },
                    pointLabelYOffset: -12,
                    enableSlices: "x",
                    sliceTooltip: ({ slice })=>{
                        return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            style: theme.tooltip?.container,
                            children: [
                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                    children: [
                                        /*#__PURE__*/ jsx_runtime_.jsx("strong", {
                                            children: slice.points.map((p)=>p.data.y).reduce((a, b)=>a + b, 0)
                                        }),
                                        " ",
                                        "collectivit\xe9s, dont :"
                                    ]
                                }),
                                slice.points.map((point)=>/*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                        style: {
                                            color: point.serieColor,
                                            padding: "3px 0"
                                        },
                                        children: [
                                            point.data.yFormatted,
                                            " ",
                                            labelById[point.serieId]
                                        ]
                                    }, point.id))
                            ]
                        });
                    },
                    legends: [
                        {
                            ...bottomLegend,
                            translateX: -20,
                            translateY: 80,
                            itemWidth: 100,
                            itemsSpacing: 12,
                            data: legendData
                        }
                    ],
                    animate: false
                })
            })
        ]
    });
}

;// CONCATENATED MODULE: ./app/stats/NombreCollectivitesEngagees.tsx
/* __next_internal_client_entry_do_not_use__ default auto */ 




// Nombre de collectivités engagées dans le programme (COT ou labellisée 1ère étoile dans un des deux référentiels)
function useCollectivitesEngagees(codeRegion, codeDepartement) {
    return (0,dist/* default */.ZP)(`territoires_engages-${codeRegion}-${codeDepartement}`, async ()=>{
        let select = initSupabase/* supabase */.O.from("stats_locales_engagement_collectivite").select(undefined, {
            head: true,
            count: "exact"
        });
        if (codeDepartement) {
            // @ts-ignore
            select.url.searchParams.append("and", `(or(etoiles_eci.gte.1, etoiles_cae.gte.1, cot.eq.true),code_departement.eq.${codeDepartement})`);
        } else if (codeRegion) {
            // @ts-ignore
            select.url.searchParams.append("and", `(or(etoiles_eci.gte.1, etoiles_cae.gte.1, cot.eq.true),code_region.eq.${codeRegion})`);
        } else {
            // @ts-ignore
            select.url.searchParams.append("and", `(or(etoiles_eci.gte.1, etoiles_cae.gte.1, cot.eq.true))`);
        }
        const { count, error } = await select;
        if (error) {
            throw new Error("territoires_engages");
        }
        return count || 0;
    });
}
function useTerritoiresLabellises(codeRegion, codeDepartement) {
    return (0,dist/* default */.ZP)(`territoires_labellises-${codeRegion}-${codeDepartement}`, async ()=>{
        let select = initSupabase/* supabase */.O.from("stats_locales_engagement_collectivite").select(undefined, {
            head: true,
            count: "exact"
        });
        if (codeDepartement) {
            // @ts-ignore
            select.url.searchParams.append("and", `(or(etoiles_eci.gte.1, etoiles_cae.gte.1),code_departement.eq.${codeDepartement})`);
        } else if (codeRegion) {
            // @ts-ignore
            select.url.searchParams.append("and", `(or(etoiles_eci.gte.1, etoiles_cae.gte.1),code_region.eq.${codeRegion})`);
        } else {
            // @ts-ignore
            select.url.searchParams.append("and", `(or(etoiles_eci.gte.1, etoiles_cae.gte.1))`);
        }
        const { count, error } = await select;
        if (error) {
            throw new Error("territoires_labellises");
        }
        return count || 0;
    });
}
function useTerritoiresCOT(codeRegion, codeDepartement) {
    return (0,dist/* default */.ZP)(`territoires_cot-${codeRegion}-${codeDepartement}`, async ()=>{
        let select = initSupabase/* supabase */.O.from("stats_locales_engagement_collectivite").select(undefined, {
            head: true,
            count: "exact"
        }).eq("cot", true);
        if (codeDepartement) {
            select = select.eq("code_departement", codeDepartement);
        } else if (codeRegion) {
            select = select.eq("code_region", codeRegion);
        }
        const { count, error } = await select;
        if (error) {
            throw new Error("territoires_cot");
        }
        return count || 0;
    });
}
function NombreCollectivitesEngagees({ region = "", department = "" }) {
    const { data: cot } = useTerritoiresCOT(region, department);
    const { data: labellises } = useTerritoiresLabellises(region, department);
    const { data: engages } = useCollectivitesEngagees(region, department);
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ChartHead, {
        children: [
            formatInteger(engages || 0),
            " ",
            engages === 1 ? "Territoire Engag\xe9 " : "Territoires Engag\xe9s ",
            "Transition \xc9cologique, dont ",
            formatInteger(labellises || 0),
            " ",
            labellises === 1 ? "collectivit\xe9 labellis\xe9e" : "collectivit\xe9s labellis\xe9es",
            " ",
            "et ",
            formatInteger(cot || 0),
            " en Contrat d’Objectif Territorial (COT)"
        ]
    });
}

;// CONCATENATED MODULE: ./app/stats/NombreUtilisateurParCollectivite.tsx
/* __next_internal_client_entry_do_not_use__ default auto */ 







function useNombreUtilisateurParCollectivite(codeRegion, codeDepartement) {
    return (0,dist/* default */.ZP)(`stats_locales_evolution_nombre_utilisateur_par_collectivite-${codeRegion}-${codeDepartement}`, async ()=>{
        let select = initSupabase/* supabase */.O.from("stats_locales_evolution_nombre_utilisateur_par_collectivite").select().gte("mois", fromMonth);
        select = addLocalFilters(select, codeDepartement, codeRegion);
        const { data, error } = await select;
        if (error) {
            throw new Error("stats_evolution_nombre_utilisateur_par_collectivite");
        }
        if (!data || !data.length) {
            return null;
        }
        return {
            courant: data[data.length - 1],
            evolution: [
                {
                    id: "moyen",
                    label: "Nombre moyen d'utilisateurs",
                    data: data.map((d)=>({
                            x: d.mois,
                            y: d.moyen
                        }))
                },
                {
                    id: "maximum",
                    label: "Nombre maximum d'utilisateurs",
                    data: data.map((d)=>({
                            x: d.mois,
                            y: d.maximum
                        }))
                }
            ]
        };
    });
}
function NombreUtilisateurParCollectivite({ region = "", department = "" }) {
    const { data } = useNombreUtilisateurParCollectivite(region, department);
    if (!data) return null;
    const { courant, evolution } = data;
    const colors = [
        "#FF732C",
        "#7AB1E8"
    ];
    const legendData = getLegendData(evolution, colors);
    const labelById = getLabelsById(evolution);
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ChartHead, {
                children: [
                    "Chaque collectivit\xe9 compte en moyenne\xa0",
                    courant?.moyen?.toFixed(2),
                    " utilisateur",
                    courant?.moyen !== 1 && "s",
                    /*#__PURE__*/ jsx_runtime_.jsx("br", {}),
                    "Avec un maximum de ",
                    courant?.maximum,
                    " utilisateur",
                    courant?.maximum !== 1 && "s",
                    " \uD83D\uDCAA"
                ]
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                className: "fr-grid-row fr-grid-row--center"
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                style: {
                    height: 300
                },
                children: /*#__PURE__*/ jsx_runtime_.jsx(nivo_line_cjs/* ResponsiveLine */.fH, {
                    colors: colors,
                    theme: theme,
                    data: evolution,
                    // les marges servent aux légendes
                    margin: {
                        top: 5,
                        right: 5,
                        bottom: 120,
                        left: 50
                    },
                    xScale: {
                        type: "point"
                    },
                    yScale: {
                        type: "linear",
                        min: 0,
                        max: "auto",
                        stacked: false
                    },
                    // on interpole la ligne de façon bien passer sur les points
                    curve: "monotoneX",
                    lineWidth: 2,
                    pointSize: 0,
                    enableGridY: false,
                    yFormat: " >-.2f",
                    axisBottom: axisBottomAsDate,
                    axisLeft: axisLeftMiddleLabel("Utilisateurs/collectivit\xe9"),
                    pointColor: {
                        theme: "background"
                    },
                    pointBorderWidth: 4,
                    pointBorderColor: {
                        from: "serieColor"
                    },
                    pointLabelYOffset: -12,
                    enableSlices: "x",
                    sliceTooltip: (props)=>/*#__PURE__*/ jsx_runtime_.jsx(SliceTooltip, {
                            ...props,
                            labels: labelById
                        }),
                    legends: [
                        {
                            ...bottomLegend,
                            data: legendData,
                            direction: "column",
                            translateX: -20,
                            translateY: 120,
                            itemWidth: 230
                        }
                    ],
                    animate: false
                })
            })
        ]
    });
}

;// CONCATENATED MODULE: ./app/stats/StatisticsDisplay.tsx
/* __next_internal_client_entry_do_not_use__ default auto */ 












const StatisticsDisplay = ({ regionCode, departmentCode })=>{
    const nationalStats = !regionCode && !departmentCode;
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(jsx_runtime_.Fragment, {
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(Section/* default */.Z, {
                customBackground: "#fff",
                children: [
                    nationalStats ? /*#__PURE__*/ jsx_runtime_.jsx("p", {
                        children: "Territoires en Transitions est une plateforme publique gratuite et open-source d\xe9velopp\xe9e avec ses utilisateurs afin d’aider les collectivit\xe9s dans le pilotage et la priorisation de leur transition \xe9cologique."
                    }) : /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
                        children: [
                            "Cette page pr\xe9sente les statistiques de d\xe9ploiement et d’usage",
                            " ",
                            !!regionCode ? "r\xe9gionales" : "d\xe9partementales",
                            " de la plateforme Territoires en Transitions."
                        ]
                    }),
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)(SectionHead, {
                        children: [
                            "D\xe9ployer la transition \xe9cologique sur la totalit\xe9 du territoire",
                            nationalStats && " national"
                        ]
                    }),
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
                        children: [
                            "La transition \xe9cologique n\xe9cessite d’\xeatre d\xe9ploy\xe9e sur la totalit\xe9 des intercommunalit\xe9s (1254 EPCI \xe0 fiscalit\xe9 propre au 1er janvier 2022) ainsi que leurs communes et syndicats associ\xe9s qui ont une responsabilit\xe9 et une influence forte sur la planification et la mise en œuvre de la transition \xe9cologique \xe0 l’\xe9chelle locale.",
                            /*#__PURE__*/ jsx_runtime_.jsx("br", {}),
                            "Les statistiques suivantes pr\xe9sentent le nombre de collectivit\xe9s activ\xe9es sur la plateforme. Une collectivit\xe9 est consid\xe9r\xe9e comme activ\xe9e lorsqu’au moins une personne utilisatrice a \xe9t\xe9 rattach\xe9e \xe0 cette collectivit\xe9 sur la plateforme."
                        ]
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(EvolutionTotalActivationParType, {
                        region: regionCode,
                        department: departmentCode
                    }),
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ChartHead, {
                        children: [
                            "Progression de l’activation des EPCI \xe0 fiscalit\xe9 propre",
                            nationalStats && " sur le territoire national"
                        ]
                    }),
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                        className: "fr-grid-row fr-grid-row--center",
                        children: [
                            nationalStats && /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "fr-col-xs-12 fr-col-sm-12 fr-col-md-4 fr-col-lg-4 fr-ratio-1x1",
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx(ChartTitle, {
                                        children: "Nombre EPCI actifs"
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx(CarteEpciParDepartement, {
                                        valeur: "actives",
                                        maximum: "actives_max"
                                    })
                                ]
                            }),
                            nationalStats && /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "fr-col-xs-12 fr-col-sm-12 fr-col-md-4 fr-col-lg-4 fr-ratio-1x1",
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx(ChartTitle, {
                                        children: "Pourcentage EPCI actifs"
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx(CarteEpciParDepartement, {
                                        valeur: "ratio",
                                        maximum: "ratio_max"
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "fr-col-xs-12 fr-col-sm-12 fr-col-md-4 fr-col-lg-4 fr-ratio-1x1",
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx(ChartTitle, {
                                        children: "Progression globale"
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx(CollectiviteActivesEtTotalParType, {
                                        region: regionCode,
                                        department: departmentCode
                                    })
                                ]
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(Section/* default */.Z, {
                customBackground: "#fff",
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx(SectionHead, {
                        children: "Outiller les personnes charg\xe9es de la planification \xe9cologique"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("p", {
                        children: "La transition \xe9cologique est un sujet transversal et syst\xe9mique qui concerne de nombreuses personnes au sein d’une collectivit\xe9 : les diff\xe9rent(e)s charg\xe9(e)s de mission (climat, \xe9conomie circulaire, urbanisme, mobilit\xe9s, biodiversit\xe9…), coordinatrices de programmes, des services techniques, ainsi que les partenaires et prestataires avec lesquels travaille la collectivit\xe9. La plateforme facilite la collaboration entre les personnes qui travaillent au sein d’une m\xeame \xe9quipe pour faire avancer l’action de la collectivit\xe9."
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(ActiveUsers, {
                        region: regionCode,
                        department: departmentCode
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(NombreUtilisateurParCollectivite, {
                        region: regionCode,
                        department: departmentCode
                    })
                ]
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(Section/* default */.Z, {
                className: "flex-col",
                customBackground: "#fff",
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx(SectionHead, {
                        children: "Conna\xeetre l’\xe9tat des lieux des forces et faiblesses de chaque territoire"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("p", {
                        children: "L’\xe9tat des lieux est une \xe9tape incontournable dans toute d\xe9marche de planification. Pour accompagner les collectivit\xe9s dans cet exercice, la plateforme Territoires en Transitions s’appuie sur les r\xe9f\xe9rentiels Climat, Air, Energie et Economie Circulaire de l’ADEME."
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(EtatDesLieux, {
                        region: regionCode,
                        department: departmentCode
                    })
                ]
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(Section/* default */.Z, {
                customBackground: "#fff",
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx(SectionHead, {
                        children: "Planifier et prioriser les actions en faveur de la transition \xe9cologique"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("p", {
                        children: "Pour suivre la progression des actions d\xe9cid\xe9es, les collectivit\xe9s sont amen\xe9es \xe0 suivre de nombreux plans d’actions politiques et r\xe9glementaires tels que des Plans de Transition \xc9cologique, Plans Climat Air \xc9nergie Territoriaux (PCAET), Plans \xe9conomie circulaire, Plans de mobilit\xe9, Plans v\xe9lo, etc. Elles ont besoin d’un outil qui leur permette de suivre la progression des actions pr\xe9vues dans ces plans."
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(EvolutionPlansAction, {
                        region: regionCode,
                        department: departmentCode
                    })
                ]
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(Section/* default */.Z, {
                customBackground: "#fff",
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx(SectionHead, {
                        children: "Suivre les indicateurs cl\xe9s de r\xe9alisation et d’impact de la transition \xe9cologique"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("p", {
                        children: "Afin d’objectiver la progression des actions les collectivit\xe9s mesurent la progression au moyen d’indicateurs de r\xe9alisation et d’impact de r\xe9f\xe9rence ou personnalis\xe9s."
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(EvolutionIndicateurs, {
                        region: regionCode,
                        department: departmentCode
                    })
                ]
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(Section/* default */.Z, {
                customBackground: "#fff",
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx(SectionHead, {
                        children: "Partager et valoriser la progression de chaque territoire"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("p", {
                        children: "Lorsqu’elles r\xe9alisent leur \xe9tat des lieux sur la plateforme, les collectivit\xe9s \xe9valuent leur performance au regard des r\xe9f\xe9rentiels nationaux. Elles obtiennent ainsi un score qui leur permet d’acc\xe9der \xe0 la labellisation “Territoire Engag\xe9 Transition Ecologique”."
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(NombreCollectivitesEngagees, {
                        region: regionCode,
                        department: departmentCode
                    }),
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                        className: "fr-grid-row fr-grid-row--center fr-grid-row--gutters",
                        children: [
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "fr-col-xs-12 fr-col-sm-12 fr-col-md-5 fr-col-lg-5",
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx(ChartTitle, {
                                        children: "Nombre de labellis\xe9s CAE par niveau de labellisation"
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx(CollectivitesLabellisees, {
                                        referentiel: "cae",
                                        region: regionCode,
                                        department: departmentCode
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "fr-col-xs-12 fr-col-sm-12 fr-col-md-5 fr-col-lg-5",
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx(ChartTitle, {
                                        children: "Nombre de labellis\xe9s ECI par niveau de labellisation"
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx(CollectivitesLabellisees, {
                                        referentiel: "eci",
                                        region: regionCode,
                                        department: departmentCode
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });
};
/* harmony default export */ const stats_StatisticsDisplay = (StatisticsDisplay);


/***/ }),

/***/ 32862:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ layout)
});

// EXTERNAL MODULE: external "next/dist/compiled/react-experimental/jsx-runtime"
var jsx_runtime_ = __webpack_require__(76931);
// EXTERNAL MODULE: ./components/sections/Section.tsx
var Section = __webpack_require__(75846);
// EXTERNAL MODULE: external "next/dist/compiled/react-experimental"
var react_experimental_ = __webpack_require__(17640);
// EXTERNAL MODULE: ./node_modules/swr/core/dist/index.mjs + 1 modules
var dist = __webpack_require__(97146);
// EXTERNAL MODULE: ./app/initSupabase.ts
var initSupabase = __webpack_require__(37121);
// EXTERNAL MODULE: ./node_modules/next/navigation.js
var navigation = __webpack_require__(57114);
;// CONCATENATED MODULE: ./components/inputs/Select.tsx

const Select = ({ name, label, emptyOptionLabel, options, value, style, onChange })=>{
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
        style: style,
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx("label", {
                className: "fr-label",
                htmlFor: name,
                children: label
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("select", {
                onChange: (e)=>onChange(e.target.value),
                value: value,
                className: "fr-select",
                id: name,
                name: name,
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx("option", {
                        value: "",
                        children: emptyOptionLabel ?? "S\xe9lectionnez une option"
                    }, "none"),
                    options.map((opt)=>/*#__PURE__*/ jsx_runtime_.jsx("option", {
                            value: opt.value,
                            children: opt.name
                        }, opt.value))
                ]
            })
        ]
    });
};
/* harmony default export */ const inputs_Select = (Select);

;// CONCATENATED MODULE: ./app/stats/RegionAndDeptFilters.tsx
/* __next_internal_client_entry_do_not_use__ default auto */ 





/**
 * Toutes les régions.
 */ function useRegion() {
    return (0,dist/* default */.ZP)("region", async ()=>{
        const { data, error } = await initSupabase/* supabase */.O.from("region").select();
        if (error) {
            throw new Error(error.message);
        }
        return data ? data : null;
    });
}
/**
 * Les départements filtrables par code région.
 *
 * @param regionCode le code région ou une chaine vide.
 */ function useDepartment(regionCode) {
    return (0,dist/* default */.ZP)(`departement-${regionCode}`, async ()=>{
        let select = initSupabase/* supabase */.O.from("departement").select();
        if (regionCode) select = select.eq("region_code", regionCode);
        const { data, error } = await select;
        if (error) {
            throw new Error(error.message);
        }
        return data ? data : null;
    });
}
const emptyString = "";
const RegionAndDeptFilters = ({ onChange })=>{
    const router = (0,navigation.useRouter)();
    const pathName = (0,navigation.usePathname)() ?? "";
    const [selectedRegion, setSelectedRegion] = (0,react_experimental_.useState)(emptyString);
    const [selectedDepartment, setSelectedDepartment] = (0,react_experimental_.useState)(emptyString);
    const regions = useRegion().data;
    const departments = useDepartment(selectedRegion).data;
    const changeDepartmentName = ()=>{
        const newDepartment = departments?.find((dept)=>dept.code === selectedDepartment);
        onChange(newDepartment?.libelle ?? null);
    };
    const changeRegionName = ()=>{
        const newRegion = regions?.find((region)=>region.code === selectedRegion);
        onChange(newRegion?.libelle ?? null);
    };
    (0,react_experimental_.useEffect)(()=>{
        // Mise à jour des states selectedDepartment et selectedRegion
        // + du titre lors du changement d'url
        const pathArray = pathName.split("/");
        if (pathArray.length === 2 && pathArray[1] === "stats") {
            setSelectedDepartment(emptyString);
            setSelectedRegion(emptyString);
            onChange(null);
        } else if (pathArray.length === 4 && pathArray[1] === "stats") {
            if (pathArray[2] === "region") {
                setSelectedRegion(pathArray[3]);
                setSelectedDepartment(emptyString);
            } else if (pathArray[2] === "departement") {
                setSelectedDepartment(pathArray[3]);
            }
        }
    }, [
        pathName,
        onChange
    ]);
    (0,react_experimental_.useEffect)(()=>{
        // Permet la mise à jour du titre quand l'url
        // est mis à jour manuellement
        // (enclenche le rechargement de regions et departements)
        if (selectedDepartment) changeDepartmentName();
        else if (selectedRegion) changeRegionName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        regions,
        departments
    ]);
    (0,react_experimental_.useEffect)(()=>{
        // Redirige vers la nouvelle page stats quand
        // selectedDepartment est modifié
        if (!!selectedDepartment) {
            changeDepartmentName();
            router.push(`/stats/departement/${selectedDepartment}`);
        } else {
            if (!!selectedRegion) {
                changeRegionName();
                router.push(`/stats/region/${selectedRegion}`);
            } else router.push(`/stats/`);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        selectedDepartment,
        router
    ]);
    (0,react_experimental_.useEffect)(()=>{
        // Redirige vers la nouvelle page stats quand
        // selectedRegion est modifié
        if (!!selectedRegion) {
            changeRegionName();
            router.push(`/stats/region/${selectedRegion}`);
        } else router.push(`/stats/`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        selectedRegion,
        router
    ]);
    if (!regions || !departments) return null;
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
        className: "fr-select-group",
        style: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            columnGap: "50px",
            rowGap: "20px",
            justifyItems: "start",
            alignItems: "end"
        },
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx(inputs_Select, {
                name: "region",
                label: "R\xe9gion",
                emptyOptionLabel: "Toutes les r\xe9gions",
                // @ts-ignore
                options: regions.map((region)=>({
                        value: region.code,
                        name: region.libelle
                    })),
                value: selectedRegion,
                style: {
                    width: "100%"
                },
                onChange: setSelectedRegion
            }),
            /*#__PURE__*/ jsx_runtime_.jsx(inputs_Select, {
                name: "department",
                label: "D\xe9partement",
                emptyOptionLabel: "Tous les d\xe9partements",
                // @ts-ignore
                options: departments.map((department)=>({
                        value: department.code,
                        name: department.libelle
                    })),
                value: selectedDepartment,
                style: {
                    width: "100%"
                },
                onChange: setSelectedDepartment
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("button", {
                className: "fr-btn fr-btn--secondary",
                onClick: ()=>{
                    setSelectedRegion(emptyString);
                    setSelectedDepartment(emptyString);
                },
                style: {
                    visibility: selectedDepartment || selectedRegion ? "visible" : "hidden"
                },
                children: "D\xe9sactiver tous les filtres"
            })
        ]
    });
};
/* harmony default export */ const stats_RegionAndDeptFilters = (RegionAndDeptFilters);

;// CONCATENATED MODULE: ./app/stats/layout.tsx
/* __next_internal_client_entry_do_not_use__ default auto */ 



/**
 * Layout de la page Statistiques
 *
 * @param children - Composant enfant à inclure dans le layout
 */ const StatsLayout = ({ children })=>{
    const [title, setTitle] = (0,react_experimental_.useState)(null);
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(jsx_runtime_.Fragment, {
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(Section/* default */.Z, {
                containerClassName: "!pb-0",
                customBackground: "#fff",
                children: [
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("h1", {
                        children: [
                            "Statistiques",
                            title ? ` - ${title}` : ""
                        ]
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(stats_RegionAndDeptFilters, {
                        onChange: setTitle
                    })
                ]
            }),
            children
        ]
    });
};
/* harmony default export */ const layout = (StatsLayout);


/***/ }),

/***/ 75846:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Z: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(76931);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(89367);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_1__);


const Section = ({ id, children, containerClassName = "", className = "", customBackground })=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("section", {
        id: id,
        className: classnames__WEBPACK_IMPORTED_MODULE_1___default()("section fr-py-7w", containerClassName),
        style: {
            backgroundColor: customBackground
        },
        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
            className: classnames__WEBPACK_IMPORTED_MODULE_1___default()("fr-container flex flex-col gap-4", className),
            children: children
        })
    });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Section);


/***/ }),

/***/ 24279:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ZP: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony exports __esModule, $$typeof */
/* harmony import */ var next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(61363);

const proxy = (0,next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__.createProxy)(String.raw`/Users/mariheck/Workspace/territoires-en-transitions/site/app/stats/StatisticsDisplay.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule, $$typeof } = proxy;
const __default__ = proxy.default;


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__default__);

/***/ }),

/***/ 71135:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   $$typeof: () => (/* binding */ $$typeof),
/* harmony export */   __esModule: () => (/* binding */ __esModule),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(61363);

const proxy = (0,next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__.createProxy)(String.raw`/Users/mariheck/Workspace/territoires-en-transitions/site/app/stats/layout.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule, $$typeof } = proxy;
const __default__ = proxy.default;


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__default__);

/***/ })

};
;