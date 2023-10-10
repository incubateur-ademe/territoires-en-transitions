"use strict";
exports.id = 975;
exports.ids = [975];
exports.modules = {

/***/ 89983:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(76931);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(17640);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var src_utils_processMarkedContent__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(31282);
/* __next_internal_client_entry_do_not_use__ default auto */ 


const InfoArticle = ({ texte })=>{
    const [processedText, setProcessedText] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)("");
    const processContent = async (texte)=>{
        const newText = await (0,src_utils_processMarkedContent__WEBPACK_IMPORTED_MODULE_2__/* .processMarkedContent */ .Y)(texte);
        setProcessedText(newText);
    };
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{
        if (texte) processContent(texte);
    }, [
        texte
    ]);
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
        className: "fr-callout w-full bg-[#f5f5fe] my-8",
        style: {
            boxShadow: "inset 0.25rem 0 0 0 #000091"
        },
        dangerouslySetInnerHTML: {
            __html: processedText
        }
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (InfoArticle);


/***/ }),

/***/ 21860:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(76931);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _components_strapiImage_StrapiImage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(64603);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(89367);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(17640);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var src_utils_processMarkedContent__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(31282);
/* __next_internal_client_entry_do_not_use__ default auto */ 




const ParagrapheArticle = ({ paragraphe: { titre, texte, image, alignementImage, legendeVisible } })=>{
    const [processedText, setProcessedText] = (0,react__WEBPACK_IMPORTED_MODULE_3__.useState)();
    const processContent = async (texte)=>{
        const newText = await (0,src_utils_processMarkedContent__WEBPACK_IMPORTED_MODULE_4__/* .processMarkedContent */ .Y)(texte);
        setProcessedText(newText);
    };
    (0,react__WEBPACK_IMPORTED_MODULE_3__.useEffect)(()=>{
        if (texte) processContent(texte);
    }, [
        texte
    ]);
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "flex flex-col w-full",
        children: [
            titre && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h2", {
                className: "text-center w-full mt-8 mb-6",
                children: titre
            }),
            image && alignementImage === "Centre Haut" && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_strapiImage_StrapiImage__WEBPACK_IMPORTED_MODULE_1__/* .StrapiImage */ .p, {
                data: image,
                containerClassName: "max-w-full lg:max-w-[80%] h-full flex flex-col justify-center items-center mb-6 mx-auto",
                displayCaption: legendeVisible
            }),
            (processedText || image && (alignementImage === "Gauche" || alignementImage === "Droite")) && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "flex flex-col md:block",
                children: [
                    image && (alignementImage === "Gauche" || alignementImage === "Droite") && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_strapiImage_StrapiImage__WEBPACK_IMPORTED_MODULE_1__/* .StrapiImage */ .p, {
                        data: image,
                        className: "max-h-full",
                        containerClassName: classnames__WEBPACK_IMPORTED_MODULE_2___default()("w-full md:w-auto md:max-w-[35%] md:!min-w-[200px] h-full md:h-auto flex flex-col md:block justify-center items-center mb-6 md:mb-0", {
                            "float-left md:mr-6": alignementImage === "Gauche",
                            "float-right md:ml-6": alignementImage === "Droite"
                        }),
                        displayCaption: legendeVisible
                    }),
                    processedText && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        className: "text-lg break-words sm:break-normal",
                        dangerouslySetInnerHTML: {
                            __html: processedText
                        }
                    })
                ]
            }),
            image && alignementImage === "Centre Bas" && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_strapiImage_StrapiImage__WEBPACK_IMPORTED_MODULE_1__/* .StrapiImage */ .p, {
                data: image,
                containerClassName: "max-w-full lg:max-w-[80%] h-full flex flex-col justify-center items-center mb-6 mx-auto",
                displayCaption: legendeVisible
            })
        ]
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ParagrapheArticle);


/***/ }),

/***/ 28820:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Z: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(76931);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _components_strapiImage_StrapiImage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(19835);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(28097);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_2__);



const GallerieArticle = ({ data: { data, colonnes, legende, legendeVisible } })=>{
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "flex flex-col mb-6 items-center mx-auto",
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: classnames__WEBPACK_IMPORTED_MODULE_2___default()("grid grid-cols-1 w-full lg:w-4/5 mx-auto gap-6", {
                    "md:grid-cols-2": colonnes >= 2,
                    "lg:grid-cols-3": colonnes >= 3,
                    "xl:grid-cols-4": colonnes === 4
                }),
                children: data.map((image, index)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_strapiImage_StrapiImage__WEBPACK_IMPORTED_MODULE_1__/* .StrapiImage */ .p, {
                        data: image,
                        className: classnames__WEBPACK_IMPORTED_MODULE_2___default()("w-full h-full min-h-[250px] max-h-[300px] object-cover"),
                        displayCaption: false
                    }, index))
            }),
            legende && legendeVisible && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                className: "!text-sm text-[#666] mt-4 w-full text-center",
                children: legende
            })
        ]
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (GallerieArticle);


/***/ }),

/***/ 34584:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ZP: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony exports __esModule, $$typeof */
/* harmony import */ var next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(61363);

const proxy = (0,next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__.createProxy)(String.raw`/Users/mariheck/Workspace/territoires-en-transitions/site/app/actus/[id]/[slug]/InfoArticle.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule, $$typeof } = proxy;
const __default__ = proxy.default;


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__default__);

/***/ }),

/***/ 57711:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ZP: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony exports __esModule, $$typeof */
/* harmony import */ var next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(61363);

const proxy = (0,next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__.createProxy)(String.raw`/Users/mariheck/Workspace/territoires-en-transitions/site/app/actus/[id]/[slug]/ParagrapheArticle.tsx`)

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