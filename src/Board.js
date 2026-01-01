import { useState, useEffect } from "react";

export function Board({ G, ctx, moves }) {
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
  
  // Auto-exit discard mode when hand reaches 7 or fewer cards
  useEffect(() => {
    if (discarding && G.players[ctx.currentPlayer]?.hand?.length <= 7) {
      setDiscarding(false);
    }
  }, [G.players[ctx.currentPlayer]?.hand?.length, discarding, ctx.currentPlayer]);
  
  if (!ctx) {
    return <div>Loading...</div>;
  }
  
  const player = G.players[ctx.currentPlayer];
  const opponent = G.players[ctx.currentPlayer === "0" ? "1" : "0"];
  
  // Check if there are pending attacks targeting current player
  const myPendingAttacks = G.pendingAttacks.filter(attack => 
    attack.targetId === ctx.currentPlayer && !attack.blocked && !attack.processed
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
    const card = player.hand[cardIndex];
    
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
      <div style={{ padding: "50px", fontFamily: "Arial, sans-serif", textAlign: "center" }}>
        <h1 style={{ fontSize: "48px", color: "#4caf50" }}>🎉 Game Over! 🎉</h1>
        <h2 style={{ fontSize: "36px", margin: "20px 0" }}>
          Player {ctx.gameover.winner} Wins!
        </h2>
        <div style={{ fontSize: "20px", marginTop: "30px" }}>
          <p>✅ Complete Environment Set</p>
          <p>✅ Complete Social Set</p>
          <p>✅ Complete Governance Set</p>
          <p>✅ No Outstanding Fines</p>
        </div>
        <div style={{ marginTop: "40px", fontSize: "24px", fontWeight: "bold" }}>
          Balanced ESG Framework Achieved!
        </div>
      </div>
    );
  }

  const isEComplete = player.board.E.length >= 3;
  const isSComplete = player.board.S.length >= 3;
  const isGComplete = player.board.G.length >= 3;

  return (
    <div style={{ padding: "30px", fontFamily: "Arial, sans-serif", maxWidth: "1400px" }}>
      <h1>Impact: The ESG Deal</h1>
      
      {/* Block Attack Popup - shows attacks at start of turn */}
      {hasAttacksToResolve && currentAttackIndex < myPendingAttacks.length && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "12px",
            maxWidth: "600px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)"
          }}>
            <h2 style={{ color: "#d32f2f", marginTop: 0 }}>⚠️ Incoming Attack! ({currentAttackIndex + 1}/{myPendingAttacks.length})</h2>
            <div style={{ margin: "20px 0", padding: "15px", backgroundColor: "#ffebee", borderRadius: "8px" }}>
              <p style={{ margin: "5px 0" }}>
                <strong>Attacker:</strong> Player {myPendingAttacks[currentAttackIndex].attackerId}
              </p>
              <p style={{ margin: "5px 0" }}>
                <strong>Attack Card:</strong> {myPendingAttacks[currentAttackIndex].card.name}
              </p>
              <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>
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
                      <div style={{ fontWeight: "bold", marginBottom: "5px" }}>{card.name}</div>
                      <div style={{ fontSize: "13px", color: "#666" }}>{card.lesson || ""}</div>
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
      
      {/* Opponent Info */}
      <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <h3>Opponent (Player {ctx.currentPlayer === "0" ? "1" : "0"})</h3>
        <p>Bank: ${opponent.bank}M | Fines: ${opponent.fines}M | Hand: {opponent.hand.length} cards</p>
        <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
          <div>
            <strong>E Board:</strong> {opponent.board.E.length} assets
            <div style={{ fontSize: "11px", color: "#666" }}>
              {opponent.board.E.map(c => c.name).join(", ") || "None"}
            </div>
          </div>
          <div>
            <strong>S Board:</strong> {opponent.board.S.length} assets
            <div style={{ fontSize: "11px", color: "#666" }}>
              {opponent.board.S.map(c => c.name).join(", ") || "None"}
            </div>
          </div>
          <div>
            <strong>G Board:</strong> {opponent.board.G.length} assets
            <div style={{ fontSize: "11px", color: "#666" }}>
              {opponent.board.G.map(c => c.name).join(", ") || "None"}
            </div>
          </div>
        </div>
      </div>

      {/* Current Player Info */}
      <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#e3f2fd", borderRadius: "8px" }}>
        <h2>Your Turn - Player {ctx.currentPlayer}</h2>
        <p><strong>Bank:</strong> ${player.bank}M | <strong>Fines:</strong> ${player.fines}M
          {player.fines > 0 && player.bank >= player.fines && (
            <button 
              onClick={() => moves.payFine(player.fines)}
              style={{ marginLeft: "10px", padding: "5px 10px", backgroundColor: "#ff9800", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Pay All Fines
            </button>
          )}
        </p>
        <p><strong>Turn:</strong> {ctx.turn} | <strong>Cards in Deck:</strong> {G.deck.length}</p>
        <p><strong>Moves Played:</strong> {player.movesPlayed} / 3</p>
      </div>

      {/* Your Boards */}
      <div style={{ marginBottom: "30px" }}>
        <h3>Your ESG Framework</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
          {/* E Board */}
          <div style={{ padding: "15px", backgroundColor: "#e8f5e9", borderRadius: "8px", border: isEComplete ? "4px solid #4caf50" : "2px solid #4caf50", boxShadow: isEComplete ? "0 0 10px #4caf50" : "none" }}>
            <h4 style={{ margin: "0 0 10px 0" }}>🌍 Environment ({player.board.E.length}/3) {isEComplete && "✅"}</h4>
            {player.board.E.map((card, idx) => (
              <div key={idx} style={{ fontSize: "12px", padding: "5px", backgroundColor: "white", marginBottom: "5px", borderRadius: "4px" }}>
                {card.name} (${card.value}M)
              </div>
            ))}
            {player.board.E.length === 0 && <div style={{ fontSize: "12px", color: "#666" }}>No assets yet</div>}
          </div>
          
          {/* S Board */}
          <div style={{ padding: "15px", backgroundColor: "#e3f2fd", borderRadius: "8px", border: isSComplete ? "4px solid #2196f3" : "2px solid #2196f3", boxShadow: isSComplete ? "0 0 10px #2196f3" : "none" }}>
            <h4 style={{ margin: "0 0 10px 0" }}>👥 Social ({player.board.S.length}/3) {isSComplete && "✅"}</h4>
            {player.board.S.map((card, idx) => (
              <div key={idx} style={{ fontSize: "12px", padding: "5px", backgroundColor: "white", marginBottom: "5px", borderRadius: "4px" }}>
                {card.name} (${card.value}M)
              </div>
            ))}
            {player.board.S.length === 0 && <div style={{ fontSize: "12px", color: "#666" }}>No assets yet</div>}
          </div>
          
          {/* G Board */}
          <div style={{ padding: "15px", backgroundColor: "#fff9c4", borderRadius: "8px", border: isGComplete ? "4px solid #ffeb3b" : "2px solid #ffeb3b", boxShadow: isGComplete ? "0 0 10px #ffeb3b" : "none" }}>
            <h4 style={{ margin: "0 0 10px 0" }}>⚖️ Governance ({player.board.G.length}/3) {isGComplete && "✅"}</h4>
            {player.board.G.map((card, idx) => (
              <div key={idx} style={{ fontSize: "12px", padding: "5px", backgroundColor: "white", marginBottom: "5px", borderRadius: "4px" }}>
                {card.name} (${card.value}M)
              </div>
            ))}
            {player.board.G.length === 0 && <div style={{ fontSize: "12px", color: "#666" }}>No assets yet</div>}
          </div>
        </div>
      </div>

      {/* Wild Card Category Selection */}
      {selectedCard !== null && player.hand[selectedCard]?.category === "Wild" && (
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#ffe0b2", borderRadius: "8px", border: "2px solid #ff9800" }}>
          <h4>Select Category for {player.hand[selectedCard].name}:</h4>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => handleWildCardPlacement("Environment")} style={{ padding: "10px 20px" }}>
              🌍 Environment
            </button>
            <button onClick={() => handleWildCardPlacement("Social")} style={{ padding: "10px 20px" }}>
              👥 Social
            </button>
            <button onClick={() => handleWildCardPlacement("Governance")} style={{ padding: "10px 20px" }}>
              ⚖️ Governance
            </button>
            <button onClick={() => setSelectedCard(null)} style={{ padding: "10px 20px", backgroundColor: "#ccc" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Card Target Selection */}
      {selectedCard !== null && player.hand[selectedCard]?.type === "Action" && targetPlayer === null && (
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#ffcdd2", borderRadius: "8px", border: "2px solid #f44336" }}>
          <h4>Play {player.hand[selectedCard].name} - Select Target Player:</h4>
          <div style={{ display: "flex", gap: "10px" }}>
            {Object.keys(G.players).map(playerId => {
              if (playerId === ctx.currentPlayer) return null;
              return (
                <button 
                  key={playerId}
                  onClick={() => handleTargetSelection(playerId)} 
                  style={{ padding: "10px 20px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Target Player {playerId}
                </button>
              );
            })}
            <button onClick={() => { setSelectedCard(null); setSelectingAsset(false); setTargetPlayer(null); }} style={{ padding: "10px 20px", backgroundColor: "#ccc" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Set Selection UI for steal-set */}
      {selectingSet && selectedCard !== null && targetPlayer !== null && (
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#fff3e0", borderRadius: "8px", border: "3px solid #ff9800" }}>
          <h3 style={{ marginTop: 0, color: "#e65100" }}>🎯 Hostile Takeover - Select Which Set to Steal</h3>
          <p style={{ color: "#666" }}>Player {targetPlayer} has the following complete sets (3+ assets):</p>
          <div style={{ display: "flex", gap: "15px", marginTop: "15px", flexWrap: "wrap" }}>
            {availableSets.map(category => {
              const categoryName = category === "E" ? "Environment 🌍" : category === "S" ? "Social 👥" : "Governance ⚖️";
              const categoryColor = category === "E" ? "#4caf50" : category === "S" ? "#2196f3" : "#ffeb3b";
              const assetCount = G.players[targetPlayer].board[category].length;
              
              return (
                <button
                  key={category}
                  onClick={() => handleSetSelection(category)}
                  style={{
                    padding: "20px 30px",
                    backgroundColor: categoryColor,
                    color: category === "G" ? "#000" : "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                  onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                >
                  Steal {categoryName}<br/>
                  <span style={{ fontSize: "14px" }}>({assetCount} assets)</span>
                </button>
              );
            })}
          </div>
          <button 
            onClick={handleCancelSetSelection}
            style={{
              marginTop: "15px",
              padding: "12px 24px",
              backgroundColor: "#ccc",
              color: "#000",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          >
            ❌ Cancel (Don't Play Card)
          </button>
        </div>
      )}

      {/* Asset Selection UI - Opponent's Assets */}
      {selectedCard !== null && targetPlayer !== null && selectingAsset && (
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#ffebee", borderRadius: "8px", border: "2px solid #f44336" }}>
          <h4>Select which asset to {player.hand[selectedCard].effect === "swap-asset" ? "take" : "discard"} from Player {targetPlayer}:</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginTop: "10px" }}>
            {/* E Board */}
            <div>
              <h5 style={{ margin: "0 0 10px 0" }}>🌍 Environment</h5>
              {G.players[targetPlayer].board.E.map((asset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleOpponentAssetSelection("E", idx)}
                  style={{
                    fontSize: "12px",
                    padding: "8px",
                    backgroundColor: "#e8f5e9",
                    marginBottom: "5px",
                    borderRadius: "4px",
                    border: "2px solid #4caf50",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                  onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                >
                  {asset.name} (${asset.value}M)
                </div>
              ))}
              {G.players[targetPlayer].board.E.length === 0 && <div style={{ fontSize: "12px", color: "#999" }}>No assets</div>}
            </div>

            {/* S Board */}
            <div>
              <h5 style={{ margin: "0 0 10px 0" }}>👥 Social</h5>
              {G.players[targetPlayer].board.S.map((asset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleOpponentAssetSelection("S", idx)}
                  style={{
                    fontSize: "12px",
                    padding: "8px",
                    backgroundColor: "#e3f2fd",
                    marginBottom: "5px",
                    borderRadius: "4px",
                    border: "2px solid #2196f3",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                  onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                >
                  {asset.name} (${asset.value}M)
                </div>
              ))}
              {G.players[targetPlayer].board.S.length === 0 && <div style={{ fontSize: "12px", color: "#999" }}>No assets</div>}
            </div>

            {/* G Board */}
            <div>
              <h5 style={{ margin: "0 0 10px 0" }}>⚖️ Governance</h5>
              {G.players[targetPlayer].board.G.map((asset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleOpponentAssetSelection("G", idx)}
                  style={{
                    fontSize: "12px",
                    padding: "8px",
                    backgroundColor: "#fff9c4",
                    marginBottom: "5px",
                    borderRadius: "4px",
                    border: "2px solid #ffeb3b",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                  onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                >
                  {asset.name} (${asset.value}M)
                </div>
              ))}
              {G.players[targetPlayer].board.G.length === 0 && <div style={{ fontSize: "12px", color: "#999" }}>No assets</div>}
            </div>
          </div>
          <button 
            onClick={() => { setSelectedCard(null); setTargetPlayer(null); setSelectingAsset(false); }} 
            style={{ marginTop: "15px", padding: "10px 20px", backgroundColor: "#ccc" }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Asset Selection UI - Your Assets (for swap) */}
      {selectedCard !== null && selectingYourAsset && selectedOpponentAsset !== null && (
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#e8f5e9", borderRadius: "8px", border: "2px solid #4caf50" }}>
          <h4>Now select which of YOUR assets to give in exchange:</h4>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
            You're taking: {G.players[targetPlayer].board[selectedOpponentAsset.category][selectedOpponentAsset.assetIndex].name}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginTop: "10px" }}>
            {/* E Board */}
            <div>
              <h5 style={{ margin: "0 0 10px 0" }}>🌍 Environment</h5>
              {player.board.E.map((asset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleYourAssetSelection("E", idx)}
                  style={{
                    fontSize: "12px",
                    padding: "8px",
                    backgroundColor: "#e8f5e9",
                    marginBottom: "5px",
                    borderRadius: "4px",
                    border: "2px solid #4caf50",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                  onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                >
                  {asset.name} (${asset.value}M)
                </div>
              ))}
              {player.board.E.length === 0 && <div style={{ fontSize: "12px", color: "#999" }}>No assets</div>}
            </div>

            {/* S Board */}
            <div>
              <h5 style={{ margin: "0 0 10px 0" }}>👥 Social</h5>
              {player.board.S.map((asset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleYourAssetSelection("S", idx)}
                  style={{
                    fontSize: "12px",
                    padding: "8px",
                    backgroundColor: "#e3f2fd",
                    marginBottom: "5px",
                    borderRadius: "4px",
                    border: "2px solid #2196f3",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                  onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                >
                  {asset.name} (${asset.value}M)
                </div>
              ))}
              {player.board.S.length === 0 && <div style={{ fontSize: "12px", color: "#999" }}>No assets</div>}
            </div>

            {/* G Board */}
            <div>
              <h5 style={{ margin: "0 0 10px 0" }}>⚖️ Governance</h5>
              {player.board.G.map((asset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleYourAssetSelection("G", idx)}
                  style={{
                    fontSize: "12px",
                    padding: "8px",
                    backgroundColor: "#fff9c4",
                    marginBottom: "5px",
                    borderRadius: "4px",
                    border: "2px solid #ffeb3b",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                  onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                >
                  {asset.name} (${asset.value}M)
                </div>
              ))}
              {player.board.G.length === 0 && <div style={{ fontSize: "12px", color: "#999" }}>No assets</div>}
            </div>
          </div>
          <button 
            onClick={() => { setSelectedCard(null); setTargetPlayer(null); setSelectingYourAsset(false); setSelectedOpponentAsset(null); }} 
            style={{ marginTop: "15px", padding: "10px 20px", backgroundColor: "#ccc" }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Your Hand */}
      <div style={{ marginTop: "20px" }}>
        <h3>Your Hand ({player.hand.length} cards - Max 7)</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {player.hand.map((card, index) => (
            <div
              key={`${card.id}-${index}`}
              style={{
                border: selectedCard === index ? "3px solid #ff9800" : "2px solid #333",
                borderRadius: "8px",
                padding: "10px",
                width: "150px",
                backgroundColor: 
                  card.type === "Asset" ? "#e8f5e9" :
                  card.type === "Capital" ? "#fff9c4" : "#e3f2fd",
                cursor: player.movesPlayed < 3 ? "pointer" : "not-allowed",
                opacity: player.movesPlayed < 3 ? 1 : 0.5,
              }}
            >
              <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                {card.name}
              </div>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                {card.type}
                {card.category && card.category !== "Neutral" && ` - ${card.category}`}
              </div>
              {card.value !== undefined && (
                <div style={{ fontSize: "12px", color: "#388e3c", fontWeight: "bold" }}>
                  ${card.value}M
                </div>
              )}
              {card.effect && (
                <div style={{ fontSize: "11px", color: "#d32f2f", marginTop: "3px" }}>
                  {card.effect}
                </div>
              )}
              
              <button
                onClick={() => discarding ? moves.discardCard(index) : handlePlayCard(index)}
                disabled={!discarding && player.movesPlayed >= 3}
                style={{
                  marginTop: "8px",
                  padding: "5px 10px",
                  width: "100%",
                  backgroundColor: discarding ? "#f44336" : (player.movesPlayed < 3 ? "#4caf50" : "#ccc"),
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: discarding || player.movesPlayed < 3 ? "pointer" : "not-allowed",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {discarding ? "Discard" : "Play"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* End Turn Button */}
      <div style={{ marginTop: "30px" }}>
        {discarding && player.hand.length > 7 ? (
          <div style={{ 
            padding: "15px", 
            backgroundColor: "#ffebee", 
            borderRadius: "8px", 
            border: "2px solid #f44336"
          }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#d32f2f" }}>⚠️ Hand Limit Exceeded!</h3>
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              You have {player.hand.length} cards. You must discard down to 7 cards before ending your turn.
            </p>
            <p style={{ margin: "5px 0", fontSize: "14px", fontWeight: "bold" }}>
              Cards to discard: {player.hand.length - 7}
            </p>
          </div>
        ) : (
          <button 
            onClick={() => {
              if (player.hand.length > 7) {
                // Hand over limit - activate discard mode
                setDiscarding(true);
              } else {
                // Hand is fine - end turn and reset discard mode
                setDiscarding(false);
                moves.endTurn();
              }
            }}
            style={{
              padding: "15px 30px",
              fontSize: "16px",
              fontWeight: "bold",
              backgroundColor: "#2196f3",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            End Turn
          </button>
        )}
      </div>
    </div>
  );
}