var fs = require("fs");
var util = require("util");
var path = require("path");

var filename = path.join(__dirname, "vendor", "jasmine", "jasmine-1.0.1.js");

global.window = {
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval
};
var src = fs.readFileSync(filename);
var jasmine = require("vm").runInThisContext(src + "\njasmine;", filename);
delete global.window;

function noop(){}

jasmine.executeSpecsInFolder = function(folder, done, isVerbose, showColors, matcher){
  var log = [];
  var columnCounter = 0;
  var start = 0;
  var elapsed = 0;
  var verbose = isVerbose || false;
  var fileMatcher = new RegExp(matcher || "\.js$");
  var colors = showColors || false;
  var specs = jasmine.getAllSpecFiles(folder, fileMatcher);

  var ansi = {
    green: "\033[32m",
    red: "\033[31m",
    yellow: "\033[33m",
    none: "\033[0m"
  };

  for (var i = 0, len = specs.length; i < len; ++i){
    var filename = specs[i];
    require(filename.replace(/\.*$/, ""));
  }

  jasmine._specificationsCounter = 0;

  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.reporter = {
    log: function(str){
    },
    
    reportSpecStarting: function(runner) {
    },
    
    reportRunnerStarting: function(runner) {
      util.puts("Started");
      start = Number(new Date);
    },

    reportSuiteResults: function(suite) {
      var specResults = suite.results();
      var path = [];
      while(suite) {
        path.unshift(suite.description);
        suite = suite.parentSuite;
      }
      var description = path.join(" ");

      if (verbose)
        log.push("Spec " + description);

      specResults.items_.forEach(function(spec){
        if (spec.failedCount > 0 && spec.description) {
          if (!verbose)
              log.push(description);
          log.push("  it " + spec.description);
          spec.items_.forEach(function(result){
            log.push("  " + result.trace.stack + "\n");
          });
        }
      });
    },

    reportSpecResults: function(spec) {
      jasmine._specificationsCounter++;
      var result = spec.results();
      var msg = "";
      if (result.passed()) {
        msg = (colors) ? (ansi.green + "." + ansi.none) : ".";
      } else {
        msg = (colors) ? (ansi.red + "F" + ansi.none) : "F";
      }
      util.print(msg);
      if (columnCounter++ < 50) return;
      columnCounter = 0;
      util.print("\n");
    },


    reportRunnerResults: function(runner) {
      elapsed = (Number(new Date) - start) / 1000;
      util.puts("\n");
      log.forEach(function(log){
        util.puts(log);
      });
      util.puts("Finished in " + elapsed + " seconds");

      var summary = jasmine.printRunnerResults(runner);
      if(colors) {
        if(runner.results().failedCount === 0 )
          util.puts(ansi.green + summary + ansi.none);
        else
          util.puts(ansi.red + summary + ansi.none);
      } else {
        util.puts(summary);
      }
      process.stdout.on("close", function() {
        (done||noop)(runner, log);
      })
      process.exit(0);
    }
  };
  jasmineEnv.execute();
};

jasmine.getAllSpecFiles = function(dir, matcher){
  var specs = [];

  if (fs.statSync(dir).isFile() && dir.match(matcher)) {
    specs.push(dir);
  } else {
    var files = fs.readdirSync(dir);
    for (var i = 0, len = files.length; i < len; ++i){
      var filename = dir + "/" + files[i];
      if (fs.statSync(filename).isFile() && filename.match(matcher)){
        specs.push(filename);
      }else if (fs.statSync(filename).isDirectory()){
        var subfiles = this.getAllSpecFiles(filename, matcher);
        subfiles.forEach(function(result){
          specs.push(result);
        });
      }
    }
  }
  
  return specs;
};

jasmine.printRunnerResults = function(runner){
  var results = runner.results();
  var suites = runner.suites();
  var msg = "";
  msg += jasmine._specificationsCounter + " test" + ((jasmine._specificationsCounter === 1) ? "" : "s") + ", ";
  msg += results.totalCount + " assertion" + ((results.totalCount === 1) ? "" : "s") + ", ";
  msg += results.failedCount + " failure" + ((results.failedCount === 1) ? "" : "s") + "\n";
  return msg;
};

function now(){
  return new Date().getTime();
}

jasmine.wait = function(){
  var wait = jasmine.wait;
  wait.start = now();
  wait.done = false;
  (function innerWait(){
    waits(10);
    runs(function() {
      if (wait.start + wait.timeout < now()) {
        expect("timeout waiting for spec").toBeNull();
      } else if (wait.done) {
        wait.done = false;
      } else {
        innerWait();
      }
    });
  })();
};

// TODO: should be configurable
jasmine.wait.timeout = 4 * 1000;
jasmine.done = function(){
  jasmine.wait.done = true;
};

for (var key in jasmine) {
  exports[key] = jasmine[key];
}
