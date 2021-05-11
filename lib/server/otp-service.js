"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCode = exports.generateSecret = exports.verify = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
function verify({ secret, encoding, token }) {
    return speakeasy_1.default.totp.verify({ secret, encoding, token });
}
exports.verify = verify;
function generateSecret(props) {
    return speakeasy_1.default.generateSecret(Object.assign({}, props));
}
exports.generateSecret = generateSecret;
function generateQRCode() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const secret = speakeasy_1.default.generateSecret({ length: 10 });
            qrcode_1.default.toDataURL(secret.otpauth_url, (err, data_url) => __awaiter(this, void 0, void 0, function* () {
                if (err)
                    throw err;
                return resolve({ secret, data_url });
            }));
        }));
    });
}
exports.generateQRCode = generateQRCode;
exports.default = {
    generateQRCode,
    generateSecret,
    verify
};
//# sourceMappingURL=otp-service.js.map