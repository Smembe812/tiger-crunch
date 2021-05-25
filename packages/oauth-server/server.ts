import app, {options} from "./index"
// const https = require('https');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
import followRedirects, { http, https } from 'follow-redirects'
followRedirects.maxRedirects = 10;
const{http, https} = followRedirects.wrap({
  http: require('http'),
  https: require('https'),
});
const server = https.createServer(options, app);
yargs(hideBin(process.argv))
  .command('serve [port]', 'start the server', (yargs) => {
    return yargs
      .positional('port', {
        describe: 'port to bind on',
        default: 5000
      })
  }, (argv) => {
    if (argv.verbose) {
        console.info(`start server on :${argv.port}`)
    }
    server.listen(argv.port, () => {
        console.log(`App listening at https://tiger-crunch.com:${argv.port}`)
    })
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging'
  })
  .argv