#!/usr/bin/env node
const assert = require('assert');
const EventEmitter = require('events');
const fs = require('fs');
const Plugin = require('../src/plugin.js');

/* A quick test plugin for an HTLC hodled until releasehtlc RPC method is called
 * through lightningd. */

const myWonderfulPlugin = new Plugin({dynamic: true});
myWonderfulPlugin.relasedHtlc = new EventEmitter();

myWonderfulPlugin.addHook('htlc_accepted', () => {
  myWonderfulPlugin.log('Ok, I won\'t release the HTLC, but will return!');
  return new Promise((resolve, reject) => {
    myWonderfulPlugin.relasedHtlc.on('released', () => {
      myWonderfulPlugin.log('Resolved');
      resolve({'result': 'continue'});
    });
  });
});

function releaseHtlc(params) {
  myWonderfulPlugin.log('Ok, finally I will release the HTLC and all the stuck liquidity.');
  myWonderfulPlugin.relasedHtlc.emit('released');
  return "OK";
}

function testMethodPromise(params) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve('Ok'), 1000);
  });
}

myWonderfulPlugin.addMethod('releasehtlc', releaseHtlc, '', 'release an HTLC', '.');
myWonderfulPlugin.addMethod('testpromise', testMethodPromise, '', '', '');

myWonderfulPlugin.start();
