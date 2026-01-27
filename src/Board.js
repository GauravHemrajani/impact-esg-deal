import { useState, useEffect } from "react";
import "./Board.css";

export function Board({ G, ctx, moves, playerID, onGameOver, matchID, playerName }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [targetCategory, setTargetCategory] = useState(null);
  const [targetPlayer, setTargetPlayer] = useState(null);
  const [selectingAsset, setSelectingAsset] = useState(false);
  const [selectedOpponentAsset, setSelectedOpponentAsset] = useState(null);
  const [selectingYourAsset, setSelectingYourAsset] = useState(false);
  const [selectedBlockCard, setSelectedBlockCard] = useState(null);
  const [currentAttackIndex, setCurrentAttackIndex] = useState(0);
  const [selectingSet, setSelectingSet] = useState(false);
  const [availableSets, setAvailableSets] = useState([]);
  const [discarding, setDiscarding] = useState(false);
  const [showBlockError, setShowBlockError] = useState(false);
  
  // Check if game is over - freeze all interactions
  const isGameOver = !!ctx.gameover;
  
  // Check for game over
  useEffect(() => {
    if (ctx.gameover && onGameOver) {
      // Delay to let players see the final state
      setTimeout(() => {
        onGameOver(ctx.gameover.winner);
      }, 1500);
    }
  }, [ctx.gameover, onGameOver]);
  
  // Auto-exit discard mode when hand reaches 7 or fewer cards
  useEffect(() => {
    if (discarding && G.players[playerID]?.hand?.length <= 7) {
      setDiscarding(false);
    }
  }, [G.players[playerID]?.hand?.length, discarding, playerID]);
  
  if (!ctx) {
    return <div>Loading...</div>;
  }
  
  // Use playerID to show this client's own cards and board
  const player = G.players[playerID];
  const opponent = G.players[playerID === "0" ? "1" : "0"];
  
  // Check if there are pending attacks targeting this player
  const myPendingAttacks = G.pendingAttacks.filter(attack => 
    attack.targetId === playerID && !attack.blocked && !attack.processed
  );
  const hasAttacksToResolve = myPendingAttacks.length > 0;
  
  // Get available block cards for current attack
  const getAvailableBlockCards = () => {
    if (!hasAttacksToResolve || currentAttackIndex >= myPendingAttacks.length) return [];
    
    const attack = myPendingAttacks[currentAttackIndex];
    const blockCards = [];
    player.hand.forEach((card, idx) => {
      if (card.effect === "block") {
        blockCards.push({ card, index: idx, canBlock: true });
      } else if (card.effect === "block-e-attack") {
        let canBlock = false;
        
        // Can block if attack targets E-asset category
        if (attack.targetAssetCategory === "E") {
          canBlock = true;
        }
        // Can block steal-set ONLY if stealing E-category set
        else if (attack.effect === "steal-set" && attack.targetAssetCategory === "E") {
          canBlock = true;
        }
        // Can block destroy-greenwashing ONLY if target has greenwashing in E category
        else if (attack.effect === "destroy-greenwashing") {
          const hasEGreenwashing = player.board.E.some(c => c.name && c.name.includes("Greenwashing"));
          canBlock = hasEGreenwashing;
        }
        
        if (canBlock) {
          blockCards.push({ card, index: idx, canBlock: true });
        }
      }
    });
    return blockCards;
  };

  const handlePlayCard = (cardIndex) => {
    // Don't allow any actions when game is over
    if (isGameOver) {
      return;
    }
    
    // Don't allow playing cards when it's not your turn
    if (ctx.currentPlayer !== playerID) {
      return;
    }
    
    const card = player.hand[cardIndex];
    
    // Block cards can only be used reactively when there's an incoming attack
    if (card.type === "Action" && (card.effect === "block" || card.effect === "block-e-attack")) {
      setShowBlockError(true);
      return;
    }
    
    if (card.type === "Asset") {
      if (card.category === "Wild") {
        // Need to select category for Wild cards
        setSelectedCard(cardIndex);
        return;
      }
      moves.playAsset(cardIndex);
    } else if (card.type === "Capital") {
      moves.playCapital(cardIndex);
    } else if (card.type === "Action") {
      // Check if action needs a target
      const needsTarget = ["fine", "steal-set", "destroy-greenwashing"].includes(card.effect);
      const needsAssetTarget = ["swap-asset", "discard-asset"].includes(card.effect);
      
      if (needsAssetTarget) {
        setSelectedCard(cardIndex);
        setSelectingAsset(true);
        return; // Wait for player + asset selection
      } else if (needsTarget) {
        setSelectedCard(cardIndex);
        return; // Wait for target selection
      }
      
      // Play action without target
      moves.playAction(cardIndex);
    }
    
    setSelectedCard(null);
    setTargetCategory(null);
    setTargetPlayer(null);
    setSelectingAsset(false);
    setSelectedOpponentAsset(null);
    setSelectingYourAsset(false);
  };

  const handleTargetSelection = (target) => {
    if (selectedCard !== null) {
      const card = player.hand[selectedCard];
      if (card.type === "Action") {
        if (selectingAsset) {
          // Need to select asset next
          setTargetPlayer(target);
        } else if (card.effect === "steal-set") {
          // Check if target has any complete sets
          const targetPlayer = G.players[target];
          const completeSets = [];
          ["E", "S", "G"].forEach(category => {
            if (targetPlayer.board[category].length >= 3) {
              completeSets.push(category);
            }
          });
          
          if (completeSets.length === 0) {
            alert("Can't play now! Target has no complete sets (3+ assets in a category).");
            setSelectedCard(null);
            return;
          }
          
          // Show set selection UI
          setTargetPlayer(target);
          setAvailableSets(completeSets);
          setSelectingSet(true);
        } else if (card.effect === "destroy-greenwashing") {
          // Check if target has any greenwashing assets
          const targetPlayer = G.players[target];
          const hasGreenwashing = ["E", "S", "G"].some(category => 
            targetPlayer.board[category].some(c => c.name && c.name.includes("Greenwashing"))
          );
          
          if (!hasGreenwashing) {
            alert("Can't play now! Target has no Greenwashing assets.");
            setSelectedCard(null);
            setTargetPlayer(null);
            return;
          }
          
          moves.playAction(selectedCard, target);
          setSelectedCard(null);
          setTargetPlayer(null);
        } else {
          moves.playAction(selectedCard, target);
          setSelectedCard(null);
          setTargetPlayer(null);
        }
      }
    }
  };

  const handleOpponentAssetSelection = (category, assetIndex) => {
    if (selectedCard !== null && targetPlayer !== null) {
      const card = player.hand[selectedCard];
      
      if (card.effect === "swap-asset") {
        // For swap, need to select your asset too
        setSelectedOpponentAsset({ category, assetIndex });
        setSelectingAsset(false);
        setSelectingYourAsset(true);
      } else {
        // For discard, just execute immediately
        moves.playAction(selectedCard, targetPlayer, category, assetIndex);
        setSelectedCard(null);
        setTargetPlayer(null);
        setSelectingAsset(false);
      }
    }
  };

  const handleYourAssetSelection = (category, assetIndex) => {
    if (selectedCard !== null && targetPlayer !== null && selectedOpponentAsset !== null) {
      // Execute the swap with both assets
      moves.playAction(
        selectedCard, 
        targetPlayer, 
        selectedOpponentAsset.category, 
        selectedOpponentAsset.assetIndex,
        category,
        assetIndex
      );
      setSelectedCard(null);
      setTargetPlayer(null);
      setSelectingAsset(false);
      setSelectedOpponentAsset(null);
      setSelectingYourAsset(false);
    }
  };

  const handleSetSelection = (category) => {
    if (selectedCard !== null && targetPlayer !== null) {
      // Play steal-set with selected category
      moves.playAction(selectedCard, targetPlayer, category);
      setSelectedCard(null);
      setTargetPlayer(null);
      setSelectingSet(false);
      setAvailableSets([]);
    }
  };

  const handleCancelSetSelection = () => {
    // Cancel without playing the card
    setSelectedCard(null);
    setTargetPlayer(null);
    setSelectingSet(false);
    setAvailableSets([]);
  };

  const handleWildCardPlacement = (category) => {
    if (selectedCard !== null) {
      moves.playAsset(selectedCard, category);
      setSelectedCard(null);
      setTargetCategory(null);
    }
  };

  // Check if game is won
  if (ctx.gameover) {
    return (
      <div className="win-screen">
        <h1 className="win-title">🎉 Game Over! 🎉</h1>
        <h2 className="win-subtitle">
          Player {ctx.gameover.winner} Wins!
        </h2>
        <div className="win-checklist">
          <p>✅ Complete Environment Set</p>
          <p>✅ Complete Social Set</p>
          <p>✅ Complete Governance Set</p>
          <p>✅ No Outstanding Fines</p>
        </div>
        <div style={{ marginTop: "40px", fontSize: "28px", fontWeight: "bold" }}>
          Balanced ESG Framework Achieved!
        </div>
      </div>
    );
  }

  const isEComplete = player.board.E.length >= 3;
  const isSComplete = player.board.S.length >= 3;
  const isGComplete = player.board.G.length >= 3;

  const opponentIsEComplete = opponent.board.E.length >= 3;
  const opponentIsSComplete = opponent.board.S.length >= 3;
  const opponentIsGComplete = opponent.board.G.length >= 3;

  return (
    <div className="game-container">
      {/* === OPPONENT AREA (TOP) === */}
      <div className="opponent-area">
        {/* Opponent's Bank & Fines Display */}
        <div className="opponent-hand-display" style={{ gap: "20px", marginBottom: "20px" }}>
          <div style={{ 
            padding: "20px 40px", 
            background: "linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)", 
            borderRadius: "10px",
            border: "2px solid #4caf50",
            fontSize: "18px",
            fontWeight: "bold",
            minWidth: "150px",
            textAlign: "center"
          }}>
            💰 Bank<br/>
            <span style={{ fontSize: "24px" }}>${opponent.bank}M</span>
          </div>
          <div style={{ 
            padding: "20px 40px", 
            background: opponent.fines > 0 ? "linear-gradient(135deg, #d32f2f 0%, #c62828 100%)" : "linear-gradient(135deg, #555 0%, #444 100%)", 
            borderRadius: "10px",
            border: opponent.fines > 0 ? "2px solid #f44336" : "2px solid #666",
            fontSize: "18px",
            fontWeight: "bold",
            minWidth: "150px",
            textAlign: "center"
          }}>
            ⚠️ Fines<br/>
            <span style={{ fontSize: "24px" }}>${opponent.fines}M</span>
          </div>
          <div style={{ 
            padding: "20px 40px", 
            background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)", 
            borderRadius: "10px",
            border: "2px solid #2196f3",
            fontSize: "18px",
            fontWeight: "bold",
            minWidth: "150px",
            textAlign: "center"
          }}>
            🃏 Hand<br/>
            <span style={{ fontSize: "24px" }}>{opponent.hand.length} cards</span>
          </div>
        </div>

        {/* Opponent's Board */}
        <div className="opponent-board-areas">
          {/* Environment */}
          <div className={`board-area board-area-e ${opponentIsEComplete ? 'board-complete' : ''}`}>
            <div className="board-area-header">🌍 Environment ({opponent.board.E.length}/3) {opponentIsEComplete && "✅"}</div>
            {opponent.board.E.length > 0 ? (
              opponent.board.E.map((card, idx) => (
                <div key={idx} className="asset-card-mini">
                  <strong>{card.name}</strong><br/>
                  ${card.value}M
                </div>
              ))
            ) : (
              <div className="empty-board-message">No assets</div>
            )}
          </div>

          {/* Social */}
          <div className={`board-area board-area-s ${opponentIsSComplete ? 'board-complete' : ''}`}>
            <div className="board-area-header">👥 Social ({opponent.board.S.length}/3) {opponentIsSComplete && "✅"}</div>
            {opponent.board.S.length > 0 ? (
              opponent.board.S.map((card, idx) => (
                <div key={idx} className="asset-card-mini">
                  <strong>{card.name}</strong><br/>
                  ${card.value}M
                </div>
              ))
            ) : (
              <div className="empty-board-message">No assets</div>
            )}
          </div>

          {/* Governance */}
          <div className={`board-area board-area-g ${opponentIsGComplete ? 'board-complete' : ''}`}>
            <div className="board-area-header">⚖️ Governance ({opponent.board.G.length}/3) {opponentIsGComplete && "✅"}</div>
            {opponent.board.G.length > 0 ? (
              opponent.board.G.map((card, idx) => (
                <div key={idx} className="asset-card-mini">
                  <strong>{card.name}</strong><br/>
                  ${card.value}M
                </div>
              ))
            ) : (
              <div className="empty-board-message">No assets</div>
            )}
          </div>
        </div>
      </div>

      {/* === MIDDLE AREA (DECK/DISCARD) === */}
      <div className="middle-area">
        <div className="deck-pile">
          <div className="pile-visual deck-visual">🎴</div>
          <div className="pile-count">Deck: {G.deck.length}</div>
        </div>

        <div className="turn-info">
          <div style={{ fontSize: '24px', marginBottom: '5px' }}>Turn {ctx.turn}</div>
          <div style={{ fontSize: '16px', opacity: 0.9 }}>Player {ctx.currentPlayer}'s Turn</div>
        </div>

        <div className="discard-pile">
          <div className="pile-visual discard-visual">
            {G.discardPile.length > 0 ? '🗑️' : '∅'}
          </div>
          <div className="pile-count">Discard: {G.discardPile.length}</div>
        </div>
      </div>

      {/* === PLAYER AREA (BOTTOM) === */}
      <div className="player-area">
        {/* Player Info Bar */}
        <div className="player-info">
          <div className="player-stats" style={{ alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>💰 Bank: ${player.bank}M</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚠️ Fines: ${player.fines}M</span>
              {player.fines > 0 && player.bank >= player.fines && (
                <button 
                  onClick={() => moves.payFine(player.fines)}
                  className="pay-fine-button"
                  style={{ margin: 0 }}
                >
                  Pay All Fines
                </button>
              )}
            </div>
          </div>
          <div className="moves-counter">
            Moves: {player.movesPlayed} / 3
          </div>
        </div>

        {/* Player's Board - Centered like opponent */}
        <div className="opponent-board-areas">
          {/* Environment */}
          <div className={`board-area board-area-e player-board-area ${isEComplete ? 'board-complete' : ''}`}>
            <div className="board-area-header">🌍 Environment ({player.board.E.length}/3) {isEComplete && "✅"}</div>
            {player.board.E.length > 0 ? (
              player.board.E.map((card, idx) => (
                <div key={idx} className="asset-card-mini">
                  <strong>{card.name}</strong><br/>
                  ${card.value}M
                </div>
              ))
            ) : (
              <div className="empty-board-message">No assets yet</div>
            )}
          </div>

          {/* Social */}
          <div className={`board-area board-area-s player-board-area ${isSComplete ? 'board-complete' : ''}`}>
            <div className="board-area-header">👥 Social ({player.board.S.length}/3) {isSComplete && "✅"}</div>
            {player.board.S.length > 0 ? (
              player.board.S.map((card, idx) => (
                <div key={idx} className="asset-card-mini">
                  <strong>{card.name}</strong><br/>
                  ${card.value}M
                </div>
              ))
            ) : (
              <div className="empty-board-message">No assets yet</div>
            )}
          </div>

          {/* Governance */}
          <div className={`board-area board-area-g player-board-area ${isGComplete ? 'board-complete' : ''}`}>
            <div className="board-area-header">⚖️ Governance ({player.board.G.length}/3) {isGComplete && "✅"}</div>
            {player.board.G.length > 0 ? (
              player.board.G.map((card, idx) => (
                <div key={idx} className="asset-card-mini">
                  <strong>{card.name}</strong><br/>
                  ${card.value}M
                </div>
              ))
            ) : (
              <div className="empty-board-message">No assets yet</div>
            )}
          </div>
        </div>

        {/* Player's Hand */}
        <div className="player-hand">
          <h3 className="hand-header">Your Hand ({player.hand.length} cards - Max 7)</h3>
          <div className="hand-cards">
            {player.hand.map((card, index) => {
              const isDisabled = !discarding && player.movesPlayed >= 3;
              const isSelected = selectedCard === index;
              const isNotYourTurn = ctx.currentPlayer !== playerID;
              
              // Determine card CSS class
              let cardClass = 'card';
              if (card.type === 'Asset') {
                if (card.category === 'Wild') cardClass += ' asset-wild';
                else if (card.category.includes('Environment') || card.category === 'E') cardClass += ' asset-e';
                else if (card.category.includes('Social') || card.category === 'S') cardClass += ' asset-s';
                else if (card.category.includes('Governance') || card.category === 'G') cardClass += ' asset-g';
              } else if (card.type === 'Action') {
                cardClass += ' action';
              } else if (card.type === 'Capital') {
                cardClass += ' capital';
              }
              
              if (isSelected) cardClass += ' selected';
              if (isDisabled || isNotYourTurn) cardClass += ' disabled';

              return (
                <div key={`${card.id}-${index}`} className={cardClass}>
                  <div className="card-name">{card.name}</div>
                  <div className="card-type">
                    {card.type}
                    {card.category && card.category !== "Neutral" && ` - ${card.category}`}
                  </div>
                  {card.value !== undefined && (
                    <div className="card-value">${card.value}M</div>
                  )}
                  {card.effect && (
                    <div className="card-effect">{card.effect}</div>
                  )}
                  
                  <button
                    onClick={() => (isGameOver || discarding) ? (isGameOver ? null : moves.discardCard(index)) : handlePlayCard(index)}
                    disabled={isDisabled || isGameOver || isNotYourTurn}
                    className={`card-button ${discarding ? 'discard' : 'play'}`}
                  >
                    {discarding ? "Discard" : "Play"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* End Turn / Discard Warning */}
        <div style={{ textAlign: 'center' }}>
          {/* Show whose turn it is */}
          <div style={{ 
            marginBottom: '10px', 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: isGameOver ? '#ff5722' : (ctx.currentPlayer === playerID ? '#4caf50' : '#ff9800')
          }}>
            {isGameOver ? "🎮 Game Over!" : (ctx.currentPlayer === playerID ? "🎯 Your Turn!" : "⏳ Waiting for opponent...")}
          </div>
          
          {ctx.currentPlayer !== playerID || isGameOver ? (
            <button 
              disabled
              className="end-turn-button"
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            >
              {isGameOver ? "Game Over" : "Opponent's Turn"}
            </button>
          ) : discarding && player.hand.length > 7 ? (
            <div className="discard-warning">
              <h3>⚠️ Hand Limit Exceeded!</h3>
              <p>You have {player.hand.length} cards. You must discard down to 7 cards before ending your turn.</p>
              <p style={{ fontWeight: 'bold' }}>Cards to discard: {player.hand.length - 7}</p>
            </div>
          ) : (
            <button 
              onClick={() => {
                if (player.hand.length > 7) {
                  setDiscarding(true);
                } else {
                  setDiscarding(false);
                  moves.endTurn();
                }
              }}
              className="end-turn-button"
            >
              End Turn
            </button>
          )}
        </div>
      </div>
      
      {/* Block Attack Popup - shows attacks at start of turn (only when it's your turn) */}
      {!isGameOver && ctx.currentPlayer === playerID && hasAttacksToResolve && currentAttackIndex < myPendingAttacks.length && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header" style={{ color: "#f44336" }}>⚠️ Incoming Attack! ({currentAttackIndex + 1}/{myPendingAttacks.length})</h2>
            <div style={{ margin: "20px 0", padding: "15px", backgroundColor: "rgba(244, 67, 54, 0.2)", borderRadius: "8px", border: "1px solid #f44336" }}>
              <p style={{ margin: "5px 0", color: "#fff" }}>
                <strong>Attacker:</strong> Player {myPendingAttacks[currentAttackIndex].attackerId}
              </p>
              <p style={{ margin: "5px 0", color: "#fff" }}>
                <strong>Attack Card:</strong> {myPendingAttacks[currentAttackIndex].card.name}
              </p>
              <p style={{ margin: "5px 0", fontSize: "14px", color: "#bbb" }}>
                {myPendingAttacks[currentAttackIndex].card.lesson || ""}
              </p>
            </div>
            
            {getAvailableBlockCards().length > 0 ? (
              <>
                <h3>Your Block Cards:</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  {getAvailableBlockCards().map(({ card, index }) => (
                    <div
                      key={index}
                      onClick={() => setSelectedBlockCard(index)}
                      style={{
                        padding: "15px",
                        border: selectedBlockCard === index ? "3px solid #4caf50" : "2px solid #ccc",
                        borderRadius: "8px",
                        cursor: "pointer",
                        backgroundColor: selectedBlockCard === index ? "#e8f5e9" : "white",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ fontWeight: "bold", marginBottom: "5px", color: "#000" }}>{card.name}</div>
                      <div style={{ fontSize: "13px", color: "#333" }}>{card.lesson || ""}</div>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  <button
                    onClick={() => {
                      if (selectedBlockCard !== null) {
                        // Find the actual attack index in G.pendingAttacks
                        const globalAttackIndex = G.pendingAttacks.indexOf(myPendingAttacks[currentAttackIndex]);
                        moves.blockAttack(globalAttackIndex, selectedBlockCard);
                        setSelectedBlockCard(null);
                        // Don't increment - filtered array will automatically show next attack at index 0
                        // After blocking, the current attack is removed from myPendingAttacks
                        if (myPendingAttacks.length <= 1) {
                          // This was the last attack
                          moves.processAllAttacks();
                          setCurrentAttackIndex(0);
                        }
                      }
                    }}
                    disabled={selectedBlockCard === null}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: selectedBlockCard !== null ? "#4caf50" : "#ccc",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: selectedBlockCard !== null ? "pointer" : "not-allowed",
                      fontSize: "16px",
                      fontWeight: "bold"
                    }}
                  >
                    🛡️ Block with Selected Card
                  </button>
                  
                  <button
                    onClick={() => {
                      const globalAttackIndex = G.pendingAttacks.indexOf(myPendingAttacks[currentAttackIndex]);
                      moves.declineBlock(globalAttackIndex);
                      setSelectedBlockCard(null);
                      // Don't increment - filtered array will automatically show next attack at index 0
                      if (myPendingAttacks.length <= 1) {
                        // This was the last attack
                        moves.processAllAttacks();
                        setCurrentAttackIndex(0);
                      }
                    }}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "bold"
                    }}
                  >
                    ❌ Don't Block
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ textAlign: "center", color: "#666", margin: "20px 0" }}>
                  You have no block cards available for this attack.
                </p>
                <button
                  onClick={() => {
                    const globalAttackIndex = G.pendingAttacks.indexOf(myPendingAttacks[currentAttackIndex]);
                    moves.declineBlock(globalAttackIndex);
                    // Don't increment - filtered array will automatically show next attack at index 0
                    if (myPendingAttacks.length <= 1) {
                      // This was the last attack
                      moves.processAllAttacks();
                      setCurrentAttackIndex(0);
                    }
                  }}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                    display: "block",
                    margin: "0 auto"
                  }}
                >
                  Accept Attack
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Block Card Error Popup */}
      {showBlockError && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "400px", textAlign: "center" }}>
            <h2 className="modal-header" style={{ color: "#ff9800" }}>🛡️ Can't Play Block Card</h2>
            <p style={{ fontSize: "16px", color: "#bbb", margin: "20px 0" }}>
              Block cards can only be used to defend against incoming attacks. Wait until an opponent attacks you, then you'll have the option to block.
            </p>
            <button
              onClick={() => setShowBlockError(false)}
              className="modal-button modal-button-primary"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Wild Card Category Selection */}
      {!isGameOver && selectedCard !== null && player.hand[selectedCard]?.category === "Wild" && (
        <div className="modal-overlay">
          <div className="modal-content selection-panel selection-panel-wild">
            <h3 className="modal-header">Select Category for {player.hand[selectedCard].name}</h3>
            <div className="selection-buttons">
              <button onClick={() => handleWildCardPlacement("Environment")} className="selection-button" style={{ background: "#4caf50" }}>
                🌍 Environment
              </button>
              <button onClick={() => handleWildCardPlacement("Social")} className="selection-button" style={{ background: "#2196f3" }}>
                👥 Social
              </button>
              <button onClick={() => handleWildCardPlacement("Governance")} className="selection-button" style={{ background: "#fbc02d", color: "#000" }}>
                ⚖️ Governance
              </button>
              <button onClick={() => setSelectedCard(null)} className="modal-button modal-button-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Card Target Selection */}
      {!isGameOver && selectedCard !== null && player.hand[selectedCard]?.type === "Action" && targetPlayer === null && (
        <div className="modal-overlay">
          <div className="modal-content selection-panel selection-panel-action">
            <h3 className="modal-header">Play {player.hand[selectedCard].name} - Select Target Player</h3>
            <div className="selection-buttons">
              {Object.keys(G.players).map(playerId => {
                if (playerId === ctx.currentPlayer) return null;
                return (
                  <button 
                    key={playerId}
                    onClick={() => handleTargetSelection(playerId)} 
                    className="modal-button modal-button-secondary"
                  >
                    Target Player {playerId}
                  </button>
                );
              })}
              <button onClick={() => { setSelectedCard(null); setSelectingAsset(false); setTargetPlayer(null); }} className="modal-button modal-button-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Selection UI for steal-set */}
      {!isGameOver && selectingSet && selectedCard !== null && targetPlayer !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-header" style={{ color: "#ff9800" }}>🎯 Hostile Takeover - Select Which Set to Steal</h3>
            <p style={{ color: "#bbb" }}>Player {targetPlayer} has the following complete sets (3+ assets):</p>
            <div className="selection-buttons">
              {availableSets.map(category => {
                const categoryName = category === "E" ? "Environment 🌍" : category === "S" ? "Social 👥" : "Governance ⚖️";
                const categoryColor = category === "E" ? "#4caf50" : category === "S" ? "#2196f3" : "#fbc02d";
                const assetCount = G.players[targetPlayer].board[category].length;
                
                return (
                  <button
                    key={category}
                    onClick={() => handleSetSelection(category)}
                    className="selection-button"
                    style={{
                      backgroundColor: categoryColor,
                      color: category === "G" ? "#000" : "#fff",
                      padding: "20px 30px",
                      fontSize: "16px",
                    }}
                  >
                    Steal {categoryName}<br/>
                    <span style={{ fontSize: "14px" }}>({assetCount} assets)</span>
                  </button>
                );
              })}
            </div>
            <button 
              onClick={handleCancelSetSelection}
              className="modal-button modal-button-cancel"
              style={{ marginTop: "15px" }}
            >
              ❌ Cancel (Don't Play Card)
            </button>
          </div>
        </div>
      )}

      {/* Asset Selection UI - Opponent's Assets */}
      {!isGameOver && selectedCard !== null && targetPlayer !== null && selectingAsset && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "800px" }}>
            <h3 className="modal-header">Select which asset to {player.hand[selectedCard].effect === "swap-asset" ? "take" : "discard"} from Player {targetPlayer}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginTop: "15px" }}>
              {/* E Board */}
              <div>
                <h5 style={{ margin: "0 0 10px 0", color: "#4caf50" }}>🌍 Environment</h5>
                {G.players[targetPlayer].board.E.map((asset, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleOpponentAssetSelection("E", idx)}
                    className="asset-card-mini"
                    style={{
                      cursor: "pointer",
                      border: "1px solid #4caf50",
                    }}
                  >
                    <strong>{asset.name}</strong><br/>${asset.value}M
                  </div>
                ))}
                {G.players[targetPlayer].board.E.length === 0 && <div className="empty-board-message">No assets</div>}
              </div>

              {/* S Board */}
              <div>
                <h5 style={{ margin: "0 0 10px 0", color: "#2196f3" }}>👥 Social</h5>
                {G.players[targetPlayer].board.S.map((asset, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleOpponentAssetSelection("S", idx)}
                    className="asset-card-mini"
                    style={{
                      cursor: "pointer",
                      border: "1px solid #2196f3",
                    }}
                  >
                    <strong>{asset.name}</strong><br/>${asset.value}M
                  </div>
                ))}
                {G.players[targetPlayer].board.S.length === 0 && <div className="empty-board-message">No assets</div>}
              </div>

              {/* G Board */}
              <div>
                <h5 style={{ margin: "0 0 10px 0", color: "#fbc02d" }}>⚖️ Governance</h5>
                {G.players[targetPlayer].board.G.map((asset, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleOpponentAssetSelection("G", idx)}
                    className="asset-card-mini"
                    style={{
                      cursor: "pointer",
                      border: "1px solid #fbc02d",
                    }}
                  >
                    <strong>{asset.name}</strong><br/>${asset.value}M
                  </div>
                ))}
                {G.players[targetPlayer].board.G.length === 0 && <div className="empty-board-message">No assets</div>}
              </div>
            </div>
            <button 
              onClick={() => { setSelectedCard(null); setTargetPlayer(null); setSelectingAsset(false); }} 
              className="modal-button modal-button-cancel"
              style={{ marginTop: "15px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Asset Selection UI - Your Assets (for swap) */}
      {!isGameOver && selectedCard !== null && selectingYourAsset && selectedOpponentAsset !== null && (
        <div className="modal-overlay">
          <div className="modal-content selection-panel selection-panel-swap" style={{ maxWidth: "800px" }}>
            <h3 className="modal-header">Now select which of YOUR assets to give in exchange</h3>
            <p style={{ fontSize: "14px", color: "#bbb", marginBottom: "10px" }}>
              You're taking: <strong>{G.players[targetPlayer].board[selectedOpponentAsset.category][selectedOpponentAsset.assetIndex].name}</strong>
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginTop: "15px" }}>
              {/* E Board */}
              <div>
                <h5 style={{ margin: "0 0 10px 0", color: "#4caf50" }}>🌍 Environment</h5>
                {player.board.E.map((asset, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleYourAssetSelection("E", idx)}
                    className="asset-card-mini"
                    style={{
                      cursor: "pointer",
                      border: "1px solid #4caf50",
                    }}
                  >
                    <strong>{asset.name}</strong><br/>${asset.value}M
                  </div>
                ))}
                {player.board.E.length === 0 && <div className="empty-board-message">No assets</div>}
              </div>

              {/* S Board */}
              <div>
                <h5 style={{ margin: "0 0 10px 0", color: "#2196f3" }}>👥 Social</h5>
                {player.board.S.map((asset, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleYourAssetSelection("S", idx)}
                    className="asset-card-mini"
                    style={{
                      cursor: "pointer",
                      border: "1px solid #2196f3",
                    }}
                  >
                    <strong>{asset.name}</strong><br/>${asset.value}M
                  </div>
                ))}
                {player.board.S.length === 0 && <div className="empty-board-message">No assets</div>}
              </div>

              {/* G Board */}
              <div>
                <h5 style={{ margin: "0 0 10px 0", color: "#fbc02d" }}>⚖️ Governance</h5>
                {player.board.G.map((asset, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleYourAssetSelection("G", idx)}
                    className="asset-card-mini"
                    style={{
                      cursor: "pointer",
                      border: "1px solid #fbc02d",
                    }}
                  >
                    <strong>{asset.name}</strong><br/>${asset.value}M
                  </div>
                ))}
                {player.board.G.length === 0 && <div className="empty-board-message">No assets</div>}
              </div>
            </div>
            <button 
              onClick={() => { setSelectedCard(null); setTargetPlayer(null); setSelectingYourAsset(false); setSelectedOpponentAsset(null); }} 
              className="modal-button modal-button-cancel"
              style={{ marginTop: "15px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Game Over Overlay - Shows during 1.5s transition */}
      {isGameOver && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease-in',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '40px 60px',
            borderRadius: '20px',
            textAlign: 'center',
            animation: 'bounceIn 0.6s ease-out',
          }}>
            <h1 style={{
              fontSize: '48px',
              margin: '0 0 20px 0',
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}>
              🎮 Game Over!
            </h1>
            <p style={{
              fontSize: '20px',
              color: 'white',
              margin: 0,
            }}>
              Transitioning to results...
            </p>
          </div>
        </div>
      )}

      {/* Your Hand - REMOVED FROM HERE - Now in player-area above */}

      {/* End Turn Button - REMOVED FROM HERE - Now in player-area above */}
    </div>
  );
}