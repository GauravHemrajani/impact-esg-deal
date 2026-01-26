import React, { useEffect, useState } from 'react';
import { getLeaderboard } from './firebase-stats';

export function Leaderboard({ playerNames = [], highlightPlayers = false, refreshTrigger = 0 }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const data = await getLeaderboard(10);
      setLeaderboard(data);
      setLoading(false);
    };

    fetchLeaderboard();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#999',
      }}>
        Loading leaderboard...
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#999',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>🏆</div>
        <div>No games played yet</div>
        <div style={{ fontSize: '14px', marginTop: '5px' }}>
          Be the first to play and claim the top spot!
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#f8f8f8',
      borderRadius: '12px',
      padding: '20px',
      overflow: 'hidden',
    }}>
      <h3 style={{
        margin: '0 0 20px 0',
        fontSize: '20px',
        color: '#333',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{ fontSize: '24px' }}>🏆</span>
        Leaderboard
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '50px 1fr 80px 80px 80px 80px',
        gap: '10px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        padding: '0 15px 10px 15px',
        borderBottom: '2px solid #e0e0e0',
        marginBottom: '10px',
      }}>
        <div>Rank</div>
        <div>Player</div>
        <div style={{ textAlign: 'center' }}>Wins</div>
        <div style={{ textAlign: 'center' }}>Losses</div>
        <div style={{ textAlign: 'center' }}>Games</div>
        <div style={{ textAlign: 'center' }}>Win %</div>
      </div>

      {leaderboard.map((player, index) => {
        const isHighlighted = highlightPlayers && playerNames.includes(player.playerName);
        const rankColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#999';
        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

        return (
          <div
            key={player.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '50px 1fr 80px 80px 80px 80px',
              gap: '10px',
              padding: '15px',
              background: isHighlighted 
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                : 'white',
              borderRadius: '8px',
              marginBottom: '8px',
              alignItems: 'center',
              border: isHighlighted ? '2px solid #667eea' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: rankColor,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              {rankEmoji ? (
                <span>{rankEmoji}</span>
              ) : (
                <span>#{index + 1}</span>
              )}
            </div>

            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#333',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {player.playerName}
              {isHighlighted && (
                <span style={{
                  marginLeft: '8px',
                  fontSize: '12px',
                  color: '#667eea',
                  fontWeight: 'normal',
                }}>
                  (You)
                </span>
              )}
            </div>

            <div style={{
              textAlign: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#4caf50',
            }}>
              {player.wins}
            </div>

            <div style={{
              textAlign: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#f44336',
            }}>
              {player.losses}
            </div>

            <div style={{
              textAlign: 'center',
              fontSize: '16px',
              color: '#666',
            }}>
              {player.totalGames}
            </div>

            <div style={{
              textAlign: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#667eea',
            }}>
              {player.winRate}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
