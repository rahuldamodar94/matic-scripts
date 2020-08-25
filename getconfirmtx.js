const Web3 = require("web3");
let artifacts = require("./abi.json");
// Ethereum provider
const provider = new Web3.providers.WebsocketProvider(
  "wss://goerli.infura.io/ws/v3/5687b932e64441e5a297a0bfba8895cd"
);
const web3 = new Web3(provider);
const withdrawContractInstance = new web3.eth.Contract(
  artifacts.withdraw,
  "0x2923C8dD6Cdf6b2507ef91de74F1d5E0F11Eac53"
);
const chil_provider = new Web3.providers.HttpProvider(
  "https://rpc-mumbai.matic.today"
);
const child_web3 = new Web3(chil_provider);
let tx_array = [];
async function checkInclusion(userAddr, rootToken, token, blockNumber) {
  const exitContractInstance = new web3.eth.Contract(
    artifacts.exit,
    "0xE2Ab047326B38e4DDb6791551e8d593D30E02724"
  );
  return new Promise(async (resolve, reject) => {
    let results = await web3.eth.getPastLogs({
      fromBlock: blockNumber,
      toBlock: "latest",
      address: "0xE2Ab047326B38e4DDb6791551e8d593D30E02724",
    });

    for (result of results) {
      let to = web3.eth.abi.decodeParameters(["address"], result.topics[2]);
      let tokenID = web3.eth.abi.decodeParameters(
        ["uint256"],
        result.topics[3]
      );

      if (to["0"].toLowerCase() === userAddr.toLowerCase()) {
        if (await exitContractInstance.methods.exists(tokenID["0"]).call()) {
          let exitDetails = await withdrawContractInstance.methods
            .exits(tokenID["0"])
            .call();
          if (
            exitDetails.token === rootToken &&
            exitDetails.receiptAmountOrNFTId === token
          ) {
            tx_array.push(result);
          }
        }
      }
    }
    resolve(tx_array);
  });
}
checkInclusion(
  "0xFd71Dc9721d9ddCF0480A582927c3dCd42f3064C",
  "0x499d11E0b6eAC7c0593d8Fb292DCBbF815Fb29Ae",
  "1000000000000000000",
  3270937
)
  .then((res) => {
    console.log(tx_array);
  })
  .catch((err) => {
    console.log(err);
  })
  .finally(() => {
    provider.disconnect();
  });
