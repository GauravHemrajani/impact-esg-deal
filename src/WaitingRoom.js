import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';

export function WaitingRoom({ matchID, playerID, playerName, onStartGame, onLeave }) {
  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disbanded, setDisbanded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    
    // Real-time listener for lobby updates
    const unsubscribe = onSnapshot(
      doc(db, 'lobbies', matchID),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setLobby(data);
          setLoading(false);

          // Auto-start if both players ready and game started
          if (data.status === 'playing') {
            const player0Name = data.players.find(p => p.id === '0')?.name || 'Player 1';
            const player1Name = data.players.find(p => p.id === '1')?.name || 'Player 2';
            const currentMatchID = data.matchID || matchID;
            onStartGame(player0Name, player1Name, currentMatchID);
          }
        } else {
          // Lobby deleted (host left) - kick everyone out
          setLobby(null);
          setDisbanded(true);
          setLoading(false);
          setTimeout(() => {
            onLeave();
          }, 2000);
        }
      },
      (err) => {
        setError('Failed to connect: ' + err.message);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [matchID, onStartGame, onLeave, playerID, playerName]);

  const toggleReady = async () => {
    try {
      const updatedPlayers = lobby.players.map(p => 
        p.id === playerID ? { ...p, ready: !p.ready } : p
      );

      await updateDoc(doc(db, 'lobbies', matchID), {
        players: updatedPlayers,
      });
    } catch (err) {
      setError('Failed to update ready status: ' + err.message);
    }
  };

  const startGame = async () => {
    setError('');
    try {
      // Just update Firebase - boardgame.io will auto-create match when both players connect
      await updateDoc(doc(db, 'lobbies', matchID), {
        status: 'playing',
      });
      
      const player0Name = lobby.players.find(p => p.id === '0')?.name || 'Player 1';
      const player1Name = lobby.players.find(p => p.id === '1')?.name || 'Player 2';
      const currentMatchID = lobby.matchID || matchID;
      onStartGame(player0Name, player1Name, currentMatchID);
    } catch (err) {
      setError('Failed to start game: ' + err.message);
      console.error('Start game error:', err);
    }
  };

  const handleLeave = async () => {
    const isHost = playerID === '0';
    
    try {
      if (isHost) {
        // Host leaving - delete entire lobby and leave immediately
        await deleteDoc(doc(db, 'lobbies', matchID));
        onLeave(); // Leave immediately, don't wait for snapshot
      } else {
        // Non-host leaving - remove from players list
        const updatedPlayers = lobby.players.filter(p => p.id !== playerID);
        await updateDoc(doc(db, 'lobbies', matchID), {
          players: updatedPlayers,
        });
        onLeave();
      }
    } catch (err) {
      console.error('Error leaving lobby:', err);
      onLeave(); // Leave anyway
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px',
      }}>
        Loading lobby...
      </div>
    );
  }

  // If lobby was disbanded, show message
  if (disbanded) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
        color: 'white',
      }}>
        <div style={{ fontSize: '48px' }}>👋</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>Lobby Disbanded</div>
        <div style={{ fontSize: '16px', opacity: 0.9 }}>The host has left the game</div>
        <div style={{ fontSize: '14px', opacity: 0.7 }}>Returning to lobby...</div>
      </div>
    );
  }

  // If lobby doesn't exist, show disbanded message
  if (!lobby) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
        color: 'white',
      }}>
        <div style={{ fontSize: '48px' }}>👋</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>Lobby Disbanded</div>
        <div style={{ fontSize: '16px', opacity: 0.9 }}>The host has left the game</div>
        <div style={{ fontSize: '14px', opacity: 0.7 }}>Returning to lobby...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{ color: 'white', fontSize: '20px' }}>{error}</div>
        <button
          onClick={onLeave}
          style={{
            padding: '12px 30px',
            fontSize: '16px',
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  const currentPlayer = lobby.players.find(p => p.id === playerID);
  const isHost = playerID === '0';
  const allReady = lobby.players.length === 2 && lobby.players.every(p => p.ready);

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
        maxWidth: '600px',
        width: '100%',
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px',
        }}>
          <h1 style={{
            margin: '0 0 10px 0',
            fontSize: '28px',
            color: '#333',
          }}>
            Waiting Room
          </h1>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '24px',
            fontWeight: 'bold',
            letterSpacing: '3px',
            display: 'inline-block',
            marginBottom: '10px',
          }}>
            {matchID}
          </div>
          <p style={{
            color: '#666',
            fontSize: '14px',
            margin: '10px 0 0 0',
          }}>
            Share this code with your opponent
          </p>
        </div>

        <div style={{
          background: '#f8f8f8',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '25px',
        }}>
          <h3 style={{
            margin: '0 0 15px 0',
            fontSize: '16px',
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Players ({lobby.players.length}/2)
          </h3>

          {lobby.players.map((player, idx) => (
            <div key={idx} style={{
              background: 'white',
              padding: '15px 20px',
              borderRadius: '10px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: player.id === playerID ? '2px solid #667eea' : '2px solid transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: player.id === '0' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '18px',
                }}>
                  {player.name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: '#333',
                  }}>
                    {player.name}
                    {player.id === playerID && (
                      <span style={{ color: '#667eea', marginLeft: '8px' }}>(You)</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#999',
                  }}>
                    {player.id === '0' ? 'Host' : 'Player 2'}
                  </div>
                </div>
              </div>
              <div style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold',
                background: player.ready ? '#d4edda' : '#f8f9fa',
                color: player.ready ? '#155724' : '#6c757d',
              }}>
                {player.ready ? '✓ Ready' : 'Not Ready'}
              </div>
            </div>
          ))}

          {lobby.players.length === 1 && (
            <div style={{
              textAlign: 'center',
              padding: '30px',
              color: '#999',
              fontSize: '14px',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏳</div>
              Waiting for opponent to join...
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
        }}>
          {lobby.players.length === 2 && (
            <button
              onClick={toggleReady}
              style={{
                flex: 1,
                padding: '15px',
                fontSize: '16px',
                fontWeight: 'bold',
                background: currentPlayer?.ready 
                  ? 'white'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: currentPlayer?.ready ? '#667eea' : 'white',
                border: currentPlayer?.ready ? '2px solid #667eea' : 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {currentPlayer?.ready ? 'Cancel Ready' : 'Ready'}
            </button>
          )}

          {isHost && allReady && (
            <button
              onClick={startGame}
              style={{
                flex: 1,
                padding: '15px',
                fontSize: '16px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              🎮 Start Game
            </button>
          )}

          <button
            onClick={handleLeave}
            style={{
              padding: '15px 25px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: '#f5f5f5',
              color: '#666',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            Leave
          </button>
        </div>

        {isHost && lobby.players.length === 2 && !allReady && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#856404',
            textAlign: 'center',
          }}>
            ⚠️ Both players must be ready before starting
          </div>
        )}
      </div>
    </div>
  );
}
