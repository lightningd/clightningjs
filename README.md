# clightningjs
[C-lightning](https://github.com/ElementsProject/lightning) [plugin](https://lightning.readthedocs.io/PLUGINS.html) library for nodejs, without high voltage sign

## Installation
```bash
npm install clightningjs --save
```
If you have a running Bitcoin testnet node you can try out the test plugin at [test/plugin.js](test/plugin.js) :
```bash
npm test
```

## Usage

### Summary

- [Methods](#methods)
- [Startup options](#startup-options)
- [Notifications](#notifications-subscription)
- [Hooks](#hooks-subscription)
- [Advanced usage](#more)

### Methods
A method should take a JSON array as parameter and return either a valid JSON-encodable value :
```javascript
#!/usr/bin/env node
const Plugin = require('clightningjs');

const helloPlugin = new Plugin();

function sayHello(params) {
  if (!params || params.length === 0) {
    return 'Hello world';
  } else {
    return 'Hello ' + params[0];
  }
}

helloPlugin.addMethod('hello', sayHello, 'name', 'If you launch me, I\'ll great you !');
helloPlugin.start();
```
Or a promise :
```javascript
#!/usr/bin/env node
const Plugin = require('clightningjs');

const helloPlugin = new Plugin();

async function sayBye(params) {
  return Promise.resolve('Bye bye');
}

test.addMethod('bye', sayBye, '', 'If you launch me, I\'ll say good bye');
helloPlugin.start();
```

### Startup options
You can add a startup option to `lightningd` and make a method behave depending on it:
```javascript
#!/usr/bin/env node
const Plugin = require('clightningjs');

const helloPlugin = new Plugin();

async function sayBye(params) {
  return Promise.resolve('Bye bye ' + test.options['byename'].value);
}

helloPlugin.addOption('byename', 'continuum', 'The name of whow I should say bye to', 'string');
helloPlugin.addMethod('bye', sayBye, '', 'If you launch me, I\'ll say good bye');
helloPlugin.start();
```

### Notifications subscription
You can subscribe to `lightningd` notifications, the plugin will emit events upon their reception :
```javascript
#!/usr/bin/env node
const fs = require('fs');
const Plugin = require('clightningjs');

const listenPlugin = new Plugin();

listenPlugin.subscribe('warning');
listenPlugin.notifications.warning.on('warning', (params) => {
  fs.writeFile('log', params.warning.log, () => {});
});

listenPlugin.start();
```

### Hooks subscription
You can subscribe to `lightningd` hooks :
```javascript
#!/usr/bin/env node
const fs = require('fs');
const Plugin = require('clightningjs');

const dbBackup = new Plugin();

function useLessBackup(params) {
  fs.writeFile('logDb', params.writes, () => {});
  return true;
}

test.addHook('db_write', useLessBackup);
test.start();
```

## More
You can restrict RPC control over your plugin with
```javascript
// myStaticPlugin cannot be stopped by RPC
const myStaticPlugin = new Plugin({ dynamic: false });
```

You can log to `lightningd` logs with `myPlugin.log(message, logLevel)`, with the level
defaulting to 'info'.

You can do some stuff at initialization (just before responding to the `init` message):
```javascript
const myPlugin = new Plugin();
// "params" contains the params passed by `lightningd` along with the `init` message
myPlugin.onInit= function (params) {
	myPlugin.log('I\'m going to be initialized !!');
};
```

You can return a promise to a hook or a RPC method callback. This allows to not restrain
the context of an RPC method or a hook result only to the registered callback. Here is an
example from [`test/hodl.js`](test/hodl.js) which, well, hodl an HTLC..
```javascript
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

myWonderfulPlugin.addMethod('releasehtlc', releaseHtlc, '', 'release an HTLC', '.');

myWonderfulPlugin.start();
```

## More about C-lightning plugins

You can find more about C-lightning plugins :
- On the [lightningd/plugins repo](https://github.com/lightningd/plugins)
- On the [doc](https://lightning.readthedocs.io/PLUGINS.html)
- On the [C-lightning repo](https://github.com/ElementsProject/lightning)

Plugins in other languages :
- [Python](https://github.com/ElementsProject/lightning/blob/master/contrib/pylightning)
- [C](https://github.com/ElementsProject/lightning/blob/master/plugins/libplugin.h)
- [Go](https://github.com/niftynei/glightning)
- [C++](https://github.com/darosior/lightningcpp)

## LICENCE

BSD 3-clause clear
