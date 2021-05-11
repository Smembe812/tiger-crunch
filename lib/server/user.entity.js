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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
function validateUser(user, validators) {
    const validations = [
        function validateEmail({ email }) {
            if (!email) {
                throw new Error("email address not provided");
            }
            if (!validators.isEmail(email)) {
                throw new Error("invalid email address provided");
            }
            return { email };
        },
        function validateName({ name }) {
            if (!name) {
                throw new Error("name of user not provided");
            }
            if (!validators.isName(name)) {
                throw new Error("invalid name provided");
            }
            return { name };
        },
        function validatePhoneNumber({ phone }) {
            if (!phone) {
                throw new Error("user phone number not provided");
            }
            if (!validators.isPhoneNumber(phone)) {
                throw new Error("invalid phone number");
            }
            return { phone };
        },
        function validateUUID({ uuid }) {
            if (!uuid) {
                throw new Error("uuid not provided");
            }
            if (!validators.isUUID(uuid)) {
                throw new Error("invalid uuid");
            }
            return { uuid };
        },
        function validatePIN({ proposedPIN }) {
            if (!proposedPIN) {
                throw new Error("pin not provided");
            }
            if (!validators.isPIN(proposedPIN)) {
                throw new Error("pin code must only have digits");
            }
            return { proposedPIN };
        }
    ];
    const validFields = validations.map(validation => {
        try {
            return validation.call(this, user);
        }
        catch (error) {
            throw error;
        }
    });
    const validUser = Object.assign({}, user, ...validFields);
    return Object.freeze(validUser);
}
function default_1({ validators, identityManager }) {
    return function create(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const _a = validateUser(user, validators), { proposedPIN } = _a, validatedUser = __rest(_a, ["proposedPIN"]);
            if (proposedPIN) {
                try {
                    const pin = yield identityManager.computePersistedPIN(proposedPIN);
                    return Object.freeze(Object.assign(Object.assign({}, validatedUser), { pin }));
                }
                catch (error) {
                    throw error;
                }
            }
            return Object.freeze(Object.assign({}, validatedUser));
        });
    };
}
exports.default = default_1;
//# sourceMappingURL=user.entity.js.map