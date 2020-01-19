#!/usr/bin/env node
const fs = require('fs');
const Plugin = require('../src/plugin.js');

const test = new Plugin({dynamic: false});

test.subscribe('forward_event');
test.notifications.forward_event.on('forward_event', (params) => {
  if ( params.forward_event.status == "settled" ) {
    fs.appendFile('log', JSON.stringify(params.forward_event) + '\n\n', () => {});
  }
});

test.start();
