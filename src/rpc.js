const net = require('net');
const fs = require('fs');

class RpcWrapper {
  constructor (socketPath) {
    if (!socketPath) {
      throw new Error('The RPC wrapper needs a socket path.');
    }
    this.socketPath = socketPath;
    this.rpc = net.createConnection({ path: this.socketPath });
    this.id = 0;
    this.maxErrors = 10;

    // Reconnect on timeout
    this.rpc.on('timeout', () => {
      this.rpc.destroy();
      this.restoreSocket();
    });
    // Handle errors
    this.rpc.on('error', (e) => {
      if (this.maxErrors > 0) {
        this.restoreSocket();
      } else {
        throw e;
      }
    });
    this.rpc.on('close', (hadError) => {
      if (hadError === true) {
        if (this.maxErrors > 0) {
          this.rpc.destroy();
          this.restoreSocket();
        } else {
          throw new Error('An unexpected failure caused the socket ' + this.socketPath + ' to close.');
        }
      } else {
        this.rpc.destroy();
        this.restoreSocket();
      }
    });
    this.rpc.on('error', (e) => {
      fs.writeFile('log', e, () => {});
      this.rpc.destroy();
      this.restoreSocket();
    });
  }

  send (data) {
    return new Promise( (resolve, reject) => {
      this.rpc.write(data);

      this.rpc.once('data', (d) => {
        resolve(d);
      });
    });
  }

  call (_method, _params) {
    _params = _params || {};
    const request = {
      jsonrpc: '2.0',
      id: this.id,
      method: _method,
      params: _params
    };

    return this.send(JSON.stringify(request)).then((data) => JSON.parse(data).result);
  }

  restoreSocket () {
    this.rpc.destroy();
    this.rpc = net.createConnection({ path: this.socketPath });
    this.maxErrors--;
  }
}

module.exports = RpcWrapper;
