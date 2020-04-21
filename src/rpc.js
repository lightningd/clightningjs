const net = require('net');
const fs = require('fs');

class RpcWrapper {
  constructor (socketPath) {
    if (!socketPath) {
      throw new Error('The RPC wrapper needs a socket path.');
    }
    this.socketPath = socketPath;
    // TODO: wait for the 'connect' event ?
    this.rpc = net.createConnection({ path: this.socketPath });
    this.id = 0;
    this.allowedErrors = 10;

    // Reconnect on timeout
    this.rpc.on('timeout', async () => {
      this.rpc.destroy();
      try {
        await this.restoreSocket();
      } catch (e) {
        process.exit();
      }
    });
    // Handle errors
    this.rpc.on('error', async (e) => {
      if (this.allowedErrors > 0) {
        try {
          await this.restoreSocket();
        } catch (e) {
          process.exit();
        }
      } else {
        throw e;
      }
    });
    this.rpc.on('close', async (hadError) => {
      if (hadError === true && this.allowedErrors <= 0) {
          throw new Error('An unexpected failure caused the socket ' + this.socketPath + ' to close.');
      } else {
        this.rpc.destroy();
        try {
          await this.restoreSocket();
        } catch (e) {
          process.exit();
        }
      }
    });
    this.rpc.on('error', async (e) => {
      fs.writeFile('log', e, () => {});
      this.rpc.destroy();
      try {
        await this.restoreSocket();
      } catch (e) {
        process.exit();
      }
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

  async restoreSocket () {
    return new Promise((resolve, reject) => {
      this.rpc.destroy();
      this.allowedErrors--;
      this.rpc = net.createConnection({ path: this.socketPath });
      this.rpc.on('connect', () => resolve());
      this.rpc.on('error', () => reject());
      this.rpc.on('timeout', () => reject());
    });
  }
}

module.exports = RpcWrapper;
