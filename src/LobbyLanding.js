import React, { useState } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';

export function LobbyLanding({ onJoinGame }) {
  const [playerName, setPlayerName] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateLobbyCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const matchID = generateLobbyCode();
      
      // Create lobby in Firebase
      await setDoc(doc(db, 'lobbies', matchID), {
        matchID,
        host: playerName,
        players: [{ name: playerName, id: '0', ready: false }],
        status: 'waiting',
        createdAt: new Date(),
      });

      onJoinGame({
        matchID,
        playerID: '0',
        playerName,
      });
    } catch (err) {
      setError('Failed to create game: ' + err.message);
      setLoading(false);
    }
  };

  const joinGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!lobbyCode.trim()) {
      setError('Please enter lobby code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const lobbyRef = doc(db, 'lobbies', lobbyCode.toUpperCase());
      const lobbySnap = await getDoc(lobbyRef);

      if (!lobbySnap.exists()) {
        setError('Lobby not found. Check the code and try again.');
        setLoading(false);
        return;
      }

      const lobbyData = lobbySnap.data();
      
      if (lobbyData.players.length >= 2) {
        setError('Lobby is full');
        setLoading(false);
        return;
      }

      // Add player to lobby
      const newPlayer = { name: playerName, id: '1', ready: false };
      await setDoc(lobbyRef, {
        ...lobbyData,
        players: [...lobbyData.players, newPlayer],
      });

      onJoinGame({
        matchID: lobbyCode.toUpperCase(),
        playerID: '1',
        playerName,
      });
    } catch (err) {
      setError('Failed to join game: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '500px',
        width: '90%',
      }}>
        <h1 style={{
          margin: '0 0 10px 0',
          fontSize: '32px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
        }}>
          Impact ESG Deal
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '30px',
        }}>
          Build your ESG empire and outplay your opponent!
        </p>

        {error && (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            color: '#c33',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '25px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#333',
          }}>
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              boxSizing: 'border-box',
              transition: 'border 0.3s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '25px',
        }}>
          <button
            onClick={createGame}
            disabled={loading}
            style={{
              padding: '15px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'transform 0.2s',
              gridColumn: '1 / -1',
            }}
            onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            {loading ? 'Creating...' : '🎮 Create New Game'}
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          margin: '20px 0',
          color: '#999',
          fontSize: '14px',
        }}>
          — OR —
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#333',
          }}>
            Lobby Code
          </label>
          <input
            type="text"
            value={lobbyCode}
            onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-digit code"
            maxLength={6}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              boxSizing: 'border-box',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              textAlign: 'center',
              fontWeight: 'bold',
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        <button
          onClick={joinGame}
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '16px',
            fontWeight: 'bold',
            background: 'white',
            color: '#667eea',
            border: '2px solid #667eea',
            borderRadius: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.background = '#667eea';
              e.target.style.color = 'white';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'white';
            e.target.style.color = '#667eea';
          }}
        >
          {loading ? 'Joining...' : '🚪 Join Existing Game'}
        </button>

        <div style={{
          marginTop: '30px',
          padding: '15px',
          background: '#f5f5f5',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#666',
        }}>
          <strong>How to play:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>Create a game and share the code with a friend</li>
            <li>Or join an existing game with a lobby code</li>
            <li>Wait in the lobby for your opponent to join</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
