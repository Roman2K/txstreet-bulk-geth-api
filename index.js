const Express         = require('express');
const cors            = require('cors');
const net             = require('net');
const { Web3 }        = require('web3');
const dotenv          = require('dotenv');
const { IpcProvider } = require('web3-providers-ipc');

dotenv.config({}); 

const provider = () => {
  const rpcUrl  = process.env.RPC_URL; // Example: "http://eth-node:8545"
  const ipcPath = process.env.IPC || '/mnt/geth/geth.ipc';

  if (rpcUrl) {
    console.log(`Connecting to RPC endpoint: ${rpcUrl}`);
    return rpcUrl;
  }

  console.log(`Connecting to IPC: ${ipcPath}`);
  return new IpcProvider(ipcPath, net);
}

const web3 = new Web3(provider());
const app =
  Express().
    use(Express.json({ limit: '50mb' })).
    use(cors());

app.post('/nonces', async (request, response) => {
  const accounts = request.body.accounts;
  const tasks = [];
  accounts.forEach((account) => {
    tasks.push(
      new Promise(async (resolve, reject) => {
        try {
          const count = await web3.eth.getTransactionCount(account); 
          resolve({ account, count }); 
        } catch (error) {
          console.error(
            `Error while getting code of contract ${account}: ${error}`
          );

          resolve({ account, count: 0 });
        }
      })
    )
  }); 
  response.send(await Promise.all(tasks)); 
});

app.post('/contract-codes', async (request, response) => {
  const contracts = request.body.contracts;
  const tasks = [];
  contracts.forEach((contract) => {
    tasks.push(
      new Promise(async (resolve, reject) => {
        try {
          const code = await web3.eth.getCode(contract); 
          resolve({ contract, code }); 
        } catch (error) {
          console.error(
            `Error while getting code of contract ${contract}: ${error}`
          );

          resolve({ contract, code: "0x" });
        }
      })
    )
  }); 
  response.send(await Promise.all(tasks)); 
});

app.post('/transaction-receipts', async (request, response) => {
  const hashes = request.body.hashes;
  const tasks = [];
  hashes.forEach((hash) => {
    tasks.push(
      new Promise(async (resolve, reject) => {
        try {
          const receipt = await web3.eth.getTransactionReceipt(hash); 
          resolve({ hash, receipt }); 
        } catch (error) {
          console.error(
            `Error while getting transaction receipt of ${hash}: ${error}`
          );

          resolve({ hash, receipt: null });
        }
      })
    )
  }); 
  response.send(await Promise.all(tasks)); 
});

const port = process.env.PORT || 80;
app.listen(port);
console.log("listening on port " + port);
