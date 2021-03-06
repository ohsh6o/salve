/* eslint-env node */

"use strict";

const { URL } = require("url");
const fetch = require("node-fetch");
const crypto = require("@trust/webcrypto");
const util = require("util");

global.URL = URL;
global.fetch = fetch;
global.crypto = crypto;
global.TextEncoder = util.TextEncoder;

const Mocha = require("mocha");

const oldRun = Mocha.prototype.run;
Mocha.prototype.run = function run() {
  this.reporter(process.env.CONTINUOUS_INTEGRATION === undefined ?
                "dot" : "spec");
  // eslint-disable-next-line prefer-rest-params
  return oldRun.apply(this, arguments);
};
