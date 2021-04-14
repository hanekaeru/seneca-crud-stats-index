'use strict';

const fs = require('fs');
const spawn = require('child_process').spawn;

// same logging for microservices...
const out = fs.openSync('./out.log', 'a');
const err = fs.openSync('./err.log', 'a');

// launch options
const spawn_opts = {
  detached: true,
  stdio: [ 'ignore', out, err ]
};

// launch microservices...
const app = spawn(process.argv[0], ['api/app.js','--seneca.log.info'], spawn_opts);
app.unref();

const dt = spawn(process.argv[0], ['wr/wr-service.js','--seneca.log.info'], spawn_opts);
dt.unref();

const stats = spawn(process.argv[0], ['stats/stats-service.js','--seneca.log.info'], spawn_opts);
stats.unref();

const index = spawn(process.argv[0], ['index/index-service.js','--seneca.log.info'], spawn_opts);
index.unref();