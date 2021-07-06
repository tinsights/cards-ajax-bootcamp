/*
 * ========================================================
 * ========================================================
 * ========================================================
 * ========================================================
 *
 *                  Card Deck Functions
 *
 * ========================================================
 * ========================================================
 * ========================================================
 */

// get a random index from an array given it's size
const getRandomIndex = function (size) {
  return Math.floor(Math.random() * size);
};

// cards is an array of card objects
const shuffleCards = function (cards) {
  let currentIndex = 0;

  // loop over the entire cards array
  while (currentIndex < cards.length) {
    // select a random position from the deck
    const randomIndex = getRandomIndex(cards.length);

    // get the current card in the loop
    const currentItem = cards[currentIndex];

    // get the random card
    const randomItem = cards[randomIndex];

    // swap the current card and the random card
    cards[currentIndex] = randomItem;
    cards[randomIndex] = currentItem;

    currentIndex += 1;
  }

  // give back the shuffled deck
  return cards;
};

const makeDeck = function () {
  // create the empty deck at the beginning
  const deck = [];

  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];

  let suitIndex = 0;
  while (suitIndex < suits.length) {
    // make a variable of the current suit
    const currentSuit = suits[suitIndex];

    // loop to create all cards in this suit
    // rank 1-13
    let rankCounter = 1;
    while (rankCounter <= 13) {
      let cardName = rankCounter;

      // 1, 11, 12 ,13
      if (cardName === 1) {
        cardName = 'ace';
      } else if (cardName === 11) {
        cardName = 'jack';
      } else if (cardName === 12) {
        cardName = 'queen';
      } else if (cardName === 13) {
        cardName = 'king';
      }

      // make a single card object variable
      const card = {
        name: cardName,
        suit: currentSuit,
        rank: rankCounter,
      };

      // add the card to the deck
      deck.push(card);

      rankCounter += 1;
    }
    suitIndex += 1;
  }

  return deck;
};

/*
 * ========================================================
 * ========================================================
 * ========================================================
 * ========================================================
 *  */

export default function initGamesController(db) {
  const create = async (req, res) => {
    const cardDeck = shuffleCards(makeDeck());
    const player1Card = cardDeck.pop();
    const player2Card = cardDeck.pop();
    let player1Score = 0;
    let player2Score = 0;

    // determine winner
    let result;

    if (player1Card.rank > player2Card.rank) {
      result = 'Player 1 wins!!';
      player1Score += 1;
    } else if (player1Card.rank < player2Card.rank) {
      result = 'Player 2 wins!!';
      player2Score += 1;
    } else {
      result = 'Draw';
    }

    try {
      // find game in progress or create new game
      const [currentGame, created] = await db.Game.findOrCreate({
        where: {
          gameState: { status: 'active' },
        },
        defaults: {
          gameState: {
            status: 'active',
            cardDeck,
            player1Card,
            player2Card,
            result,
            score: {
              player1: player1Score,
              player2: player2Score,
            },
          },
        },
      });

      console.log('game created/ joined', currentGame);

      if (created) {
        // add 2 entries to join table game_users
        console.log('player user id', req.cookies.userId);

        let player2Id;
        if (Number(req.cookies.userId) === 1) {
          player2Id = 2;
        } else if (Number(req.cookies.userId) === 2) {
          player2Id = 1;
        }
        console.log('player 2 id', player2Id);

        const player1 = await db.User.findOne({
          where: {
            id: req.cookies.userId,
          },
        });
        console.log('player 1', player1);

        const player2 = await db.User.findOne({
          where: {
            id: player2Id,
          },
        });
        console.log('player 2', player2);

        const joinTableEntry = await currentGame.addUser(player1);
        console.log('player1 game users table', joinTableEntry);

        const joinTableEntry2 = await currentGame.addUser(player2);
        console.log('player2 game users table', joinTableEntry2);
      }

      res.send({
        id: currentGame.id,
        player1Card: currentGame.gameState.player1Card,
        player2Card: currentGame.gameState.player2Card,
        result: currentGame.gameState.result,
        score: currentGame.gameState.score,
        status: currentGame.gameState.status,
      });
    }
    catch (error) {
      console.log(error);
    }
  };

  // gets another 2 cards from the current card deck
  const deal = async (req, res) => {
    console.log('game id', req.params.id);
    try {
      const currentGame = await db.Game.findByPk(req.params.id);
      console.log('current game', currentGame);

      const player1Card = currentGame.gameState.cardDeck.pop();
      const player2Card = currentGame.gameState.cardDeck.pop();

      let result;

      if (player1Card.rank > player2Card.rank) {
        result = 'Player 1 wins!!';
        currentGame.gameState.score.player1 += 1;
      } else if (player1Card.rank < player2Card.rank) {
        result = 'Player 2 wins!!';
        currentGame.gameState.score.player2 += 1;
      } else {
        result = 'Draw';
      }

      console.log('player 1 score', currentGame.gameState.score.player1);
      console.log('player 2 score', currentGame.gameState.score.player2);

      const updatedGame = await currentGame.update({
        gameState: {
          status: 'active',
          cardDeck: currentGame.gameState.cardDeck,
          player1Card,
          player2Card,
          result,
          score: {
            player1: currentGame.gameState.score.player1,
            player2: currentGame.gameState.score.player2,
          },
        },
      });
      console.log('updated', updatedGame);

      res.send({
        id: updatedGame.id,
        player1Card: updatedGame.gameState.player1Card,
        player2Card: updatedGame.gameState.player2Card,
        result: updatedGame.gameState.result,
        score: updatedGame.gameState.score,
      });
    }
    catch (error) {
      console.log(error);
    }
  };

  // gets the latest entry with the user in it
  const update = async (req, res) => {
    console.log('request body', req.body);

    try { const updatedGame = await db.Game.findOne({
      where: {
        id: req.body.id,
      },
    });
    console.log('updated game', updatedGame);

    res.send({
      id: updatedGame.id,
      player1Card: updatedGame.gameState.player1Card,
      player2Card: updatedGame.gameState.player2Card,
      result: updatedGame.gameState.result,
      score: updatedGame.gameState.score,
    });
    }
    catch (error) {
      console.log(error);
    }
  };

  const logout = async (req, res) => {
    console.log('current game id', req.params.id);
    try {
      const currentGame = await db.Game.findByPk(req.params.id);
      console.log('current game', currentGame);

      const updateStatus = await currentGame.update({
        gameState: {
          status: 'completed',
        },
      });

      console.log('status updated', updateStatus);
      res.send({ status: updateStatus.gameState.status });
    }
    catch (error) {
      console.log(error);
    }
  };
  return {
    create, update, deal, logout,
  };
}
