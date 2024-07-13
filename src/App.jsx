import "./App.css";
import { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { init, getInstance } from "./utils/fhevm";
import { toHexString } from "./utils/utils";
import { Connect } from "./Connect";
import { Contract, Interface } from "ethers";
import './styles.css'; // Import your CSS file for styles
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
  const [player1HP, setPlayer1HP] = useState(5);
  const [player2HP, setPlayer2HP] = useState(5);
  const [singleplayer, setSingleplayer] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(0);
  const [selectedAttack, setSelectedAttack] = useState(0);

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
      setSingleplayer(true);
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

  const makeMove = async (event) => {
    console.log('MAKE MOVE');
    if (single)
    try {
      const signer = await provider.getSigner();
      const instance = await getInstance();
      const attack = toHexString(instance.encrypt8(+selectedAttack));
      const block = toHexString(instance.encrypt8(+selectedBlock));


      const contract = new Contract(CONTRACT_ADDRESS, PixelFightABI, signer);
      setLoading("Sending transaction...");
      const transaction = await contract.makeMove(gameId, attack, block);
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

  const selectBlock = (blockId) => () => {
    setSelectedBlock(blockId);
  };

  const selectAttack = (attackId) => () => {
    setSelectedAttack(attackId);
  };

  const buttonStyle = { marginLeft: '200px', marginRight: '200px' };

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

      {gameStarted && (
        <div>
          <span>Game Number {gameId}</span>
          <br></br>
          <Button onClick={selectBlock(1)} style={buttonStyle} className={selectedBlock === 1 ? 'selectedBlock' : ''}>Block head</Button>
          <Button onClick={selectAttack(1)} style={buttonStyle} className={selectedAttack === 1 ? 'selectedAttack' : ''}>Attack head</Button>
          <br></br>
          <Button onClick={selectBlock(2)} style={buttonStyle} className={selectedBlock === 2 ? 'selectedBlock' : ''}>Block body</Button>
          <Button onClick={selectAttack(2)} style={buttonStyle} className={selectedAttack === 2 ? 'selectedAttack' : ''}>Attack body</Button>
          <br></br>
          <Button onClick={selectBlock(3)} style={buttonStyle} className={selectedBlock === 3 ? 'selectedBlock' : ''}>Block legs</Button>
          <Button onClick={selectAttack(3)} style={buttonStyle} className={selectedAttack === 3 ? 'selectedAttack' : ''}>Attack legs</Button>
          <br></br>
          <Button onClick={makeMove} style={buttonStyle}>Submit</Button>
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
