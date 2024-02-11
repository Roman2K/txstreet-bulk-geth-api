import express, {Express, Request, Response} from "express";

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
const app: Express =
  express().
    use(express.json({ limit: '50mb' })).
    use(cors());

// Enable BigInt JSON serialization.
//
// Avoids `TypeError: Do not know how to serialize a BigInt`
(BigInt.prototype as any).toJSON = function() {
  return this.toString()
};

type NonceResult = {
  account: string;
  count: number;
};

app.post('/nonces', async (request: Request, response: Response) => {
  const accounts = request.body.accounts;
  const tasks: Promise<NonceResult>[] = [];

  accounts.forEach((account: string) => {
    tasks.push(
      new Promise(async (resolve, reject) => {
        try {
          const count = await web3.eth.getTransactionCount(account); 
          resolve({ account, count }); 
        } catch (error) {
          console.error(
            `Error while getting transaction count of ${account}: ${error}`
          );

          resolve({ account, count: 0 });
        }
      })
    )
  }); 

  response.send(await Promise.all(tasks)); 
});

type ContractCodeResult = {
  contract: string;
  code: string;
};

app.post('/contract-codes', async (request: Request, response: Response) => {
  const contracts = request.body.contracts;
  const tasks: Promise<ContractCodeResult>[] = [];

  contracts.forEach((contract: string) => {
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

type TransactionReceiptResult = {
  hash: string;
  receipt: string | null;
};

app.post('/transaction-receipts', async (request: Request, response: Response) => {
  const hashes = request.body.hashes;
  const tasks: Promise<TransactionReceiptResult>[] = [];

  hashes.forEach((hash: string) => {
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

app.get('/ping', async (request: Request, response: Response) => {
  response.send("Pong\n");
});

const port = process.env.PORT || 80;
app.listen(port);
console.log("listening on port " + port);
