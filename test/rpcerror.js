#!/usr/bin/env node
const Plugin = require('../src/plugin.js');

const test = new Plugin();

function testError(params) {
  throw new Error("Ciao");
}

async function testErrorPromise(params) {
  return Promise.reject(new Error("Ciao"));
}

test.addMethod('testerror', testError, '', '', 'Test the RPC errors');
test.addMethod('testerrorpromise', testErrorPromise, '', 'Test the RPC errors in Promise');
test.start();
