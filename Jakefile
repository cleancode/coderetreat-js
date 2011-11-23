var fs = require("fs"),
    url = require("url"),
    util = require("util"),
    path = require("path"),
    async = require("async"),
    http = require("http"),
    request = require("request"),
    exec = require("child_process").exec,
    _ = require("underscore")

jake = require("./lib/jake-spawner")(jake)

var ROOT_DIRECTORY = path.normalize(__dirname)
var WORK_DIRECTORY = path.join(ROOT_DIRECTORY, ".work")
var RUN_DIRECTORY = path.join(WORK_DIRECTORY, "pid")
var LOG_DIRECTORY = path.join(WORK_DIRECTORY, "log")

var GOL = {
  root: ROOT_DIRECTORY,
  pid: path.join(RUN_DIRECTORY, "gol.pid"),
  log: path.join(LOG_DIRECTORY, "gol.log"),
  url: "http://0.0.0.0:3030",
  host: "0.0.0.0",
  port: 3030
}


desc("Install work environment")
task("install", function() {
  async.series([
    // function(next) { exec("npm install -g jake") },
    function(next) { exec("npm install -g jshint", next) },
    function(next) { exec("npm install -g minimatch", next) }
  ], 
  function(error) {
    if (error) fail(error)
    complete()
  })
}, true)

desc("Prepare work environment")
task({"prepare": ["lint"]}, function() {
  async.series([
    function(next) { fs.mkdir(WORK_DIRECTORY, 0777, function() { next() }) },
    function(next) { fs.mkdir(RUN_DIRECTORY, 0777, function() { next() }) },
    function(next) { fs.mkdir(LOG_DIRECTORY, 0777, function() { next() }) }
  ], 
  function(error) {
    if (error) fail(error)
    complete()
  })
}, true)

desc("Check all source files")
task("lint", function() {
  var jshint = require("jshint").JSHINT,
      filesToLint = new jake.FileList()
 
  filesToLint.include(path.join(ROOT_DIRECTORY, "src/*.js"))
  filesToLint.include(path.join(ROOT_DIRECTORY, "spec/src/*.js"))
  filesToLint.include(path.join(ROOT_DIRECTORY, "server.js"))
  async.series(
    _(filesToLint.toArray()).map(function(path) {
      return function(next) {
        fs.readFile(path, function(error, data) {
          if (!jshint(data.toString(), {asi: true, laxbreak: false, sub: true})) {
            console.log("File " + path + ":")
            _(jshint.data().errors).each(function(error) {
              console.log("\t" + error.reason + " -- " + error.line + ":" + error.character + " -> " + error.evidence.trim())
            })
            return next("lint")
          }
          next()
        })
      }
    }),
    function(error) {
      if (error) fail(error)
      complete()
    }
  )
}, true)


desc("Start all services")
task({"start": ["prepare"]}, function() {
  async.series([
      function(next) { jake.start("gol", next) }
    ], 
    function(error) {
      if (error) fail(error)
      complete()
    }
  )
}, true)


desc("Stop all services")
task({"stop": ["prepare"]}, function() {
  async.parallel([
      function(next) { jake.stop("gol", next) }
    ],
    function(error) {
      if (error) fail(error)
      complete()
    }
  )
}, true)


desc("Clean all artifacts")
task({"clean": ["stop"]}, function() {
  fs.rmrfdir = require("rimraf")
  fs.rmrfdir(WORK_DIRECTORY, complete)
}, true)


desc("Run all specs")
task("spec", function() {
  var path = require("path"),
      jasmine = require("./spec/lib/jasmine-node"),
      specFolderPath = path.join(ROOT_DIRECTORY, "spec", "src"),
      showColors = true,
      isVerbose = true,
      filter = /\.js$/

  if (arguments.length > 0) {
    filter = new RegExp(
      _(Array.prototype.slice.call(arguments, 0)).map(function(suite) {
        return suite + "\\.js$"
      }).join("|")
    )
  }

  for (var key in jasmine) global[key] = jasmine[key]
  jasmine.executeSpecsInFolder(specFolderPath, function(runner, log) {
    process.exit(runner.results().failedCount)
  }, isVerbose, showColors, filter)
})



jake.service("gol", function(gol) {
  gol.start = function(callback) {
    jake.node("server.js", "-p", GOL.port, "--daemonize", "--pid", GOL.pid, "--log", GOL.log, function(error, process) {
      jake.waitUntil(_(gol.ping).bind(gol), callback, 2500)
    })
  }

  gol.stop = function(callback) {
    jake.kill(GOL.pid)
    jake.waitWhile(_(gol.ping).bind(gol), callback, 2500)
  }

  gol.ping = function(callback) {
    request(["http://", GOL.host, ":", GOL.port, "/ping"].join(""), function(error, response, body) {
      callback(null, !error && (response && response.statusCode === 200))
    })
  }
})
