"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importStar(require("react"));
var react_feather_1 = require("react-feather");
var UserProfile_module_css_1 = __importDefault(require("./UserProfile.module.css"));
var UserProfile = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose;
    var _b = (0, react_1.useState)(null), user = _b[0], setUser = _b[1];
    var _c = (0, react_1.useState)(true), loading = _c[0], setLoading = _c[1];
    var _d = (0, react_1.useState)(null), error = _d[0], setError = _d[1];
    var _e = (0, react_1.useState)(''), currentPassword = _e[0], setCurrentPassword = _e[1];
    var _f = (0, react_1.useState)(''), newPassword = _f[0], setNewPassword = _f[1];
    var _g = (0, react_1.useState)(''), confirmPassword = _g[0], setConfirmPassword = _g[1];
    var _h = (0, react_1.useState)(false), showCurrentPassword = _h[0], setShowCurrentPassword = _h[1];
    var _j = (0, react_1.useState)(false), showNewPassword = _j[0], setShowNewPassword = _j[1];
    var _k = (0, react_1.useState)(null), message = _k[0], setMessage = _k[1];
    (0, react_1.useEffect)(function () {
        if (isOpen) {
            fetchUserData();
        }
    }, [isOpen]);
    var fetchUserData = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    setLoading(true);
                    return [4 /*yield*/, fetch('/api/auth/me')];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Failed to fetch user data');
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setUser(data.user);
                    setError(null);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    setError('Failed to load user profile');
                    console.error(err_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleChangePassword = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    // Validate passwords
                    if (newPassword !== confirmPassword) {
                        setMessage({ text: 'New passwords do not match', type: 'error' });
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    setLoading(true);
                    return [4 /*yield*/, fetch('/api/auth/change-password', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                currentPassword: currentPassword,
                                newPassword: newPassword,
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    if (!response.ok) {
                        throw new Error(data.error || 'Failed to change password');
                    }
                    // Clear form
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setMessage({ text: 'Password changed successfully', type: 'success' });
                    return [3 /*break*/, 6];
                case 4:
                    err_2 = _a.sent();
                    setMessage({ text: err_2.message || 'Failed to change password', type: 'error' });
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleLogout = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch('/api/auth/logout', {
                            method: 'POST',
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Failed to logout');
                    }
                    // Redirect to login page
                    window.location.href = '/login';
                    return [3 /*break*/, 3];
                case 2:
                    err_3 = _a.sent();
                    console.error(err_3);
                    setMessage({ text: 'Failed to logout', type: 'error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    if (!isOpen)
        return null;
    return (<div className={UserProfile_module_css_1.default.overlay}>
      <div className={UserProfile_module_css_1.default.profilePanel}>
        <div className={UserProfile_module_css_1.default.header}>
          <h2>User Profile</h2>
          <button className={UserProfile_module_css_1.default.closeButton} onClick={onClose} aria-label="Close profile">
            <react_feather_1.X size={20}/>
          </button>
        </div>
        
        <div className={UserProfile_module_css_1.default.content}>
          {loading && !user ? (<div className={UserProfile_module_css_1.default.loading}>Loading...</div>) : error ? (<div className={UserProfile_module_css_1.default.error}>{error}</div>) : user ? (<>
              <div className={UserProfile_module_css_1.default.userInfo}>
                <div className={UserProfile_module_css_1.default.avatar}>
                  <react_feather_1.User size={40}/>
                </div>
                <div className={UserProfile_module_css_1.default.details}>
                  <div className={UserProfile_module_css_1.default.field}>
                    <react_feather_1.User size={16}/>
                    <span>{user.username}</span>
                  </div>
                  <div className={UserProfile_module_css_1.default.field}>
                    <react_feather_1.Mail size={16}/>
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>
              
              <div className={UserProfile_module_css_1.default.section}>
                <h3>Change Password</h3>
                {message && (<div className={"".concat(UserProfile_module_css_1.default.message, " ").concat(UserProfile_module_css_1.default[message.type])}>
                    {message.text}
                  </div>)}
                <form onSubmit={handleChangePassword}>
                  <div className={UserProfile_module_css_1.default.formGroup}>
                    <label htmlFor="currentPassword">Current Password</label>
                    <div className={UserProfile_module_css_1.default.passwordInput}>
                      <input id="currentPassword" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={function (e) { return setCurrentPassword(e.target.value); }} required/>
                      <button type="button" className={UserProfile_module_css_1.default.togglePassword} onClick={function () { return setShowCurrentPassword(!showCurrentPassword); }} aria-label={showCurrentPassword ? "Hide password" : "Show password"}>
                        {showCurrentPassword ? <react_feather_1.EyeOff size={16}/> : <react_feather_1.Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                  
                  <div className={UserProfile_module_css_1.default.formGroup}>
                    <label htmlFor="newPassword">New Password</label>
                    <div className={UserProfile_module_css_1.default.passwordInput}>
                      <input id="newPassword" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={function (e) { return setNewPassword(e.target.value); }} required/>
                      <button type="button" className={UserProfile_module_css_1.default.togglePassword} onClick={function () { return setShowNewPassword(!showNewPassword); }} aria-label={showNewPassword ? "Hide password" : "Show password"}>
                        {showNewPassword ? <react_feather_1.EyeOff size={16}/> : <react_feather_1.Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                  
                  <div className={UserProfile_module_css_1.default.formGroup}>
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input id="confirmPassword" type="password" value={confirmPassword} onChange={function (e) { return setConfirmPassword(e.target.value); }} required/>
                  </div>
                  
                  <button type="submit" className={UserProfile_module_css_1.default.saveButton} disabled={loading}>
                    <react_feather_1.Save size={16}/>
                    Save Changes
                  </button>
                </form>
              </div>
              
              <div className={UserProfile_module_css_1.default.logoutSection}>
                <button className={UserProfile_module_css_1.default.logoutButton} onClick={handleLogout}>
                  <react_feather_1.LogOut size={16}/>
                  Logout
                </button>
              </div>
            </>) : (<div className={UserProfile_module_css_1.default.notLoggedIn}>
              <p>You are not logged in.</p>
              <a href="/login" className={UserProfile_module_css_1.default.loginLink}>Log in</a>
            </div>)}
        </div>
      </div>
    </div>);
};
exports.default = UserProfile;
