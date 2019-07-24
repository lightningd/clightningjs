# clightningjs
[C-lightning](https://github.com/ElementsProject/lightning) [plugin](https://lightning.readthedocs.io/PLUGINS.html) library for nodejs, without high voltage sign  
  
## Usage
### Methods
You can add a method to the `lightningd` interface, either synchronously :
```javascript
#!/usr/bin/node
const Plugin = require('plugin.js');

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
Or asynchronously :
```javascript
#!/usr/bin/node
const Plugin = require('plugin.js');

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
#!/usr/bin/node
const Plugin = require('plugin.js');

const helloPlugin = new Plugin();

async function sayBye(params) {
  return Promise.resolve('Bye bye ' + test.options['byename'].value);
}

helloPlugin.addOption('byename', 'continuum', 'The name of whow I should say bye to', 'string');
helloPlugin.addMethod('bye', sayBye, '', 'If you launch me, I\'ll say good bye');
helloPlugin.start();
```
  
### Subscribe to notifications
You can subscribe to `lightningd` notifications, the plugin will emit events upon their reception :
```javascript
#!/usr/bin/node
const fs = require('fs');
const Plugin = require('plugin.js');

const listenPlugin = new Plugin();

listenPlugin.subscribe('warning');
listenPlugin.notifications.warning.on('warning', (params) => {
  fs.writeFile('log', params.warning.log, () => {});
});

listenPlugin.start();
```
  
### Subscribe to hooks
You can subscribe to `lightningd` hooks :
```javascript
#!/usr/bin/node
const fs = require('fs');
const Plugin = require('plugin.js');

const dbBackup = new Plugin();

function useLessBackup(params) {
  fs.writeFile('logDb', params.writes, () => {});
  return true;
}

test.addHook('db_write', useLessBackup);
test.start();
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
