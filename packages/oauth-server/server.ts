import app, {options} from "./index"
const https = require('https');
const server = https.createServer(options, app);
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

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