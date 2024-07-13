// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "fhevm@v0.3.0/lib/TFHE.sol";

contract PixelFight {
    struct Game {
        address player1;
        address player2;
        uint8 player1HP;
        uint8 player2HP;
        euint8 player1MoveAttack; // 0 = None, 1 = Head, 2 = Body, 3 = Legs
        euint8 player1MoveBlock;
        euint8 player2MoveAttack;
        euint8 player2MoveBlock;
        uint8 roundMoves;
        bool singlePlayerGame;
        bool isGameEnded;
        address winner;
    }

    uint256 public gameIdCounter;
    mapping(uint256 => Game) public games;

    event GameCreated(uint256 gameId, address player1);
    event RoundMoves(uint256 gameId, uint8 player1attack, uint8 player1block, uint8 player2attack, uint8 player2block);
    event RoundEnded(uint256 gameId, uint8 player1HP, uint8 player2HP);
    event PlayerJoined(uint256 gameId, address player2);
    event MoveMade(uint256 gameId, address player, euint8 moveAttack, euint8 moveBlock);
    event GameEnded(uint256 gameId, address winner);


    function createGame(bool singlePlayerGame) external returns (uint256) {

        games[gameIdCounter] = Game({
            player1: msg.sender,
            player2: address(0x1),
            player1HP: 5,
            player2HP: 5,
            player1MoveAttack: TFHE.asEuint8(0),
            player1MoveBlock: TFHE.asEuint8(0),
            player2MoveAttack: TFHE.asEuint8(0),
            player2MoveBlock: TFHE.asEuint8(0),
            roundMoves: 0,
            singlePlayerGame: singlePlayerGame,
            isGameEnded: false,
            winner: address(0)
        });

        emit GameCreated(gameIdCounter, msg.sender);
        return gameIdCounter++;
    }

    function joinGame(uint256 _gameId) external {
        require(_gameId <= gameIdCounter, "Game does not exist");
        Game storage game = games[_gameId];

        require(msg.sender != game.player1, "Player cannot join their own game");
        require(game.singlePlayerGame == false, "Game is singleplayer");
        require(game.player2 == address(0), "Game already has two players");

        game.player2 = msg.sender;
        emit PlayerJoined(_gameId, msg.sender);
    }

    function makeMove(uint256 _gameId, bytes calldata encryptedMoveAttack, bytes calldata encryptedMoveBlock) external {
        Game storage game = games[_gameId];

        require(!game.isGameEnded, "Game has already ended");
        euint8 moveAttack = TFHE.asEuint8(encryptedMoveAttack);
        euint8 moveBlock = TFHE.asEuint8(encryptedMoveBlock);

        if (msg.sender == game.player1) {
            game.player1MoveAttack = moveAttack;
            game.player1MoveBlock = moveBlock;

            if (game.singlePlayerGame) {
                // Generate random moves.
                game.player2MoveAttack = TFHE.add(TFHE.rem(TFHE.randEuint8(), 3), 1);
                game.player2MoveBlock = TFHE.add(TFHE.rem(TFHE.randEuint8(), 3), 1);
            }
        } else if (msg.sender == game.player2) {
            game.player2MoveAttack = moveAttack;
            game.player2MoveBlock = moveBlock;
        } else {
            revert("Player not part of this game");
        }

        emit MoveMade(_gameId, msg.sender, moveAttack, moveBlock);
        game.roundMoves++;
        if ((game.singlePlayerGame && game.roundMoves == 1) || (!game.singlePlayerGame && game.roundMoves == 2)) {
            decideRoundWinner(_gameId);
        }
    }

    function decideRoundWinner(uint256 _gameId) internal {
        Game storage game = games[_gameId];

        uint8 player1MoveAttackDecrypted = TFHE.decrypt(game.player1MoveAttack);
        uint8 player1MoveBlockDecrypted = TFHE.decrypt(game.player1MoveBlock);
        uint8 player2MoveAttackDecrypted = TFHE.decrypt(game.player2MoveAttack);
        uint8 player2MoveBlockDecrypted = TFHE.decrypt(game.player2MoveBlock);

        emit RoundMoves(_gameId, player1MoveAttackDecrypted, player1MoveBlockDecrypted, player2MoveAttackDecrypted, player2MoveBlockDecrypted);

        if (player1MoveAttackDecrypted != player2MoveBlockDecrypted) {
            game.player2HP -= 1;
        }
        if (player2MoveAttackDecrypted != player1MoveBlockDecrypted) {
            game.player1HP -= 1;
        }

        game.roundMoves = 0;
        emit RoundEnded(_gameId, game.player1HP, game.player2HP);

        if (game.player1HP == 0 || game.player2HP == 0) {
            decideWinner(_gameId);
        }
    }

    function decideWinner(uint256 _gameId) internal {
        Game storage game = games[_gameId];

        if (game.player1HP == 0 && game.player2HP == 0) {
            game.winner = address(0);
        } else if (game.player1HP == 0) {
            game.winner = game.player2;
        } else {
            game.winner = game.player1;
        }

        game.isGameEnded = true;
        emit GameEnded(_gameId, game.winner);
    }
}
