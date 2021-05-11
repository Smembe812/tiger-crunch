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
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = __importStar(require("./"));
const https = require('https');
const server = https.createServer(_1.options, _1.default);
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
yargs(hideBin(process.argv))
    .command('serve [port]', 'start the server', (yargs) => {
    return yargs
        .positional('port', {
        describe: 'port to bind on',
        default: 5000
    });
}, (argv) => {
    if (argv.verbose) {
        console.info(`start server on :${argv.port}`);
    }
    server.listen(argv.port, () => {
        console.log(`App listening at https://tiger-crunch.com:${argv.port}`);
    });
})
    .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging'
})
    .argv;
//# sourceMappingURL=server.js.map