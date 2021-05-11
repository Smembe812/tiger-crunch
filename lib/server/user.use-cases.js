"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
/**
 * create a new user
 * 1. get user details from http
 * 2. validate fields with UserEntity
 * 2. verify the user
 * 3. setup 2 factor
 * @param param0
 * @returns
 */
function default_1({ userEntity, dataSource, httpUser = null, mailManager, identityManager, otpService }) {
    function createNewUser(userFields) {
        return __awaiter(this, void 0, void 0, function* () {
            const { v4: uuidv4 } = yield Promise.resolve().then(() => __importStar(require("uuid")));
            let userResponse;
            try {
                const uuid = uuidv4();
                const newUser = yield userEntity.create(Object.assign(Object.assign({}, userFields), { uuid }));
                const _a = yield dataSource.insert(newUser), { pin } = _a, user = __rest(_a, ["pin"]);
                userResponse = user;
            }
            catch (error) {
                throw error;
            }
            mailManager.sendMail({
                to: userResponse.email,
                subject: "Account Activation",
                text: `Welcome, ${userResponse.name}. Please click this https://link.com to activate your account`
            })
                .catch(err => console.log("error sending activation link", err));
            return userResponse;
        });
    }
    function verifyUser({ proposedPIN, otp, email }) {
        return __awaiter(this, void 0, void 0, function* () {
            const _a = yield dataSource.get(email), { pin: storedPin } = _a, persisedUser = __rest(_a, ["pin"]);
            const isPinValid = yield identityManager.isValidPin({
                proposedPIN,
                salt: storedPin.salt,
                iterations: storedPin.iterations,
                hash: storedPin.hash
            });
            if (persisedUser.twoFactor) {
                const verified = yield verifyOTP({
                    user: { secret: persisedUser.twoFactor.secret },
                    token: otp
                });
                return isPinValid && verified;
            }
            return isPinValid;
        });
    }
    function verifyOTP({ user, token }) {
        return __awaiter(this, void 0, void 0, function* () {
            const verified = otpService.verify({
                secret: user.secret,
                encoding: 'base32',
                token
            });
            return verified;
        });
    }
    function verify2faSetup({ email }, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield dataSource.get(email);
            const isVerified = yield verifyOTP({
                user: { secret: user.twoFactor.tempSecret },
                token
            });
            if (isVerified) {
                user.twoFactor.secret = user.twoFactor.tempSecret;
                delete user.twoFactor.tempSecret;
                yield dataSource.insert(user);
            }
            return isVerified;
        });
    }
    function setUp2FA({ email, proposedPIN }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const verifiedUser = yield verifyUser({ email, proposedPIN, otp: null });
                if (verifiedUser) {
                    const cUser = yield dataSource.get(email);
                    const { secret, data_url } = yield otpService.generateQRCode();
                    cUser.twoFactor = {
                        secret: "",
                        tempSecret: secret.base32,
                        dataURL: data_url,
                        otpURL: secret.otpauth_url
                    };
                    yield dataSource.insert(cUser);
                    return Promise.resolve(data_url);
                }
            }
            catch (error) {
                throw error;
            }
        });
    }
    return {
        createNewUser,
        verifyUser,
        setUp2FA,
        verify2faSetup
    };
}
exports.default = default_1;
//# sourceMappingURL=user.use-cases.js.map