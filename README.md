# Impact: The ESG Deal

A strategic multiplayer card game built with React and boardgame.io, focused on Environmental, Social, and Governance (ESG) themes. Players compete to build complete asset sets across E, S, and G categories while managing capital, paying fines, and using action cards to attack opponents or defend their portfolios.

## Game Overview

- **Players:** 2 players
- **Deck:** 30 cards (12 Assets, 12 Actions, 6 Capital)
- **Objective:** Be the first to complete 3+ asset sets in each E/S/G category with no outstanding fines
- **Mechanics:** Turn-based gameplay with hand management, set collection, blocking system, and strategic attacks

## Tech Stack

- **React** 19.2.3
- **boardgame.io** 0.50.2
- **Node.js** v25.2.1

## Getting Started

### Installation

```bash
npm install
```

### Running the Game

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to play in your browser.

## How to Collaborate

### 1. Clone the Repository

```bash
git clone https://github.com/GauravHemrajani/impact-esg-deal.git
cd impact-esg-deal
```

### 2. Create a New Branch

Before making changes, create your own branch:

```bash
git checkout -b your-name/feature-description
```

Example: `git checkout -b john/add-animations`

### 3. Make Your Changes

Edit the code in the `src/` directory:
- **Game.js** - Game logic and moves
- **Board.js** - UI and player interactions
- **cards.js** - Card definitions

### 4. Test Your Changes

Run the game locally to test:

```bash
npm start
```

### 5. Commit and Push

```bash
git add .
git commit -m "Brief description of your changes"
git push origin your-name/feature-description
```

### 6. Create a Pull Request

Go to the [GitHub repository](https://github.com/GauravHemrajani/impact-esg-deal) and create a Pull Request from your branch to `main`. Add a description of what you changed and why.

## Project Structure

```
src/
├── App.js          # Client initialization
├── Game.js         # Game rules and move logic
├── Board.js        # Visual UI and interactions
└── cards.js        # Card data and deck
```

## Current Features

✅ 30-card deck with shuffle and auto-deal  
✅ Turn-based gameplay with 3 moves per turn  
✅ Asset, Capital, and Action card playing  
✅ Blocking system with turn-end attack queue  
✅ All action card effects implemented (except Tech Upgrade/ISO Certification)  
✅ Manual hand limit discard system (7 cards max)  
✅ Win condition checking  

## Contributing Guidelines

- **Test your code** before pushing
- **Write clear commit messages** describing what you changed
- **Don't commit** `node_modules/` or build files
- **Ask questions** if you're unsure about implementation
- **Keep changes focused** - one feature or fix per branch

## Need Help?

Check the code comments or reach out to the team if you're stuck!
