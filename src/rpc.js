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
    this.allowedErrors = 10;

    // Reconnect on timeout
    this.rpc.on('timeout', () => {
      this.rpc.destroy();
      this.restoreSocket();
    });
    // Handle errors
    this.rpc.on('error', (e) => {
      if (this.allowedErrors > 0) {
        this.restoreSocket();
      } else {
        throw e;
      }
    });
    this.rpc.on('close', (hadError) => {
      if (hadError === true && this.allowedErrors <= 0) {
          throw new Error('An unexpected failure caused the socket ' + this.socketPath + ' to close.');
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

    // Allow the fd connection to error if ran a long period of time
    // Allow six by hour (high probability to be wrong here)
    setInterval(() => this.allowedErrors++, 1000 * 60 * 30);

    this.buffer = '';
  }

  async readResponse (chunk, resolve, reject) {
    this.buffer += chunk;
    try {
      const res = JSON.parse(this.buffer);
      // We didn't raise, we got the entire response we were waiting for.
      this.buffer = '';
      resolve(res);
    } catch (e) {
      this.rpc.once('data', (chunk) => {
        this.readResponse(chunk, resolve, reject);
      });
    }
  }

  async _jsonRpcRequest (data) {
    return new Promise((resolve, reject) => {
      this.rpc.write(data);
      this.rpc.once('data', (chunk) => {
        // lightningd may send the result in multiple chunks
        this.readResponse(chunk, resolve, reject);
      });
    });
  }

  async call (_method, _params) {
    _params = _params || {};
    const request = {
      jsonrpc: '2.0',
      id: this.id,
      method: _method,
      params: _params
    };

    const response = await this._jsonRpcRequest(JSON.stringify(request))
    if (response.hasOwnProperty('error')) {
      throw new Error('Calling \''+method+'\' with params \''+params+'\' returned \''+response.error+'\'');
    } else if (!response.hasOwnProperty('result')) {
      throw new Error('Got a non-JSONRPC2 response \''+response+'\' when calling \''+method+'\' with params \''+params+'\' returned \''+response.error+'\'');
    }

    return response.result;
  }

  restoreSocket () {
    this.rpc.destroy();
    this.rpc = net.createConnection({ path: this.socketPath });
    this.allowedErrors--;
  }
}

module.exports = RpcWrapper;
