"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPIN = exports.isPhoneNumber = exports.isName = exports.isUUID = exports.isEmail = void 0;
const validator_1 = __importDefault(require("validator"));
exports.isEmail = (email) => {
    return validator_1.default.isEmail(email);
};
exports.isUUID = (uuid) => {
    return validator_1.default.isUUID(uuid, 4);
};
exports.isName = (word) => {
    return validator_1.default.isAlpha(word, "en-GB", { ignore: " -" });
};
exports.isPhoneNumber = (numberString) => {
    return validator_1.default.isMobilePhone(numberString, "any");
};
exports.isPIN = (pin) => {
    if (pin.length !== 4) {
        throw new Error("pin code must be 4 digits long");
    }
    return (validator_1.default.isNumeric(pin));
};
exports.default = {
    isName: exports.isName,
    isEmail: exports.isEmail,
    isPhoneNumber: exports.isPhoneNumber,
    isUUID: exports.isUUID,
    isPIN: exports.isPIN
};
//# sourceMappingURL=validators.js.map