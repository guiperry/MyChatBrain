"use strict";
// ThemeToggle.tsx
"use client";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importStar(require("react"));
var ContextProvider_1 = require("@/context/ContextProvider");
var react_feather_1 = require("react-feather");
var ThemeToggle_module_css_1 = __importDefault(require("./ThemeToggle.module.css"));
var ThemeToggle = function () {
    var _a = (0, react_1.useContext)(ContextProvider_1.Context), theme = _a.theme, toggle = _a.toggle;
    return (<div className={ThemeToggle_module_css_1.default.container}>
      <react_feather_1.Moon size={16} className={ThemeToggle_module_css_1.default.icon}/>
      <div className={ThemeToggle_module_css_1.default.toggle} onClick={toggle} role="button" tabIndex={0} aria-label={"Switch to ".concat(theme === 'dark' ? 'light' : 'dark', " mode")} onKeyDown={function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        }}>
        <div className={"".concat(ThemeToggle_module_css_1.default.toggleThumb, " ").concat(theme === "dark" ? ThemeToggle_module_css_1.default.toggleDark : ThemeToggle_module_css_1.default.toggleLight)}>
          {theme === "dark" ? (<react_feather_1.Moon size={10} color="white"/>) : (<react_feather_1.Sun size={10} color="white"/>)}
        </div>
      </div>
      <react_feather_1.Sun size={16} className={ThemeToggle_module_css_1.default.icon}/>
    </div>);
};
exports.default = ThemeToggle;
