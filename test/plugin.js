#!/usr/bin/node
const fs = require('fs');
const Plugin = require('../src/plugin.js');

const test = new Plugin();

function sayHello(params) {
  if (!params || params.length === 0) {
    return 'Hello world';
  } else {
    return 'Hello ' + params[0];
  }
}

async function sayBye(params) {
  return Promise.resolve('Bye bye ' + test.options['byename'].value);
}

function useLessBackup(params) {
  fs.writeFile('logDb', params.writes, () => {});
  return true;
}

test.subscribe('warning');
test.notifications.warning.on('warning', (params) => {
  fs.writeFile('log', params.warning.log, () => {});
});

test.addHook('db_write', useLessBackup);

test.addOption('byename', 'continuum', 'The name of whow I should say bye to', 'string');
test.addMethod('hello', sayHello, 'name', 'If you launch me, I\'ll great you !');
test.addMethod('bye', sayBye, '', 'If you launch me, I\'ll say good bye');
test.start();
