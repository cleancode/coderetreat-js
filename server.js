var util = require("util"),
    fs = require("fs"),
    cli = require("cli"),
    path = require("path"),
    daemon = require("daemon"),
    connect = require("connect"),
    _ = require("underscore")


cli.parse({
  "host":  ["h", "Ip to bind to", "string", "0.0.0.0"],
  "port":  ["p", "Port to bind to", "number", 3030],
  "daemonize":  [false, "Make me a deamon", "boolean", false],
  "pid":  [false, "Path to pid file, required if daemonized", "path", "/tmp/dropit.pid"],
  "log":  [false, "Path to log file, required if daemonized", "path", "/tmp/dropit.log"]
})


cli.main(function(args, options) {
  if (options.daemonize && (!options.pid || !options.log)) {
    cli.fatal("--pid and --log are required if --daemonize")
    cli.getUsage()
  }

  connect.bodyParser.parse["plain/text"] = function(rawBody) { return rawBody }

  connect(
    connect.bodyParser(),
    connect.router(function(resource) {
      resource.get("/ping", function(request, response) {
        response.writeHead(200, {"Content-Type": "plain/text"})
        response.end("PONG")
      })
      resource.post("/echo", function(request, response) {
        util.log(request.headers, request.body)
        response.writeHead(200, {"Content-Type": request.headers["content-type"]})
        response.end(request.body)
      })
    }),
    connect["static"](path.join(__dirname, "public"))
  ).listen(options.port, options.host)

  if (options.daemonize) {
    daemon.daemonize(options.log, options.pid, function(error, started) {
      if (error) {
        cli.fatal("unable to make him a daemon:" + error)
        console.dir(error.stack)
        process.exit(1)
      }
    })
  }
})
