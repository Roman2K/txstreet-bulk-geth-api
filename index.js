const Express = require('express');
const cors = require('cors');
const net = require('net');
const Web3 = require('web3'); 
const web3 = new Web3(new Web3.providers.IpcProvider('/mnt/geth/geth.ipc', net));
const app = Express();
app.use(Express.json({ limit: '50mb' }));
app.use(cors());
app.post('/nonces', async (request, response) => {
    const accounts = request.body.accounts;
    const tasks = [];
    accounts.forEach((account) => {
        tasks.push(
            new Promise((resolve, reject) => {
                web3.eth.getTransactionCount(account).then((count) => {
                    count = count || 0; 
                    resolve({ account, count }); 
                }).catch(err => {
                    resolve({ account, count: 0 })
                })
            })
        )
    }); 
    response.send(await Promise.all(tasks)); 
});