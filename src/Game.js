import { DECK, shuffleDeck } from "./cards";

// Helper function to check if a set is complete
function isSetComplete(assets) {
  // A set is complete with 3+ unique assets
  return assets.length >= 3;
}

// Helper function to execute action card effects
function executeAction(G, ctx, card, cardIndex, targetPlayer, targetAssetCategory, targetAssetIndex, yourAssetCategory, yourAssetIndex) {
  const player = G.players[ctx.currentPlayer];
  
  // Execute action effect
  switch (card.effect) {
    case "fine":
      // Regulatory Fine: Target pays $5M
      if (targetPlayer !== undefined && G.players[targetPlayer]) {
        G.players[targetPlayer].fines = G.players[targetPlayer].fines + card.amount;
      }
      break;
      
    case "steal-set":
      // Hostile Takeover: Steal a complete Asset Set
      if (targetPlayer !== undefined && G.players[targetPlayer] && targetAssetCategory) {
        const target = G.players[targetPlayer];
        // Steal only the selected category's complete set
        if (target.board[targetAssetCategory].length >= 3) {
          player.board[targetAssetCategory].push(...target.board[targetAssetCategory]);
          target.board[targetAssetCategory] = [];
        }
      }
      break;
      
    case "destroy-greenwashing":
      // External Audit: Destroy Greenwashing cards
      if (targetPlayer !== undefined && G.players[targetPlayer]) {
        const target = G.players[targetPlayer];
        ["E", "S", "G"].forEach(category => {
          const greenwashingCards = target.board[category].filter(c => 
            c.name && c.name.includes("Greenwashing")
          );
          target.board[category] = target.board[category].filter(c => 
            !c.name || !c.name.includes("Greenwashing")
          );
          greenwashingCards.forEach(card => G.discardPile.push(card));
        });
      }
      break;
      
    case "collect-all":   //DISCUSS ON THE CONSEQUENCE OF HAVING NO MONEY TO GIVE(imp)(either go negative or pay in properties)
      // Sustainability Report: Collect $2M from every player
      Object.keys(G.players).forEach(playerId => {
        if (playerId !== ctx.currentPlayer) {
          const amount = Math.min(card.amount, G.players[playerId].bank);
          G.players[playerId].bank -= amount;
          player.bank += amount;
        }
      });
      break;
      
    case "swap-asset":
      // Stakeholder Revolt: Force player to swap an asset with you
      if (targetPlayer !== undefined && G.players[targetPlayer] && 
          targetAssetCategory && targetAssetIndex !== undefined &&
          yourAssetCategory && yourAssetIndex !== undefined) {
        const target = G.players[targetPlayer];
        const theirAsset = target.board[targetAssetCategory].splice(targetAssetIndex, 1)[0];
        const yourAsset = player.board[yourAssetCategory].splice(yourAssetIndex, 1)[0];
        
        if (theirAsset && yourAsset) {
          player.board[targetAssetCategory].push(theirAsset);
          target.board[yourAssetCategory].push(yourAsset);
        }
      }
      break;
      
    case "block":
      // Compliance Check: Block action (reactive, implemented differently)
      break;
      
    case "block-e-attack":
      // Carbon Credit: Block attack on E Asset (reactive)
      break;
      
    case "discard-asset":
      // Supply Chain Disrupt: Force player to discard an Asset
      if (targetPlayer !== undefined && G.players[targetPlayer] && targetAssetCategory && targetAssetIndex !== undefined) {
        const target = G.players[targetPlayer];
        const discarded = target.board[targetAssetCategory].splice(targetAssetIndex, 1)[0];
        if (discarded) {
          G.discardPile.push(discarded);
        }
      }
      break;
      
    case "add-house":
      // Tech Upgrade: Add house to asset set (increases value)
      break;
      
    case "add-hotel":
      // ISO Certification: Add hotel to asset set (max value)
      break;
      
    case "draw-2":
      // Grant Funding: Draw 2 extra cards
      for (let i = 0; i < 2; i++) {
        if (G.deck.length > 0) {
          player.hand.push(G.deck.pop());
        } else if (G.discardPile.length > 0) {
          G.deck = shuffleDeck(G.discardPile);
          G.discardPile = [];
          if (G.deck.length > 0) {
            player.hand.push(G.deck.pop());
          }
        }
      }
      break;
      
    case "pass-left":
      // Policy Change: Everyone passes hand to the left
      // Remove the card from current player's hand BEFORE swapping
      const cardIndexInHand = player.hand.findIndex(c => c.id === card.id);
      if (cardIndexInHand !== -1) {
        player.hand.splice(cardIndexInHand, 1);
      }
      
      const hands = Object.keys(G.players).map(id => G.players[id].hand);
      Object.keys(G.players).forEach((id, index) => {
        const nextIndex = (index + 1) % Object.keys(G.players).length;
        const nextId = Object.keys(G.players)[nextIndex];
        G.players[nextId].hand = hands[index];
      });
      
      // Skip the normal card removal at the end since we already did it
      G.discardPile.push(card);
      player.movesPlayed += 1;
      return; // Exit early to skip normal card removal
      
    default:
      break;
  }
  
  // Remove card from hand and put in discard (if not already removed by blocking)
  // Find the card by ID in case the index has changed
  const cardInHandIndex = player.hand.findIndex(c => c.id === card.id);
  if (cardInHandIndex !== -1) {
    player.hand.splice(cardInHandIndex, 1);
    G.discardPile.push(card);
  }
  player.movesPlayed += 1;
}

export const ImpactGame = {
  setup: () => {
    const shuffledDeck = shuffleDeck(DECK);
    
    return {
      deck: shuffledDeck,
      discardPile: [],
      pendingAttacks: [], // Queue of attacks waiting for block responses
      players: {
        "0": {
          bank: 0,
          board: { E: [], S: [], G: [] },
          hand: [],
          fines: 0,
          movesPlayed: 0,
        },
        "1": {
          bank: 0,
          board: { E: [], S: [], G: [] },
          hand: [],
          fines: 0,
          movesPlayed: 0,
        },
      },
    };
  },

  turn: {
    onBegin: ({ G, ctx }) => {
      const player = G.players[ctx.currentPlayer];
      
      // Draw 5 if hand is empty, otherwise draw 2
      const cardsToDraw = player.hand.length === 0 ? 5 : 2;
      
      for (let i = 0; i < cardsToDraw; i++) {
        if (G.deck.length > 0) {
          const card = G.deck.pop();
          player.hand.push(card);
        } else if (G.discardPile.length > 0) {
          // Reshuffle discard pile if deck is empty
          G.deck = shuffleDeck(G.discardPile);
          G.discardPile = [];
          if (G.deck.length > 0) {
            const card = G.deck.pop();
            player.hand.push(card);
          }
        }
      }
      
      // Reset moves counter for the turn
      player.movesPlayed = 0;
    },
    
    onEnd: ({ G, ctx }) => {
      // Turn end - no automatic discard
    },
  },

  moves: {
    playAsset: ({ G, ctx }, cardIndex, targetCategory) => {
      const player = G.players[ctx.currentPlayer];
      
      // Check if player has moves left
      if (player.movesPlayed >= 3) {
        return; // Invalid move
      }
      
      const card = player.hand[cardIndex];
      if (!card || card.type !== "Asset") {
        return; // Invalid card
      }
      
      // Determine which board to place on
      let boardCategory = targetCategory;
      if (!boardCategory) {
        // If not specified, use card's category (unless Wild)
        if (card.category === "Wild") {
          return; // Wild cards need explicit category
        }
        boardCategory = card.category;
      }
      
      // Place card on appropriate board
      if (boardCategory === "Environment" || boardCategory === "E") {
        player.board.E.push(card);
      } else if (boardCategory === "Social" || boardCategory === "S") {
        player.board.S.push(card);
      } else if (boardCategory === "Governance" || boardCategory === "G") {
        player.board.G.push(card);
      } else {
        return; // Invalid category
      }
      
      // Remove card from hand
      player.hand.splice(cardIndex, 1);
      player.movesPlayed += 1;
    },
    
    playCapital: ({ G, ctx }, cardIndex) => {
      const player = G.players[ctx.currentPlayer];
      
      // Check if player has moves left
      if (player.movesPlayed >= 3) {
        return; // Invalid move
      }
      
      const card = player.hand[cardIndex];
      if (!card || card.type !== "Capital") {
        return; // Invalid card
      }
      
      // Add capital value to bank
      player.bank += card.value;
      
      // Remove card from hand but don't discard it - it stays as money
      player.hand.splice(cardIndex, 1);
      player.movesPlayed += 1;
    },
    
    playAction: ({ G, ctx }, cardIndex, targetPlayer, targetAssetCategory, targetAssetIndex, yourAssetCategory, yourAssetIndex) => {
      const player = G.players[ctx.currentPlayer];
      
      // Check if player has moves left
      if (player.movesPlayed >= 3) {
        return; // Invalid move
      }
      
      const card = player.hand[cardIndex];
      if (!card || card.type !== "Action") {
        return; // Invalid card
      }
      
      // Check if action is blockable
      const blockableActions = ["fine", "steal-set", "destroy-greenwashing", "swap-asset", "discard-asset"];
      
      if (blockableActions.includes(card.effect) && targetPlayer !== undefined) {
        // Remove card from hand immediately and count the move
        player.hand.splice(cardIndex, 1);
        player.movesPlayed += 1;
        
        // Queue attack for block opportunity at turn end
        G.pendingAttacks.push({
          attackerId: ctx.currentPlayer,
          targetId: targetPlayer,
          card: card,
          effect: card.effect,
          targetAssetCategory: targetAssetCategory,
          targetAssetIndex: targetAssetIndex,
          yourAssetCategory: yourAssetCategory,
          yourAssetIndex: yourAssetIndex,
        });
        return; // Don't execute yet - defender can block
      }
      
      // Non-blockable actions execute immediately
      executeAction(G, ctx, card, cardIndex, targetPlayer, targetAssetCategory, targetAssetIndex, yourAssetCategory, yourAssetIndex);
    },
    
    blockAttack: ({ G, ctx }, attackIndex, blockCardIndex) => {
      if (!G.pendingAttacks[attackIndex]) return;
      
      const attack = G.pendingAttacks[attackIndex];
      const defender = G.players[attack.targetId];
      const blockCard = defender.hand[blockCardIndex];
      
      if (!blockCard || blockCard.type !== "Action") return;
      
      // Verify it's a valid block card
      let isValidBlock = false;
      
      if (blockCard.effect === "block") {
        isValidBlock = true;
      } else if (blockCard.effect === "block-e-attack") {
        // Can block E-asset targeting attacks
        if (attack.targetAssetCategory === "E") {
          isValidBlock = true;
        }
        // Can block steal-set ONLY if stealing E-category set
        else if (attack.effect === "steal-set" && attack.targetAssetCategory === "E") {
          isValidBlock = true;
        }
        // Can block destroy-greenwashing only if defender has greenwashing in E
        else if (attack.effect === "destroy-greenwashing") {
          const hasEGreenwashing = defender.board.E.some(c => c.name && c.name.includes("Greenwashing"));
          isValidBlock = hasEGreenwashing;
        }
      }
      
      if (!isValidBlock) return;
      
      // Block successful - discard both cards
      G.discardPile.push(attack.card);
      const defenseCard = defender.hand.splice(blockCardIndex, 1)[0];
      if (defenseCard) G.discardPile.push(defenseCard);
      
      // Special case: block-e-attack only protects E category for destroy-greenwashing
      if (blockCard.effect === "block-e-attack" && attack.effect === "destroy-greenwashing") {
        // Execute attack but skip E category
        const target = defender;
        ["S", "G"].forEach(category => {
          const greenwashingCards = target.board[category].filter(c => 
            c.name && c.name.includes("Greenwashing")
          );
          target.board[category] = target.board[category].filter(c => 
            !c.name || !c.name.includes("Greenwashing")
          );
          greenwashingCards.forEach(card => G.discardPile.push(card));
        });
      }
      
      // Mark attack as blocked
      G.pendingAttacks[attackIndex].blocked = true;
    },
    
    declineBlock: ({ G, ctx }, attackIndex) => {
      if (!G.pendingAttacks[attackIndex]) return;
      
      // Execute the attack
      const attack = G.pendingAttacks[attackIndex];
      const { attackerId, targetId, card, targetAssetCategory, targetAssetIndex, yourAssetCategory, yourAssetIndex } = attack;
      
      // Execute without removing card (already removed when played)
      const player = G.players[attackerId];
      
      switch (card.effect) {
        case "fine":
          if (targetId !== undefined && G.players[targetId]) {
            G.players[targetId].fines += card.amount;
          }
          break;
          
        case "steal-set":
          if (targetId !== undefined && G.players[targetId] && targetAssetCategory) {
            const target = G.players[targetId];
            // Steal only the selected category's complete set
            if (target.board[targetAssetCategory].length >= 3) {
              player.board[targetAssetCategory].push(...target.board[targetAssetCategory]);
              target.board[targetAssetCategory] = [];
            }
          }
          break;
          
        case "destroy-greenwashing":
          if (targetId !== undefined && G.players[targetId]) {
            const target = G.players[targetId];
            ["E", "S", "G"].forEach(category => {
              const greenwashingCards = target.board[category].filter(c => 
                c.name && c.name.includes("Greenwashing")
              );
              target.board[category] = target.board[category].filter(c => 
                !c.name || !c.name.includes("Greenwashing")
              );
              greenwashingCards.forEach(card => G.discardPile.push(card));
            });
          }
          break;
          
        case "swap-asset":
          if (targetId !== undefined && G.players[targetId] && 
              targetAssetCategory && targetAssetIndex !== undefined &&
              yourAssetCategory && yourAssetIndex !== undefined) {
            const target = G.players[targetId];
            const theirAsset = target.board[targetAssetCategory].splice(targetAssetIndex, 1)[0];
            const yourAsset = player.board[yourAssetCategory].splice(yourAssetIndex, 1)[0];
            
            if (theirAsset && yourAsset) {
              player.board[targetAssetCategory].push(theirAsset);
              target.board[yourAssetCategory].push(yourAsset);
            }
          }
          break;
          
        case "discard-asset":
          if (targetId !== undefined && G.players[targetId] && targetAssetCategory && targetAssetIndex !== undefined) {
            const target = G.players[targetId];
            const discarded = target.board[targetAssetCategory].splice(targetAssetIndex, 1)[0];
            if (discarded) {
              G.discardPile.push(discarded);
            }
          }
          break;
      }
      
      // Discard attack card
      G.discardPile.push(card);
      
      // Mark as processed
      G.pendingAttacks[attackIndex].processed = true;
    },
    
    processAllAttacks: ({ G, ctx }) => {
      // Called after all blocks/declines to clear processed attacks
      G.pendingAttacks = G.pendingAttacks.filter(attack => !attack.blocked && !attack.processed);
    },
    
    endTurn: ({ G, ctx, events }) => {
      events.endTurn();
    },
    
    payFine: ({ G, ctx }, amount) => {
      const player = G.players[ctx.currentPlayer];
      
      // Pay fine from bank
      if (player.bank >= amount && player.fines >= amount) {
        player.bank -= amount;
        player.fines -= amount;
      }
    },
    
    discardCard: ({ G, ctx }, cardIndex) => {
      const player = G.players[ctx.currentPlayer];
      
      if (cardIndex >= 0 && cardIndex < player.hand.length) {
        const discarded = player.hand.splice(cardIndex, 1)[0];
        G.discardPile.push(discarded);
      }
    },
  },

  endIf: ({ G, ctx }) => {
    const player = G.players[ctx.currentPlayer];
    
    // Check win condition: 1 complete set in E, S, and G + no fines
    const hasCompleteE = isSetComplete(player.board.E);
    const hasCompleteS = isSetComplete(player.board.S);
    const hasCompleteG = isSetComplete(player.board.G);
    const noFines = player.fines === 0;
    
    if (hasCompleteE && hasCompleteS && hasCompleteG && noFines) {
      return { winner: ctx.currentPlayer };
    }
  },
};