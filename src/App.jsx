import "./App.css";
import { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { init, getInstance } from "./utils/fhevm";
import { toHexString } from "./utils/utils";
import { Connect } from "./Connect";
import { Contract, Interface } from "ethers";
import PixelFightABI from "./abi/pixelFightABI";

const CONTRACT_ADDRESS = "0x8a5738be1E9Ca5E33082AC2ba3bc8027D11c9946";

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    init()
      .then(() => {
        setIsInitialized(true);
      })
      .catch(() => setIsInitialized(false));
  }, []);

  if (!isInitialized) return null;

  return (
    <div className="App">
      <div className="menu">
        <Connect>{(account, provider) => <PixelFight provider={provider}/>}</Connect>
      </div>
    </div>
  );
}

function PixelFight({ provider }) {

  const [loading, setLoading] = useState("");
  const [gameId, setGameId] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const createSingleplayerGame = async (event) => {
    console.log('CLICKED ON SINGLEPLAYER');
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, PixelFightABI, signer);
      setLoading("Sending transaction...");
      const transaction = await contract.createGame(true);
      setLoading("Waiting for transaction validation....");
      const result = await provider.waitForTransaction(transaction.hash);
      setLoading("");

      const receipt = await provider.getTransactionReceipt(transaction.hash);

      const iface = new Interface(PixelFightABI);

      let gameId = 0;

      for (const log of receipt.logs) {
        const logToParse = {
          topics: [...log.topics], // Spread to a new array to make it mutable
          data: log.data,
        };
        const parsedLog = iface.parseLog(logToParse);

        gameId = Number(parsedLog.args[0]);
      }
      console.log('gameId');
      console.log(gameId);
      setGameId(gameId);
      setGameStarted(true);
    } catch (e) {
      console.log(e);
    }
  };

  const createMultiplayerGame = async (event) => {
    console.log('CLICKED ON MULTIPLAYER');
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, PixelFightABI, signer);
      setLoading("Sending transaction...");
      const transaction = await contract.createGame(false);
      console.log("Waiting for transaction validation...");
      const result = await provider.waitForTransaction(transaction.hash);
      setLoading("");

      const receipt = await provider.getTransactionReceipt(transaction.hash);

      const iface = new Interface(PixelFightABI);

      let gameId = 0;

      for (const log of receipt.logs) {
        const logToParse = {
          topics: [...log.topics], // Spread to a new array to make it mutable
          data: log.data,
        };
        const parsedLog = iface.parseLog(logToParse);

        gameId = Number(parsedLog.args[0]);
      }
      console.log('gameId');
      console.log(gameId);
      setGameId(gameId);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div>
      <h1>
        Welcome to <span>Pixel Fight</span>
      </h1>
      <span className="footer">
        Switch to Inco Gentry Testnet on Metamask:{" "}
        <a
          href="https://docs.inco.network/getting-started/connect-metamask"
          target="_blank"
        >
          Guide
        </a>
      </span>

      {gameStarted && (
        <div>
          <br></br>
          <Button onClick={createSingleplayerGame}>New singleplayer game</Button>
          <Button onClick={createMultiplayerGame}>New 2 players game</Button>
          <br></br>
          <input name="gameId" />
          <Button>Join game</Button>
          <br></br>
        </div>
      )}

      {!gameStarted && (
        <div>
          <br></br>
          <Button onClick={createSingleplayerGame}>New singleplayer game</Button>
          <Button onClick={createMultiplayerGame}>New 2 players game</Button>
          <br></br>
          <input name="gameId" />
          <Button>Join game</Button>
          <br></br>
        </div>
      )}

      <span className="footer">
        Documentation:{" "}
        <a
          href="https://docs.inco.network/introduction/inco-network-introduction"
          target="_blank"
        >
          docs.inco.network
        </a>
      </span>
    </div>
  );
}

export default App;
