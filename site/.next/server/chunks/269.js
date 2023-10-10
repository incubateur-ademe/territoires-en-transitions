"use strict";
exports.id = 269;
exports.ids = [269];
exports.modules = {

/***/ 64603:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   p: () => (/* binding */ StrapiImage)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(76931);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* eslint-disable @next/next/no-img-element */ 
const baseURL = "https://passionate-wonder-8e064cba29.strapiapp.com";
function StrapiImage({ data, size, className, containerClassName, displayCaption = false }) {
    const attributes = data.attributes;
    const url = size && attributes.formats?.size ? `${attributes.formats[size].url}` : `${attributes.url}`;
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("picture", {
        className: containerClassName,
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("img", {
                className: className,
                src: url.startsWith("http") ? url : `${baseURL}${url}`,
                alt: `${attributes.alternativeText ?? ""}`
            }),
            displayCaption && !!attributes.caption && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                className: "!text-sm text-[#666] mt-2 mb-0 w-full text-center",
                children: `${attributes.caption}`
            })
        ]
    });
}


/***/ }),

/***/ 31282:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Y: () => (/* binding */ processMarkedContent)
/* harmony export */ });
/* harmony import */ var remark__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(44806);
/* harmony import */ var remark_html__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(64489);


const processMarkedContent = async (content)=>{
    const processedContent = await (0,remark__WEBPACK_IMPORTED_MODULE_0__/* .remark */ .j)().use(remark_html__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .Z).process(`${content}`);
    return processedContent.toString();
};


/***/ }),

/***/ 32017:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Z: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(76931);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(28097);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_1__);


const EmbededVideo = ({ url, title, className })=>{
    let embedLink = "";
    if (url.includes("youtu.be") || url.includes("youtube")) {
        if (url.includes("embed")) embedLink = url;
        else if (url.includes("watch")) {
            embedLink = url.split("watch?v=").join("embed/").split("&")[0];
        } else {
            embedLink = url.split("youtu.be").join("www.youtube.com/embed");
        }
    } else if (url.includes("dailymotion") || url.includes("dai.ly")) {
        if (url.includes("embed")) embedLink = url;
        else {
            embedLink = `https://www.dailymotion.com/embed/video/${url.split("/")[url.split("/").length - 1]}`;
        }
    }
    return embedLink.length ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("iframe", {
        className: classnames__WEBPACK_IMPORTED_MODULE_1___default()("aspect-video w-full lg:w-4/5 mx-auto", className),
        src: embedLink,
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        allowFullScreen: true,
        title: title ?? ""
    }) : null;
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (EmbededVideo);


/***/ })

};
;