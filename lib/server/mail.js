"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
class MailManager {
    constructor({ client, service }) {
        this.service = service;
        this.transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                type: 'OAuth2',
                clientId: process.env.NODEMAILER_OAUTH_CLIENTID,
                clientSecret: process.env.NODEMAILER_OAUTH_CLIENT_SECRET,
                refreshToken: process.env.NODEMAILER_OAUTH_REFRESH_TOKEN,
                accessToken: process.env.NODEMAILER_OAUTH_ACCESS_TOKEN
            }
        });
        this.mailOptions = {
            from: `${this.service} <${client}>`,
            auth: {
                user: client
            }
        };
    }
    isConnected() {
        return this.transporter.verify(function (error, success) {
            if (error) {
                console.log(error);
                throw error;
            }
            else {
                return Promise.resolve(success);
            }
        });
    }
    sendMail({ text, subject, to, replyTo = this.service }) {
        let mailOptions = Object.assign(Object.assign({}, this.mailOptions), { text,
            subject,
            to,
            replyTo });
        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, function (err, data) {
                if (err) {
                    console.log(err);
                    return reject(err);
                }
                else {
                    return resolve(true);
                }
            });
        });
    }
}
exports.default = MailManager;
//# sourceMappingURL=mail.js.map