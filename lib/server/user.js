"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validators_1 = __importDefault(require("./validators"));
const user_entity_1 = __importDefault(require("./user.entity"));
const idmanager_1 = __importDefault(require("./idmanager"));
const user_datasource_1 = __importDefault(require("./user.datasource"));
const user_use_cases_1 = __importDefault(require("./user.use-cases"));
const mail_1 = __importDefault(require("./mail"));
const otp_service_1 = __importDefault(require("./otp-service"));
const create = user_entity_1.default({ validators: validators_1.default, identityManager: idmanager_1.default });
const dataSource = new user_datasource_1.default("users");
const mailManager = new mail_1.default({
    client: process.env.NODEMAILER_OAUTH_CLIENT,
    service: "noreply@accounts"
});
const userUseCases = user_use_cases_1.default({
    userEntity: { create },
    dataSource,
    mailManager,
    identityManager: idmanager_1.default,
    otpService: otp_service_1.default
});
exports.default = {
    userEntity: create,
    userUseCases,
    dataSource
};
//# sourceMappingURL=user.js.map