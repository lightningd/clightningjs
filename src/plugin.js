const RpcMethod = require('./method.js');
const RpcWrapper = require('./rpc.js');

class Plugin {
  constructor () {
    // name: { type: "", default: "", description: "" }
    this.options = {};
    // RpcMethods
    this.methods = [];
    // strings
    this.subscriptions = [];
    // strings
    this.hookSubscriptions = [];
    // name: callback
    this.notifications = {};
    // name: callback
    this.hooks = {};
    this.rpc = undefined;
  }

  // The getmanifest call, all about us !
  _getmanifest (params) {
    let opts = [];
    for (let name in this.options) {
      opts.push({
        name: name,
        type: this.options[name].type,
        default: this.options[name].default,
        description: this.options[name].description
      });
    }
    return {
      options: opts,
      rpcmethods: this.methods.map(function (method) {
        return {
          name: method.name,
          usage: method.usage,
          description: method.description,
          long_description: method.longDescription
        }
      }),
      subscriptions: this.subscriptions,
      hooks: this.hooks
    }
  }

  // We are almost done !
  _init (params) {
    const socketPath = params.configuration['lightning-dir'] + params.configuration['rpc-file'];
    this.rpc = new RpcWrapper(socketPath);
    for (let opt in params.options) {
      this.options[opt].value = params.options[opt];
    }
    return {};
  }

  addMethod (name, callback, usage, description, longDescription) {
    if (!name || !callback) {
      throw new Error("You need to pass at least a name and a callback to register a method");
    }
    const method = new RpcMethod(name, usage, description, longDescription);
    method.main = callback;
    this.methods.push(method);
  }

  addOption (name, defaultValue, description, type) {
    if (!name || !defaultValue || !description) {
      throw new Error("You need to pass at least a name, default value and description for the option");
    }
    this.options[name] = {
      default: defaultValue,
      description: description,
      type: type || "string",
      value: defaultValue
    };
  }

  writeJsonrpcResponse (fd, result, id) {
    const payload = {
      jsonrpc: '2.0',
      result: result,
      id: id
    };
    fd.write(JSON.stringify(payload));
  }

  start () {
    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
      let chunk;
      let msg;
      while (chunk = process.stdin.read()) {
        try {
          msg = JSON.parse(chunk);
        } catch (e) {
          // Don't crash because of noise ...
          continue;
        }
        if (!msg) {
          // ... just wait for another line
          continue;
        }
        // JSONRPC2 sanity checks
        if (!msg || !msg.method || msg.jsonrpc !== '2.0') {
          continue;
        }
        if (!msg.id && msg.method in this.notifications) {
          this.notifications[msg.method](msg.params);
        }
        if (msg.method === 'getmanifest') {
          this.writeJsonrpcResponse(process.stdout, this._getmanifest(msg.params), msg.id);
          continue;
        }
        if (msg.method === 'init') {
          this.writeJsonrpcResponse(process.stdout, this._init(msg.params), msg.id);
          continue;
        }
        if (msg.method in this.hooks) {
          this.writeJsonrpcResponse(process.stdout, this.hooks[msg.method](msg.params), msg.id);
          continue;
        }
        this.methods.forEach((m) => {
          if (m.name === msg.method) {
            Promise.resolve(m.main(msg.params)).then((response) => {
              this.writeJsonrpcResponse(process.stdout, response, msg.id);
            });
          }
        });
      }
    });
  }
}

module.exports = Plugin;
