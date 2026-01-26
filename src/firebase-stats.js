import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

/**
 * Records a match result (idempotent - uses matchID as document ID)
 * @param {string} matchID - Unique match identifier
 * @param {string} player0Name - Name of player 0
 * @param {string} player1Name - Name of player 1
 * @param {string} winner - '0', '1', or 'draw'
 * @returns {boolean} true if match was recorded, false if already exists
 */
export async function recordMatch(matchID, player0Name, player1Name, winner) {
  try {
    const matchRef = doc(db, 'matches', matchID);
    const matchSnap = await getDoc(matchRef);

    // Idempotency check - if match already exists, don't record again
    if (matchSnap.exists()) {
      console.log('Match already recorded:', matchID);
      return false;
    }

    // Record the match
    await setDoc(matchRef, {
      matchID,
      player0: player0Name,
      player1: player1Name,
      winner,
      timestamp: new Date(),
    });

    console.log('Match recorded:', matchID);
    return true;
  } catch (err) {
    console.error('Error recording match:', err);
    throw err;
  }
}

/**
 * Computes leaderboard from match records
 * @param {number} maxResults - Maximum number of results to return
 * @returns {Array} Array of player stats sorted by wins
 */
export async function getLeaderboard(maxResults = 10) {
  try {
    const matchesCollection = collection(db, 'matches');
    const querySnapshot = await getDocs(matchesCollection);

    // Aggregate stats from matches
    const playerStats = {};

    querySnapshot.forEach((doc) => {
      const match = doc.data();
      const { player0, player1, winner } = match;

      // Initialize players if they don't exist
      if (!playerStats[player0]) {
        playerStats[player0] = { playerName: player0, wins: 0, losses: 0, totalGames: 0 };
      }
      if (!playerStats[player1]) {
        playerStats[player1] = { playerName: player1, wins: 0, losses: 0, totalGames: 0 };
      }

      // Update stats based on winner
      if (winner === '0') {
        playerStats[player0].wins++;
        playerStats[player0].totalGames++;
        playerStats[player1].losses++;
        playerStats[player1].totalGames++;
      } else if (winner === '1') {
        playerStats[player1].wins++;
        playerStats[player1].totalGames++;
        playerStats[player0].losses++;
        playerStats[player0].totalGames++;
      } else if (winner === 'draw') {
        // For draws, both players get a game but no win/loss
        playerStats[player0].totalGames++;
        playerStats[player1].totalGames++;
      }
    });

    // Convert to array and calculate win rates
    const leaderboard = Object.values(playerStats).map(player => ({
      ...player,
      winRate: player.totalGames > 0 
        ? ((player.wins / player.totalGames) * 100).toFixed(1) 
        : 0
    }));

    // Sort by wins (desc), then by win rate (desc)
    leaderboard.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return parseFloat(b.winRate) - parseFloat(a.winRate);
    });

    return leaderboard.slice(0, maxResults);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return [];
  }
}

/**
 * Gets stats for multiple players (computed from matches)
 * @param {Array} playerNames - Array of player names
 * @returns {Array} Array of player stats
 */
export async function getMultiplePlayerStats(playerNames) {
  try {
    const matchesCollection = collection(db, 'matches');
    const querySnapshot = await getDocs(matchesCollection);

    // Aggregate stats from matches
    const playerStats = {};

    // Initialize all requested players
    playerNames.forEach(name => {
      playerStats[name] = { playerName: name, wins: 0, losses: 0, totalGames: 0 };
    });

    querySnapshot.forEach((doc) => {
      const match = doc.data();
      const { player0, player1, winner } = match;

      // Only process matches involving requested players
      const player0Requested = playerNames.includes(player0);
      const player1Requested = playerNames.includes(player1);

      if (!player0Requested && !player1Requested) return;

      // Update stats based on winner
      if (player0Requested) {
        if (winner === '0') {
          playerStats[player0].wins++;
        } else if (winner === '1') {
          playerStats[player0].losses++;
        }
        if (winner !== 'draw' || (player1Requested && winner === 'draw')) {
          playerStats[player0].totalGames++;
        }
      }

      if (player1Requested) {
        if (winner === '1') {
          playerStats[player1].wins++;
        } else if (winner === '0') {
          playerStats[player1].losses++;
        }
        if (winner !== 'draw' || (player0Requested && winner === 'draw')) {
          playerStats[player1].totalGames++;
        }
      }
    });

    // Calculate win rates
    return playerNames.map(name => ({
      ...playerStats[name],
      winRate: playerStats[name].totalGames > 0 
        ? ((playerStats[name].wins / playerStats[name].totalGames) * 100).toFixed(1) 
        : 0
    }));
  } catch (err) {
    console.error('Error fetching multiple player stats:', err);
    return playerNames.map(name => ({
      playerName: name,
      wins: 0,
      losses: 0,
      totalGames: 0,
      winRate: 0
    }));
  }
}
