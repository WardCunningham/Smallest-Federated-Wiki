# defaultargs.coffee
path = require 'path'

module.exports = (argv) ->
  argv.o or= ''
  argv.p or= 3000
  argv.r or= path.join("#{__dirname}", '..', '..', '..')
  argv.d or= path.relative("#{__dirname}", "#{argv.r}/data")
  argv.c or= path.relative("#{__dirname}", "#{argv.r}/client")
  argv.db or= path.resolve(path.join(argv.d, 'pages'))
  argv.status = path.resolve(path.join(argv.d, 'status'))
  argv.u or= 'http://localhost' + (':' + argv.p) unless argv.p is 80
  argv
