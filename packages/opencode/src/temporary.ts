import yargs from "yargs"
import { InstallationVersion } from "./installation/version"
import { hideBin } from "yargs/helpers"
import { Log } from "./node"

Log.init({
  print: false,
})

yargs(hideBin(process.argv))
  .parserConfiguration({ "populate--": true })
  .scriptName("opencode")
  .wrap(100)
  .help("help", "show help")
  .alias("help", "h")
  .version("version", "show version number", InstallationVersion)
  .alias("version", "v")
  .parse()
