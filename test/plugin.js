#!/usr/bin/node

const Plugin = require('../src/plugin.js');

const test = new Plugin();

function sayHello(params) {
  if (!params || params.length === 0) {
    return 'Hello world';
  } else {
    return 'Hello ' + params[0];
  }
}

function sayBye(params) {
  return 'Bye bye ' + test.options['byename'].value;
}

test.addOption('byename', 'continuum', 'The name of whow I should say bye to', 'string');
test.addMethod('hello', sayHello, 'name', 'If you launch me, I\'ll great you !');
test.addMethod('bye', sayBye, '', 'If you launch me, I\'ll say good bye');
test.start();
