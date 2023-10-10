exports.id = 67;
exports.ids = [67];
exports.modules = {

/***/ 35303:
/***/ (() => {



/***/ }),

/***/ 90917:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Z: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(76931);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(28097);
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

/***/ 586:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   a: () => (/* binding */ useMDXComponents)
/* harmony export */ });
/**
 * Personnalisation des composants utilisés dans les pages mdx
 */ // surcharge les ancres pour ouvrir les liens vers des domaines externes dans un nouvel onglet
/*const A = ({children, href, ...props}: React.ComponentPropsWithoutRef<'a'>) => {
  return !href || href?.startsWith('/') || href?.includes('localhost') ? (
    <Link href={href || ''}>
      <a>{children}</a>
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
};
*/ function useMDXComponents(components) {
    //return {a: A, ...components};
    return components;
}


/***/ })

};
;