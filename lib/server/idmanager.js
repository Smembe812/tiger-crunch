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
Object.defineProperty(exports, "__esModule", { value: true });
function computePersistedPIN(proposedPIN) {
    return __awaiter(this, void 0, void 0, function* () {
        const { pbkdf2, randomBytes } = yield Promise.resolve().then(() => __importStar(require('crypto')));
        const salt = yield randomBytes(128).toString('base64');
        const iterations = 100000;
        return new Promise((resolve, reject) => {
            pbkdf2(proposedPIN, salt, iterations, 64, 'sha512', (error, key) => {
                if (error)
                    throw error;
                return resolve({ hash: key.toString("hex"), salt, iterations });
            });
        });
    });
}
function isValidPin({ proposedPIN, salt, iterations, hash }) {
    return __awaiter(this, void 0, void 0, function* () {
        const { pbkdf2 } = yield Promise.resolve().then(() => __importStar(require('crypto')));
        return new Promise((resolve, reject) => {
            pbkdf2(proposedPIN, salt, iterations, 64, 'sha512', (error, key) => {
                if (error)
                    throw error;
                return resolve(key.toString("hex") === hash);
            });
        });
    });
}
function encryptPass(pin) {
    return __awaiter(this, void 0, void 0, function* () {
        const pinstring = `${pin.hash}.${pin.salt}.${pin.iterations}`;
        const { createCipheriv, createDecipheriv, randomBytes, } = yield Promise.resolve().then(() => __importStar(require('crypto')));
        const key = "keykeykeykeykeykeykeykey";
        const nonce = randomBytes(12);
        const aad = Buffer.from('0123456789', 'hex');
        const cipher = createCipheriv('aes-192-ccm', key, nonce, {
            authTagLength: 16
        });
        cipher.setAAD(aad, {
            plaintextLength: Buffer.byteLength(pinstring)
        });
        const ciphertext = cipher.update(pinstring, 'utf8');
        cipher.final();
        const tag = cipher.getAuthTag();
        console.log(tag.toString('hex'), nonce.toString('hex'));
        // Now transmit { ciphertext, nonce, tag }.
        //   const decipher = createDecipheriv('aes-192-ccm', key, nonce, {
        //     authTagLength: 16
        //   });
        //   decipher.setAuthTag(tag);
        //   decipher.setAAD(aad, {
        //     plaintextLength: ciphertext.length
        //   });
        //   const receivedPlaintext = decipher.update(ciphertext, null, 'utf8');
        //   try {
        //     decipher.final();
        //   } catch (err) {
        //     console.error('Authentication failed!');
        //     return;
        //   }
        console.log("hello");
        return ciphertext.toString("hex");
    });
}
function generatePIN(n = 4) {
    const add = 1;
    let max = 12 - add;
    if (n > max) {
        return generatePIN(max) + generatePIN(n - max);
    }
    max = Math.pow(10, n + add);
    const min = max / 10; // Math.pow(10, n) basically 
    const number = Math.floor(Math.random() * (max - min + 1)) + min;
    return ("" + number).substring(add);
}
exports.default = {
    computePersistedPIN,
    encryptPass,
    generatePIN,
    isValidPin
};
//# sourceMappingURL=idmanager.js.map