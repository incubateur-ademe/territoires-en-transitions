exports.id = 680;
exports.ids = [680];
exports.modules = {

/***/ 42612:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 81753))

/***/ }),

/***/ 87388:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 31232, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 52987, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 50831, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 56926, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 44282, 23))

/***/ }),

/***/ 81753:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ app_AppHeader)
});

// EXTERNAL MODULE: external "next/dist/compiled/react-experimental/jsx-runtime"
var jsx_runtime_ = __webpack_require__(76931);
// EXTERNAL MODULE: ./node_modules/next/image.js
var next_image = __webpack_require__(52451);
var image_default = /*#__PURE__*/__webpack_require__.n(next_image);
// EXTERNAL MODULE: ./node_modules/next/navigation.js
var navigation = __webpack_require__(57114);
// EXTERNAL MODULE: ./node_modules/next/link.js
var next_link = __webpack_require__(11440);
var link_default = /*#__PURE__*/__webpack_require__.n(next_link);
;// CONCATENATED MODULE: ./app/MenuPrincipal.tsx
/* __next_internal_client_entry_do_not_use__ MenuPrincipal auto */ 


function MenuItem(props) {
    const { href, children, setMenuOpened } = props;
    const pathName = (0,navigation.usePathname)();
    const pathNameBase = pathName?.split("/").splice(0, 2).join("/");
    return /*#__PURE__*/ jsx_runtime_.jsx("li", {
        className: "fr-nav__item",
        children: /*#__PURE__*/ jsx_runtime_.jsx((link_default()), {
            href: href,
            target: "_self",
            "aria-controls": "modal-header__menu",
            className: "fr-nav__link",
            "aria-current": href === pathNameBase ? "page" : undefined,
            onClick: ()=>setMenuOpened(false),
            children: children
        })
    });
}
function MenuPrincipal(props) {
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("ul", {
        className: "fr-nav__list",
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx(MenuItem, {
                href: "/",
                ...props,
                children: "Accueil"
            }),
            /*#__PURE__*/ jsx_runtime_.jsx(MenuItem, {
                href: "/programme",
                ...props,
                children: "Le programme Territoire Engag\xe9"
            }),
            /*#__PURE__*/ jsx_runtime_.jsx(MenuItem, {
                href: "/actus",
                ...props,
                children: "Actualit\xe9s"
            }),
            /*#__PURE__*/ jsx_runtime_.jsx(MenuItem, {
                href: "/faq",
                ...props,
                children: "Questions fr\xe9quentes"
            }),
            /*#__PURE__*/ jsx_runtime_.jsx(MenuItem, {
                href: "/stats",
                ...props,
                children: "Statistiques"
            }),
            /*#__PURE__*/ jsx_runtime_.jsx(MenuItem, {
                href: "/contact",
                ...props,
                children: "Contact"
            })
        ]
    });
}

// EXTERNAL MODULE: ./node_modules/@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.css
var icons_user = __webpack_require__(58662);
// EXTERNAL MODULE: ./node_modules/@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.css
var icons_system = __webpack_require__(67903);
// EXTERNAL MODULE: external "next/dist/compiled/react-experimental"
var react_experimental_ = __webpack_require__(17640);
// EXTERNAL MODULE: ./node_modules/classnames/index.js
var classnames = __webpack_require__(89367);
var classnames_default = /*#__PURE__*/__webpack_require__.n(classnames);
;// CONCATENATED MODULE: ./app/AppHeader.tsx
/* __next_internal_client_entry_do_not_use__ default auto */ 






function Brand({ menuOpened, setMenuOpened }) {
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
        className: "fr-header__brand-top",
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                className: "fr-header__logo",
                children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
                    className: "fr-logo",
                    children: [
                        "R\xe9publique",
                        /*#__PURE__*/ jsx_runtime_.jsx("br", {}),
                        "Fran\xe7aise"
                    ]
                })
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                className: "fr-header__operator",
                children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                    className: "fr-grid-row",
                    style: {
                        minWidth: 160 + "px"
                    },
                    children: [
                        /*#__PURE__*/ jsx_runtime_.jsx((image_default()), {
                            src: "/ademe.jpg",
                            alt: "ADEME",
                            width: "70",
                            height: "80"
                        }),
                        /*#__PURE__*/ jsx_runtime_.jsx((image_default()), {
                            src: "/territoire-engage.jpg",
                            alt: "ADEME",
                            width: "80",
                            height: "80"
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                className: "fr-header__navbar",
                children: /*#__PURE__*/ jsx_runtime_.jsx("button", {
                    "data-fr-opened": menuOpened,
                    "aria-controls": "modal-header__menu",
                    "aria-haspopup": "menu",
                    id: "button-861",
                    title: "Menu",
                    className: "fr-btn--menu fr-btn",
                    onClick: ()=>setMenuOpened((prevState)=>!prevState),
                    children: "Menu"
                })
            })
        ]
    });
}
function Links() {
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("ul", {
        className: "fr-btns-group",
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx("li", {
                children: /*#__PURE__*/ jsx_runtime_.jsx("a", {
                    href: "https://app.territoiresentransitions.fr/auth/signup",
                    className: "fr-btn fr-icon-add-circle-line",
                    children: "Cr\xe9er un compte"
                })
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("li", {
                children: /*#__PURE__*/ jsx_runtime_.jsx("a", {
                    href: "https://app.territoiresentransitions.fr/auth/signin",
                    className: "fr-btn fr-icon-account-line",
                    children: "Se connecter"
                })
            })
        ]
    });
}
function Body(props) {
    return /*#__PURE__*/ jsx_runtime_.jsx("div", {
        className: "fr-header__body",
        children: /*#__PURE__*/ jsx_runtime_.jsx("div", {
            className: "fr-container",
            children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                className: "fr-header__body-row",
                children: [
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                        className: "fr-header__brand fr-enlarge-link",
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx(Brand, {
                                ...props
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                className: "fr-header__service",
                                children: /*#__PURE__*/ jsx_runtime_.jsx("a", {
                                    href: "/",
                                    "aria-current": "page",
                                    title: "Accueil - Territoires en Transitions",
                                    className: "router-link-exact-active router-link-active",
                                    children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
                                        className: "fr-header__service-title",
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                                style: {
                                                    fontSize: "x-large",
                                                    fontWeight: "bold"
                                                },
                                                children: "Territoires en Transitions"
                                            }),
                                            /*#__PURE__*/ jsx_runtime_.jsx("br", {}),
                                            /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                                style: {
                                                    fontSize: "small",
                                                    fontWeight: "normal"
                                                },
                                                children: "Accompagner la transition \xe9cologique des collectivit\xe9s"
                                            })
                                        ]
                                    })
                                })
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("div", {
                        className: "fr-header__tools",
                        children: /*#__PURE__*/ jsx_runtime_.jsx("div", {
                            className: "fr-header__tools-links",
                            children: /*#__PURE__*/ jsx_runtime_.jsx(Links, {})
                        })
                    })
                ]
            })
        })
    });
}
function Menu({ menuOpened, setMenuOpened }) {
    return /*#__PURE__*/ jsx_runtime_.jsx("div", {
        id: "modal-header__menu",
        "aria-labelledby": "button-861",
        className: classnames_default()("fr-header__menu fr-modal", {
            "fr-modal--opened": menuOpened
        }),
        role: menuOpened ? "dialog" : undefined,
        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
            className: "fr-container",
            children: [
                /*#__PURE__*/ jsx_runtime_.jsx("button", {
                    "aria-controls": "modal-header__menu",
                    className: "fr-btn fr-btn--close",
                    onClick: ()=>setMenuOpened(false),
                    children: "Fermer"
                }),
                /*#__PURE__*/ jsx_runtime_.jsx("div", {
                    className: "fr-header__menu-links",
                    children: /*#__PURE__*/ jsx_runtime_.jsx(Links, {})
                }),
                /*#__PURE__*/ jsx_runtime_.jsx("nav", {
                    id: "navigation-866",
                    role: "navigation",
                    "aria-label": "Menu principal",
                    className: "fr-nav",
                    children: /*#__PURE__*/ jsx_runtime_.jsx(MenuPrincipal, {
                        menuOpened,
                        setMenuOpened
                    })
                })
            ]
        })
    });
}
const AppHeader = ()=>{
    const [menuOpened, setMenuOpened] = (0,react_experimental_.useState)(false);
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("header", {
        role: "banner",
        id: "header-navigation",
        className: "fr-header",
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx(Body, {
                menuOpened,
                setMenuOpened
            }),
            /*#__PURE__*/ jsx_runtime_.jsx(Menu, {
                menuOpened,
                setMenuOpened
            })
        ]
    });
};
/* harmony default export */ const app_AppHeader = (AppHeader);


/***/ }),

/***/ 51012:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ RootLayout),
  generateMetadata: () => (/* binding */ generateMetadata)
});

// EXTERNAL MODULE: external "next/dist/compiled/react-experimental/jsx-runtime"
var jsx_runtime_ = __webpack_require__(76931);
// EXTERNAL MODULE: ./node_modules/next/dist/build/webpack/loaders/next-flight-loader/module-proxy.js
var module_proxy = __webpack_require__(61363);
;// CONCATENATED MODULE: ./app/AppHeader.tsx

const proxy = (0,module_proxy.createProxy)(String.raw`/Users/mariheck/Workspace/territoires-en-transitions/site/app/AppHeader.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule, $$typeof } = proxy;
const __default__ = proxy.default;


/* harmony default export */ const AppHeader = (__default__);
// EXTERNAL MODULE: ./node_modules/@gouvfr/dsfr/dist/dsfr.css
var dsfr = __webpack_require__(95890);
// EXTERNAL MODULE: ./app/global.css
var global = __webpack_require__(32136);
;// CONCATENATED MODULE: ./components/logo/LogoRepubliqueFrancaise.tsx

const LogoRepubliqueFrancaise = ()=>{
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
        className: "fr-logo",
        title: "r\xe9publique fran\xe7aise",
        children: [
            "r\xe9publique",
            /*#__PURE__*/ jsx_runtime_.jsx("br", {}),
            "fran\xe7aise"
        ]
    });
};
/* harmony default export */ const logo_LogoRepubliqueFrancaise = (LogoRepubliqueFrancaise);

;// CONCATENATED MODULE: ./components/footer/Footer.tsx


const Footer = ()=>{
    return /*#__PURE__*/ jsx_runtime_.jsx("footer", {
        className: "fr-footer",
        role: "contentinfo",
        id: "footer",
        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
            className: "fr-container",
            children: [
                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                    className: "fr-footer__body",
                    children: [
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            className: "fr-footer__brand",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx(logo_LogoRepubliqueFrancaise, {}),
                                /*#__PURE__*/ jsx_runtime_.jsx("picture", {
                                    children: /*#__PURE__*/ jsx_runtime_.jsx("img", {
                                        className: "fr-footer__logo fr-ml-2w",
                                        width: "128",
                                        height: "146",
                                        src: "/ademe.svg",
                                        alt: "ADEME",
                                        loading: "lazy"
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            className: "fr-footer__content",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                    className: "fr-footer__content-desc",
                                    children: "Territoires en Transitions est une startup d'\xc9tat port\xe9e par l'Agence de la Transition \xc9cologique (ADEME) avec le soutien de l'Agence Nationale de la Coh\xe9sion des Territoires (ANCT)."
                                }),
                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("ul", {
                                    className: "fr-footer__content-list",
                                    children: [
                                        /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                            className: "fr-footer__content-item",
                                            children: /*#__PURE__*/ jsx_runtime_.jsx("a", {
                                                className: "fr-footer__content-link",
                                                href: "https://www.ademe.fr/",
                                                target: "_blank",
                                                rel: "noreferrer",
                                                children: "ademe.fr"
                                            })
                                        }),
                                        /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                            className: "fr-footer__content-item",
                                            children: /*#__PURE__*/ jsx_runtime_.jsx("a", {
                                                className: "fr-footer__content-link",
                                                href: "https://beta.gouv.fr/",
                                                target: "_blank",
                                                rel: "noreferrer",
                                                children: "beta.gouv"
                                            })
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                    className: "fr-footer__bottom",
                    children: [
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("ul", {
                            className: "fr-footer__bottom-list",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                    className: "fr-footer__bottom-item",
                                    children: /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                        className: "fr-footer__bottom-link",
                                        children: /*#__PURE__*/ jsx_runtime_.jsx("a", {
                                            className: "fr-footer__bottom-link",
                                            href: "/accessibilite",
                                            children: "Accessibilit\xe9 : non conforme"
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                    className: "fr-footer__bottom-item",
                                    children: /*#__PURE__*/ jsx_runtime_.jsx("a", {
                                        className: "fr-footer__bottom-link",
                                        href: "/mentions",
                                        children: "Mentions l\xe9gales"
                                    })
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                    className: "fr-footer__bottom-item",
                                    children: /*#__PURE__*/ jsx_runtime_.jsx("a", {
                                        className: "fr-footer__bottom-link",
                                        href: "https://www.ademe.fr/donnees-personnelles/",
                                        target: "_blank",
                                        rel: "noreferrer",
                                        children: "Donn\xe9es personnelles"
                                    })
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                    className: "fr-footer__bottom-item",
                                    children: /*#__PURE__*/ jsx_runtime_.jsx("a", {
                                        className: "fr-footer__bottom-link",
                                        href: "/cookies",
                                        children: "Gestion des cookies"
                                    })
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                    className: "fr-footer__bottom-item",
                                    children: /*#__PURE__*/ jsx_runtime_.jsx("a", {
                                        className: "fr-footer__bottom-link",
                                        href: "https://github.com/betagouv/territoires-en-transitions",
                                        target: "_blank",
                                        rel: "noreferrer",
                                        children: "Code source"
                                    })
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("li", {
                                    className: "fr-footer__bottom-item",
                                    children: /*#__PURE__*/ jsx_runtime_.jsx("a", {
                                        className: "fr-footer__bottom-link",
                                        href: "/cgu",
                                        children: "Conditions g\xe9n\xe9rales d’utilisation"
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsx_runtime_.jsx("div", {
                            className: "fr-footer__bottom-copy",
                            children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
                                children: [
                                    "Sauf mention contraire, tous les contenus de ce site sont sous",
                                    " ",
                                    /*#__PURE__*/ jsx_runtime_.jsx("a", {
                                        href: "https://github.com/etalab/licence-ouverte/blob/master/LO.md",
                                        target: "_blank",
                                        rel: "noreferrer",
                                        children: "licence etalab-2.0"
                                    })
                                ]
                            })
                        })
                    ]
                })
            ]
        })
    });
};

// EXTERNAL MODULE: ./node_modules/next/headers.js
var headers = __webpack_require__(40063);
// EXTERNAL MODULE: ./app/utils.ts
var utils = __webpack_require__(30853);
;// CONCATENATED MODULE: ./app/layout.tsx







async function generateMetadata() {
    const data = await (0,utils/* getMetaData */.g2)();
    const headersList = (0,headers.headers)();
    const baseUrl = headersList.get("host") ?? "";
    const pathname = headersList.get("x-invoke-path") ?? "";
    return {
        title: {
            default: data.title ?? "Territoires en Transitions",
            template: `%s | ${data.title ?? "Territoires en Transitions"}`
        },
        description: data.description,
        viewport: {
            width: "device-width",
            initialScale: 1
        },
        icons: {
            icon: "/favicon.ico",
            other: [
                {
                    rel: "icon",
                    url: "/favicon-32x32.png",
                    type: "image/png",
                    sizes: "32x32"
                },
                {
                    rel: "icon",
                    url: "/favicon-16x16.png",
                    type: "image/png",
                    sizes: "16x16"
                }
            ]
        },
        robots: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1
        },
        twitter: {
            card: "summary_large_image"
        },
        openGraph: {
            title: data.title ?? "Territoires en Transitions",
            description: data.description,
            url: `${baseUrl}${pathname !== "/" ? pathname : ""}`,
            siteName: data.title ?? "Territoires en Transitions",
            images: data.image ? [
                {
                    url: data.image.url,
                    width: data.image.width,
                    height: data.image.height,
                    type: data.image.type,
                    alt: data.image.alt
                }
            ] : [],
            locale: "fr_FR",
            type: "website"
        }
    };
}
function RootLayout({ children }) {
    return /*#__PURE__*/ jsx_runtime_.jsx("html", {
        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("body", {
            className: "min-h-screen flex flex-col justify-between",
            children: [
                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                    children: [
                        /*#__PURE__*/ jsx_runtime_.jsx(AppHeader, {}),
                        /*#__PURE__*/ jsx_runtime_.jsx("div", {
                            className: "homepage-container fr-container-fluid",
                            children: children
                        })
                    ]
                }),
                /*#__PURE__*/ jsx_runtime_.jsx(Footer, {})
            ]
        })
    });
}


/***/ }),

/***/ 30853:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LE: () => (/* binding */ convertNameToSlug),
/* harmony export */   Pc: () => (/* binding */ sortByRank),
/* harmony export */   Yu: () => (/* binding */ getData),
/* harmony export */   g2: () => (/* binding */ getMetaData)
/* harmony export */ });
/* unused harmony export toLocaleFixed */
/* harmony import */ var src_strapi_strapi__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(11044);

const getMetaData = async ()=>{
    const data = await (0,src_strapi_strapi__WEBPACK_IMPORTED_MODULE_0__/* .fetchSingle */ .tl)("metadata", [
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
    const data = await (0,src_strapi_strapi__WEBPACK_IMPORTED_MODULE_0__/* .fetchSingle */ .tl)("accueil", [
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
    const temoignages = await (0,src_strapi_strapi__WEBPACK_IMPORTED_MODULE_0__/* .fetchCollection */ .lA)("temoignages", [
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


/***/ }),

/***/ 11044:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   iY: () => (/* binding */ fetchItem),
/* harmony export */   lA: () => (/* binding */ fetchCollection),
/* harmony export */   tl: () => (/* binding */ fetchSingle)
/* harmony export */ });
const baseURL = "https://passionate-wonder-8e064cba29.strapiapp.com";
const apiKey = "34027b5596a144e1e2c53d0cb4eee826b7f7e5166d1e80752ca1fd769e5d2a8e8d575c040867902bb98225c0ce83781ea21611d0e16afd84897e96b0ab160806aa697ec64eb6c5eeb1e3803d1837c3fa28e2f7e1e49428c3cd64b9643ae1dde4ff5164c6a3dba79bc563ecbe4fefb8cc0bc8ee7987f4ce1d21194422264655d6";
const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
};
async function fetchCollection(path, params = [
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
const fetchSingle = async (path, params = [
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


/***/ }),

/***/ 32136:
/***/ (() => {



/***/ })

};
;