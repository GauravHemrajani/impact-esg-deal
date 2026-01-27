import React, { useState, useEffect } from 'react';
import { Leaderboard } from './Leaderboard';
import { getMultiplePlayerStats, recordMatch } from './firebase-stats';
import { db } from './firebase';
import { doc, updateDoc, onSnapshot, getDoc, deleteDoc } from 'firebase/firestore';

export function GameOverScreen({ 
  winner, 
  matchID,
  playerID, 
  player0Name, 
  player1Name, 
  onPlayAgain, 
  onExit 
}) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [matchRecorded, setMatchRecorded] = useState(false);
  const [opponentLeft, setOpponentLeft] = useState(false);

  useEffect(() => {
    const recordAndFetchStats = async () => {
      setLoading(true);

      // Record match (idempotent - safe for both players to call)
      if (!matchRecorded) {
        try {
          await recordMatch(matchID, player0Name, player1Name, winner);
          setMatchRecorded(true);
        } catch (err) {
          console.error('Error recording match:', err);
          // Even if recording fails, still try to fetch stats
          setMatchRecorded(true);
        }
      }

      // Fetch updated stats computed from all matches
      const playerStats = await getMultiplePlayerStats([player0Name, player1Name]);
      setStats(playerStats);
      setLoading(false);
    };

    recordAndFetchStats();
  }, [winner, player0Name, player1Name, matchID, matchRecorded]);

  // Listen for opponent leaving
  useEffect(() => {
    const lobbyRef = doc(db, 'lobbies', matchID);
    
    const unsubscribe = onSnapshot(
      lobbyRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          // Lobby deleted - opponent (host) left
          setOpponentLeft(true);
        } else {
          const data = docSnap.data();
          // Check if opponent left (only 1 player remaining)
          if (data.players && data.players.length < 2) {
            setOpponentLeft(true);
          }
        }
      },
      (err) => {
        console.error('Error listening to lobby:', err);
      }
    );

    return () => unsubscribe();
  }, [matchID]);

  const handlePlayAgain = async () => {
    try {
      // Generate a new matchID for a fresh game
      const newMatchID = `${matchID.split('-')[0]}-${Date.now()}`;
      
      // Update lobby with new matchID and reset to waiting
      await updateDoc(doc(db, 'lobbies', matchID), {
        matchID: newMatchID,
        status: 'waiting',
        players: [
          { name: player0Name, id: '0', ready: false },
          { name: player1Name, id: '1', ready: false }
        ]
      });
      onPlayAgain();
    } catch (err) {
      console.error('Error resetting lobby:', err);
    }
  };

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = async () => {
    const isHost = playerID === '0';
    const playerName = playerID === '0' ? player0Name : player1Name;
    
    try {
      const lobbyRef = doc(db, 'lobbies', matchID);
      const lobbySnap = await getDoc(lobbyRef);
      
      if (lobbySnap.exists()) {
        if (isHost) {
          // Host leaving - delete entire lobby
          await deleteDoc(lobbyRef);
        } else {
          // Non-host leaving - remove from players list
          const lobbyData = lobbySnap.data();
          const updatedPlayers = lobbyData.players.filter(p => p.id !== playerID);
          await updateDoc(lobbyRef, {
            players: updatedPlayers,
          });
        }
      }
    } catch (err) {
      console.error('Error leaving lobby:', err);
    }
    
    onExit();
  };

  const winnerName = winner === '0' ? player0Name : winner === '1' ? player1Name : null;
  const isDraw = !winner || winner === 'draw';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '800px',
        width: '100%',
      }}>
        {/* Winner Announcement */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px',
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '10px',
            animation: 'bounce 1s ease-in-out',
          }}>
            {isDraw ? '🤝' : '🎉'}
          </div>
          
          <h1 style={{
            margin: '0 0 10px 0',
            fontSize: '36px',
            background: isDraw 
              ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
              : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
          }}>
            {isDraw ? "It's a Draw!" : `${winnerName} Wins!`}
          </h1>

          <p style={{
            color: '#666',
            fontSize: '18px',
            margin: '10px 0',
          }}>
            {isDraw 
              ? 'Both players played exceptionally well!'
              : 'Congratulations on the victory!'}
          </p>
        </div>

        {/* Match Summary */}
        <div style={{
          background: '#f8f8f8',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '25px',
        }}>
          <h3 style={{
            margin: '0 0 15px 0',
            fontSize: '18px',
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Match Summary
          </h3>

          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            gap: '20px',
          }}>
            {/* Player 0 */}
            <div style={{
              flex: 1,
              textAlign: 'center',
              padding: '20px',
              background: winner === '0' ? 'rgba(17, 153, 142, 0.1)' : 'white',
              borderRadius: '10px',
              border: winner === '0' ? '3px solid #11998e' : '2px solid #e0e0e0',
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '24px',
                margin: '0 auto 10px',
              }}>
                {player0Name[0].toUpperCase()}
              </div>
              <div style={{
                fontWeight: 'bold',
                fontSize: '18px',
                color: '#333',
              }}>
                {player0Name}
              </div>
            </div>

            {/* VS */}
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#999',
            }}>
              VS
            </div>

            {/* Player 1 */}
            <div style={{
              flex: 1,
              textAlign: 'center',
              padding: '20px',
              background: winner === '1' ? 'rgba(17, 153, 142, 0.1)' : 'white',
              borderRadius: '10px',
              border: winner === '1' ? '3px solid #11998e' : '2px solid #e0e0e0',
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '24px',
                margin: '0 auto 10px',
              }}>
                {player1Name[0].toUpperCase()}
              </div>
              <div style={{
                fontWeight: 'bold',
                fontSize: '18px',
                color: '#333',
              }}>
                {player1Name}
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <Leaderboard 
          playerNames={[player0Name, player1Name]} 
          highlightPlayers={true}
          refreshTrigger={matchRecorded ? 1 : 0}
        />

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginTop: '25px',
        }}>
          <button
            onClick={handlePlayAgain}
            disabled={opponentLeft}
            style={{
              flex: 1,
              padding: '18px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: opponentLeft 
                ? '#ccc' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: opponentLeft ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s',
              opacity: opponentLeft ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!opponentLeft) e.target.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              if (!opponentLeft) e.target.style.transform = 'scale(1)';
            }}
          >
            {opponentLeft ? '👋 Opponent Left' : '🎮 Play Again'}
          </button>

          <button
            onClick={handleExit}
            style={{
              padding: '18px 30px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: '#f5f5f5',
              color: '#666',
              border: '2px solid #e0e0e0',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#e0e0e0';
              e.target.style.borderColor = '#999';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#f5f5f5';
              e.target.style.borderColor = '#e0e0e0';
            }}
          >
            Exit to Lobby
          </button>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              fontSize: '22px',
              color: '#333',
            }}>
              Exit to Lobby?
            </h3>
            <p style={{
              color: '#666',
              fontSize: '16px',
              marginBottom: '25px',
            }}>
              Are you sure you want to exit? This will end the current lobby session.
            </p>
            <div style={{
              display: 'flex',
              gap: '10px',
            }}>
              <button
                onClick={confirmExit}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Yes, Exit
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: '#f5f5f5',
                  color: '#666',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
