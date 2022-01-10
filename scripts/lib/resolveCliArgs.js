const arg = require('arg')
// tailwind中 需要从argv中提出并删除的option项
const tailwindToBeExtractedOptions = ['--output']
let specificCommands = {
  // init: {
  //   args: {
  //     '--full': { type: Boolean, description: 'Initialize a full `tailwind.config.js` file' },
  //     '--postcss': { type: Boolean, description: 'Initialize a `postcss.config.js` file' },
  //     '-f': '--full',
  //     '-p': '--postcss'
  //   }
  // },
  build: {
    args: {
      '--input': { type: String, description: 'Input file' },
      '--output': { type: String, description: 'Output file' },
      // '--watch': { type: Boolean, description: 'Watch for changes and rebuild as needed' },
      // '--content': {
      //   type: String,
      //   description: 'Content paths to use for removing unused classes',
      // },
      // '--purge': {
      //   type: String,
      //   deprecated: true
      // },
      // '--postcss': {
      //   type: oneOf(String, Boolean),
      //   description: 'Load custom PostCSS configuration'
      // },
      // '--minify': { type: Boolean, description: 'Minify the output' },
      '--config': {
        type: String,
        description: 'Path to a custom config file'
      },
      // '--no-autoprefixer': {
      //   type: Boolean,
      //   description: 'Disable autoprefixer'
      // },
      '-c': '--config',
      '-i': '--input',
      '-o': '--output',
      '-m': '--minify',
      '-w': '--watch'
    }
  }
}

function getSpecificArgsObj (tailwindArgsObj) {
  let specificArgs = []
  let specificArgsObj = {}
  let restArgs = [...process.argv.splice(2)]
  // TODO 有bug，不能提取，待修复, 且cli无build则报错
  Object.entries(tailwindArgsObj).map((cur) => {
    if (tailwindToBeExtractedOptions.indexOf(cur[0]) > -1) {
      specificArgs.push(cur)
      // 此处 findindex 找不到后返回的-1可能导致误删，但不可能找不到，即不做边界处理
      restArgs.splice(restArgs.findIndex(val => val === cur[0]), 1)
      cur[1] && restArgs.splice(restArgs.findIndex(val => val === cur[1]), 1)
      // restArgs.filter((val) => val !== cur[0])
    }
  })
  specificArgsObj = Object.fromEntries(specificArgs)
  restArgs = restArgs.join(' ')
  return {
    specificArgsObj,
    restArgs
  }
}

let command = ((arg = '') => (arg.startsWith('-') ? undefined : arg))(process.argv[2]) || 'build'

// // if (specificCommands[command] === undefined) {
// //   if (fs.existsSync(path.resolve(command))) {
// //     // TODO: Deprecate this in future versions
// //     // Check if non-existing command, might be a file.
// //     command = 'build'
// //   } else {
// //     help({
// //       message: `Invalid command: ${command}`,
// //       usage: ['tailwindcss <command> [options]'],
// //       commands: Object.keys(commands)
// //         .filter((command) => command !== 'build')
// //         .map((command) => `${command} [options]`),
// //       options: sharedFlags,
// //     })
// //     process.exit(1)
// //   }
// // }

// // Execute command
let { args: flags } = specificCommands[command]

const parseCliArgs = (() => {
  try {
    let result = arg(
      Object.fromEntries(
        Object.entries({ ...flags })
          .filter(([_key, value]) => !value?.type?.manualParsing)
          .map(([key, value]) => {
            return [key, typeof value === 'object' ? value.type : value]
          })
      ),
      { permissive: true }
    )

    // Manual parsing of flags to allow for special flags like oneOf(Boolean, String)
    for (let i = result['_'].length - 1; i >= 0; --i) {
      let flag = result['_'][i]
      if (!flag.startsWith('-')) continue

      let flagName = flag
      let handler = flags[flag]

      // Resolve flagName & handler
      while (typeof handler === 'string') {
        flagName = handler
        handler = flags[handler]
      }

      if (!handler) continue

      let args = []
      let offset = i + 1

      // Parse args for current flag
      while (result['_'][offset] && !result['_'][offset].startsWith('-')) {
        args.push(result['_'][offset++])
      }

      // Cleanup manually parsed flags + args
      result['_'].splice(i, 1 + args.length)

      // Set the resolved value in the `result` object
      result[flagName] = handler.type(
        args.length === 0 ? undefined : args.length === 1 ? args[0] : args,
        flagName
      )
    }

    // // Ensure that the `command` is always the first argument in the `args`.
    // // This is important so that we don't have to check if a default command
    // // (build) was used or not from within each plugin.
    // //
    // // E.g.: tailwindcss input.css -> _: ['build', 'input.css']
    // // E.g.: tailwindcss build input.css -> _: ['build', 'input.css']
    if (result['_'][0] !== command) {
      result['_'].unshift(command)
    }
    return result
  } catch (err) {
  }
})

module.exports = {
  getSpecificArgsObj,
  parseCliArgs
}
