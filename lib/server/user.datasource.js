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
const level_1 = __importDefault(require("level"));
class DBPool {
    constructor(name) {
        this.pool = level_1.default(name, { valueEncoding: 'json' });
    }
    insert(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.pool.put(obj.email, obj);
                return yield this.get(obj.email);
            }
            catch (error) {
                throw error;
            }
        });
    }
    get(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.pool.get(email);
        });
    }
    delete(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.pool.delete(email);
        });
    }
}
exports.default = DBPool;
//# sourceMappingURL=user.datasource.js.map