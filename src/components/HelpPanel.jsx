"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_feather_1 = require("react-feather");
var HelpPanel_module_css_1 = __importDefault(require("./HelpPanel.module.css"));
var HelpPanel = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose;
    if (!isOpen)
        return null;
    return (<div className={HelpPanel_module_css_1.default.helpPanelOverlay}>
      <div className={HelpPanel_module_css_1.default.helpPanel}>
        <div className={HelpPanel_module_css_1.default.helpHeader}>
          <h2>Help & Resources</h2>
          <div className={HelpPanel_module_css_1.default.closeButton} onClick={onClose} role="button" tabIndex={0} aria-label="Close help panel" onKeyDown={function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClose();
            }
        }}>
            <react_feather_1.X size={20}/>
          </div>
        </div>

        <div className={HelpPanel_module_css_1.default.helpContent}>
          <section className={HelpPanel_module_css_1.default.helpSection}>
            <h3>Getting Started</h3>
            <p>
              This is a Gemini-powered chat application that allows you to interact with Google's Gemini AI model.
              You can ask questions, analyze GitHub repositories, and more.
            </p>
          </section>

          <section className={HelpPanel_module_css_1.default.helpSection}>
            <h3>Key Features</h3>
            <ul className={HelpPanel_module_css_1.default.featureList}>
              <li>
                <span className={HelpPanel_module_css_1.default.featureName}>Chat with Gemini:</span> 
                Ask questions and get AI-powered responses
              </li>
              <li>
                <span className={HelpPanel_module_css_1.default.featureName}>GitHub Analysis:</span> 
                Paste a GitHub repository URL to analyze its code
              </li>
              <li>
                <span className={HelpPanel_module_css_1.default.featureName}>Persistent Memory:</span> 
                Enable to maintain context between sessions
              </li>
              <li>
                <span className={HelpPanel_module_css_1.default.featureName}>Theme Toggle:</span> 
                Switch between light and dark modes
              </li>
            </ul>
          </section>

          <section className={HelpPanel_module_css_1.default.helpSection}>
            <h3>External Resources</h3>
            <div className={HelpPanel_module_css_1.default.resourceLinks}>
              <a href="https://github.com/Inc-Line/gemini-clone-extended-TS" target="_blank" rel="noopener noreferrer" className={HelpPanel_module_css_1.default.resourceLink}>
                <react_feather_1.GitHub size={18}/>
                <span>GitHub Repository</span>
                <react_feather_1.ExternalLink size={14}/>
              </a>
              
              <a href="https://ai.google.dev/docs/gemini_api_overview" target="_blank" rel="noopener noreferrer" className={HelpPanel_module_css_1.default.resourceLink}>
                <react_feather_1.Book size={18}/>
                <span>Gemini API Documentation</span>
                <react_feather_1.ExternalLink size={14}/>
              </a>
              
              <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className={HelpPanel_module_css_1.default.resourceLink}>
                <react_feather_1.MessageCircle size={18}/>
                <span>Get Gemini API Key</span>
                <react_feather_1.ExternalLink size={14}/>
              </a>
              
              <a href="https://github.com/sponsors/Inc-Line" target="_blank" rel="noopener noreferrer" className={HelpPanel_module_css_1.default.resourceLink}>
                <react_feather_1.Coffee size={18}/>
                <span>Support the Project</span>
                <react_feather_1.ExternalLink size={14}/>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>);
};
exports.default = HelpPanel;
