/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/chat/route";
exports.ids = ["app/api/chat/route"];
exports.modules = {

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fchat%2Froute&page=%2Fapi%2Fchat%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fchat%2Froute.ts&appDir=%2Fhome%2Fdanyswr%2Ftools%2Fbugbounty%2Fotoworker%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Fdanyswr%2Ftools%2Fbugbounty%2Fotoworker&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fchat%2Froute&page=%2Fapi%2Fchat%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fchat%2Froute.ts&appDir=%2Fhome%2Fdanyswr%2Ftools%2Fbugbounty%2Fotoworker%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Fdanyswr%2Ftools%2Fbugbounty%2Fotoworker&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _home_danyswr_tools_bugbounty_otoworker_app_api_chat_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/chat/route.ts */ \"(rsc)/./app/api/chat/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/chat/route\",\n        pathname: \"/api/chat\",\n        filename: \"route\",\n        bundlePath: \"app/api/chat/route\"\n    },\n    resolvedPagePath: \"/home/danyswr/tools/bugbounty/otoworker/app/api/chat/route.ts\",\n    nextConfigOutput,\n    userland: _home_danyswr_tools_bugbounty_otoworker_app_api_chat_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZjaGF0JTJGcm91dGUmcGFnZT0lMkZhcGklMkZjaGF0JTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGY2hhdCUyRnJvdXRlLnRzJmFwcERpcj0lMkZob21lJTJGZGFueXN3ciUyRnRvb2xzJTJGYnVnYm91bnR5JTJGb3Rvd29ya2VyJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZob21lJTJGZGFueXN3ciUyRnRvb2xzJTJGYnVnYm91bnR5JTJGb3Rvd29ya2VyJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PXN0YW5kYWxvbmUmcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBK0Y7QUFDdkM7QUFDcUI7QUFDYTtBQUMxRjtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IseUdBQW1CO0FBQzNDO0FBQ0EsY0FBYyxrRUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLHNEQUFzRDtBQUM5RDtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUMwRjs7QUFFMUYiLCJzb3VyY2VzIjpbIiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiL2hvbWUvZGFueXN3ci90b29scy9idWdib3VudHkvb3Rvd29ya2VyL2FwcC9hcGkvY2hhdC9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJzdGFuZGFsb25lXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2NoYXQvcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9jaGF0XCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9jaGF0L3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL2hvbWUvZGFueXN3ci90b29scy9idWdib3VudHkvb3Rvd29ya2VyL2FwcC9hcGkvY2hhdC9yb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHdvcmtBc3luY1N0b3JhZ2UsXG4gICAgICAgIHdvcmtVbml0QXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fchat%2Froute&page=%2Fapi%2Fchat%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fchat%2Froute.ts&appDir=%2Fhome%2Fdanyswr%2Ftools%2Fbugbounty%2Fotoworker%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Fdanyswr%2Ftools%2Fbugbounty%2Fotoworker&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(rsc)/./app/api/chat/route.ts":
/*!*******************************!*\
  !*** ./app/api/chat/route.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n\nconst BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';\nconst API_KEY = \"super_secret_jules_key_123\";\nasync function POST(req) {\n    try {\n        const body = await req.json();\n        const { messages, provider, apiKey: userApiKey, model } = body;\n        // We take the last user message as the instruction for the swarm\n        const lastMessage = messages.filter((m)=>m.role === \"user\").slice(-1)[0]?.content;\n        const instruction = typeof lastMessage === \"string\" ? lastMessage : JSON.stringify(lastMessage);\n        if (!instruction) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: {\n                    message: \"No instruction provided.\"\n                }\n            }, {\n                status: 400\n            });\n        }\n        const response = await fetch(`${BACKEND_URL}/swarm_execute`, {\n            method: 'POST',\n            headers: {\n                'Content-Type': 'application/json',\n                'X-API-KEY': API_KEY\n            },\n            body: JSON.stringify({\n                instruction,\n                provider: provider || \"gemini\",\n                api_key: userApiKey || \"\",\n                model: model || \"gemini-2.0-flash\"\n            })\n        });\n        const data = await response.json();\n        if (!response.ok) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: {\n                    message: data.detail || `HTTP ${response.status} Error`\n                }\n            }, {\n                status: response.status\n            });\n        }\n        // Return in OpenAI-compatible format for frontend consistency\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            choices: [\n                {\n                    message: {\n                        content: data.result\n                    }\n                }\n            ]\n        });\n    } catch (err) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: {\n                message: err.message\n            }\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2NoYXQvcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBMkM7QUFFM0MsTUFBTUMsY0FBY0MsUUFBUUMsR0FBRyxDQUFDRixXQUFXLElBQUk7QUFDL0MsTUFBTUcsVUFBVTtBQUVULGVBQWVDLEtBQUtDLEdBQVk7SUFDckMsSUFBSTtRQUNGLE1BQU1DLE9BQU8sTUFBTUQsSUFBSUUsSUFBSTtRQUMzQixNQUFNLEVBQUVDLFFBQVEsRUFBRUMsUUFBUSxFQUFFQyxRQUFRQyxVQUFVLEVBQUVDLEtBQUssRUFBRSxHQUFHTjtRQUUxRCxpRUFBaUU7UUFDakUsTUFBTU8sY0FBY0wsU0FBU00sTUFBTSxDQUFDLENBQUNDLElBQVdBLEVBQUVDLElBQUksS0FBSyxRQUFRQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFQztRQUNqRixNQUFNQyxjQUFjLE9BQU9OLGdCQUFnQixXQUFXQSxjQUFjTyxLQUFLQyxTQUFTLENBQUNSO1FBRW5GLElBQUksQ0FBQ00sYUFBYTtZQUNoQixPQUFPcEIscURBQVlBLENBQUNRLElBQUksQ0FBQztnQkFBRWUsT0FBTztvQkFBRUMsU0FBUztnQkFBMkI7WUFBRSxHQUFHO2dCQUFFQyxRQUFRO1lBQUk7UUFDN0Y7UUFFQSxNQUFNQyxXQUFXLE1BQU1DLE1BQU0sR0FBRzFCLFlBQVksY0FBYyxDQUFDLEVBQUU7WUFDM0QyQixRQUFRO1lBQ1JDLFNBQVM7Z0JBQ1AsZ0JBQWdCO2dCQUNoQixhQUFhekI7WUFDZjtZQUNBRyxNQUFNYyxLQUFLQyxTQUFTLENBQUM7Z0JBQ25CRjtnQkFDQVYsVUFBVUEsWUFBWTtnQkFDdEJvQixTQUFTbEIsY0FBYztnQkFDdkJDLE9BQU9BLFNBQVM7WUFDbEI7UUFDRjtRQUVBLE1BQU1rQixPQUFPLE1BQU1MLFNBQVNsQixJQUFJO1FBQ2hDLElBQUksQ0FBQ2tCLFNBQVNNLEVBQUUsRUFBRTtZQUNoQixPQUFPaEMscURBQVlBLENBQUNRLElBQUksQ0FBQztnQkFBRWUsT0FBTztvQkFBRUMsU0FBU08sS0FBS0UsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFUCxTQUFTRCxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUFDO1lBQUUsR0FBRztnQkFBRUEsUUFBUUMsU0FBU0QsTUFBTTtZQUFDO1FBQzdIO1FBRUEsOERBQThEO1FBQzlELE9BQU96QixxREFBWUEsQ0FBQ1EsSUFBSSxDQUFDO1lBQ3ZCMEIsU0FBUztnQkFDUDtvQkFDRVYsU0FBUzt3QkFDUEwsU0FBU1ksS0FBS0ksTUFBTTtvQkFDdEI7Z0JBQ0Y7YUFDRDtRQUNIO0lBQ0YsRUFBRSxPQUFPQyxLQUFVO1FBQ2pCLE9BQU9wQyxxREFBWUEsQ0FBQ1EsSUFBSSxDQUFDO1lBQUVlLE9BQU87Z0JBQUVDLFNBQVNZLElBQUlaLE9BQU87WUFBQztRQUFFLEdBQUc7WUFBRUMsUUFBUTtRQUFJO0lBQzlFO0FBQ0YiLCJzb3VyY2VzIjpbIi9ob21lL2Rhbnlzd3IvdG9vbHMvYnVnYm91bnR5L290b3dvcmtlci9hcHAvYXBpL2NoYXQvcm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlc3BvbnNlIH0gZnJvbSBcIm5leHQvc2VydmVyXCI7XG5cbmNvbnN0IEJBQ0tFTkRfVVJMID0gcHJvY2Vzcy5lbnYuQkFDS0VORF9VUkwgfHwgJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCc7XG5jb25zdCBBUElfS0VZID0gXCJzdXBlcl9zZWNyZXRfanVsZXNfa2V5XzEyM1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gUE9TVChyZXE6IFJlcXVlc3QpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVxLmpzb24oKTtcbiAgICBjb25zdCB7IG1lc3NhZ2VzLCBwcm92aWRlciwgYXBpS2V5OiB1c2VyQXBpS2V5LCBtb2RlbCB9ID0gYm9keTtcblxuICAgIC8vIFdlIHRha2UgdGhlIGxhc3QgdXNlciBtZXNzYWdlIGFzIHRoZSBpbnN0cnVjdGlvbiBmb3IgdGhlIHN3YXJtXG4gICAgY29uc3QgbGFzdE1lc3NhZ2UgPSBtZXNzYWdlcy5maWx0ZXIoKG06IGFueSkgPT4gbS5yb2xlID09PSBcInVzZXJcIikuc2xpY2UoLTEpWzBdPy5jb250ZW50O1xuICAgIGNvbnN0IGluc3RydWN0aW9uID0gdHlwZW9mIGxhc3RNZXNzYWdlID09PSBcInN0cmluZ1wiID8gbGFzdE1lc3NhZ2UgOiBKU09OLnN0cmluZ2lmeShsYXN0TWVzc2FnZSk7XG5cbiAgICBpZiAoIWluc3RydWN0aW9uKSB7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogeyBtZXNzYWdlOiBcIk5vIGluc3RydWN0aW9uIHByb3ZpZGVkLlwiIH0gfSwgeyBzdGF0dXM6IDQwMCB9KTtcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke0JBQ0tFTkRfVVJMfS9zd2FybV9leGVjdXRlYCwge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICdYLUFQSS1LRVknOiBBUElfS0VZXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBpbnN0cnVjdGlvbixcbiAgICAgICAgcHJvdmlkZXI6IHByb3ZpZGVyIHx8IFwiZ2VtaW5pXCIsXG4gICAgICAgIGFwaV9rZXk6IHVzZXJBcGlLZXkgfHwgXCJcIixcbiAgICAgICAgbW9kZWw6IG1vZGVsIHx8IFwiZ2VtaW5pLTIuMC1mbGFzaFwiLFxuICAgICAgfSlcbiAgICB9KTtcblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IHsgbWVzc2FnZTogZGF0YS5kZXRhaWwgfHwgYEhUVFAgJHtyZXNwb25zZS5zdGF0dXN9IEVycm9yYCB9IH0sIHsgc3RhdHVzOiByZXNwb25zZS5zdGF0dXMgfSk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIGluIE9wZW5BSS1jb21wYXRpYmxlIGZvcm1hdCBmb3IgZnJvbnRlbmQgY29uc2lzdGVuY3lcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oe1xuICAgICAgY2hvaWNlczogW1xuICAgICAgICB7XG4gICAgICAgICAgbWVzc2FnZToge1xuICAgICAgICAgICAgY29udGVudDogZGF0YS5yZXN1bHRcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogeyBtZXNzYWdlOiBlcnIubWVzc2FnZSB9IH0sIHsgc3RhdHVzOiA1MDAgfSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJCQUNLRU5EX1VSTCIsInByb2Nlc3MiLCJlbnYiLCJBUElfS0VZIiwiUE9TVCIsInJlcSIsImJvZHkiLCJqc29uIiwibWVzc2FnZXMiLCJwcm92aWRlciIsImFwaUtleSIsInVzZXJBcGlLZXkiLCJtb2RlbCIsImxhc3RNZXNzYWdlIiwiZmlsdGVyIiwibSIsInJvbGUiLCJzbGljZSIsImNvbnRlbnQiLCJpbnN0cnVjdGlvbiIsIkpTT04iLCJzdHJpbmdpZnkiLCJlcnJvciIsIm1lc3NhZ2UiLCJzdGF0dXMiLCJyZXNwb25zZSIsImZldGNoIiwibWV0aG9kIiwiaGVhZGVycyIsImFwaV9rZXkiLCJkYXRhIiwib2siLCJkZXRhaWwiLCJjaG9pY2VzIiwicmVzdWx0IiwiZXJyIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/chat/route.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@opentelemetry"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fchat%2Froute&page=%2Fapi%2Fchat%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fchat%2Froute.ts&appDir=%2Fhome%2Fdanyswr%2Ftools%2Fbugbounty%2Fotoworker%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Fdanyswr%2Ftools%2Fbugbounty%2Fotoworker&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();