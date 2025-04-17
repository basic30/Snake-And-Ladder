document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startScreen = document.getElementById('start-screen');
    const gameArea = document.getElementById('game-area');
    const playerCountSelect = document.getElementById('player-count');
    const gameLevelSelect = document.getElementById('game-level');
    const startButton = document.getElementById('start-button');
    const board = document.getElementById('board');
    const piecesContainer = document.getElementById('pieces-container');
    const diceElement = document.getElementById('dice');
    const messageArea = document.getElementById('message-area');
    const boardContainer = document.querySelector('.board-container'); // For size calculations

    // --- Game State ---
    let players = [];
    let currentPlayerIndex = 0;
    let squareElements = [];
    let gameLevel = 'Medium'; // Default level
    let diceValue = 1;
    let canRoll = true; // Prevent multiple rolls

    // --- Game Configuration (Base settings) ---
    const boardSize = 100;
    const playerColors = ['player-1', 'player-2', 'player-3', 'player-4', 'player-5', 'player-6']; // Corresponds to CSS classes
    // const playerIcons = [...] // Keep your icon paths if you have them

    // --- <<< NEW: Board Configurations >>> ---
    const boardConfigurations = {
        Easy: [
            { // Easy Board 1: Fewer snakes, good ladders
                snakes: { 35: 8, 52: 29, 78: 41, 94: 72 },
                ladders: { 3: 21, 7: 31, 19: 38, 28: 55, 42: 63, 60: 81, 75: 96 }
            },
            { // Easy Board 2: Very few snakes, ladders help bypass tricky areas
                snakes: { 44: 18, 68: 50, 89: 67 },
                ladders: { 5: 25, 11: 40, 22: 58, 36: 49, 51: 77, 65: 88, 71: 91 }
            },
             { // Easy Board 3
                 snakes: { 27: 5, 40: 15, 61: 39, 85: 64 },
                 ladders: { 2: 23, 9: 32, 20: 43, 35: 57, 48: 69, 55: 76, 70: 90 }
             }
            // --- ADD AT LEAST 7 MORE EASY BOARD CONFIGURATIONS HERE ---
            // { snakes: {...}, ladders: {...} },
            // { snakes: {...}, ladders: {...} },
            // ...
        ],
        Medium: [
            { // Medium Board 1 (Original from your image)
                 snakes: { 16: 6,  47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 },
                 ladders: { 1: 38,  4: 14,  9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 }
            },
            { // Medium Board 2: Balanced
                snakes: { 22: 5, 39: 18, 55: 34, 76: 58, 89: 67, 99: 78, 92: 73 },
                ladders: { 7: 29, 13: 46, 33: 51, 42: 63, 62: 81, 74: 95 }
            },
            { // Medium Board 3: Slightly more snakes near the end
                snakes: { 31: 9, 48: 26, 59: 40, 73: 53, 84: 60, 91: 71, 96: 75, 98: 80 },
                ladders: { 2: 24, 15: 37, 29: 50, 45: 66, 61: 82, 70: 88 }
            }
            // --- ADD AT LEAST 7 MORE MEDIUM BOARD CONFIGURATIONS HERE ---
            // { snakes: {...}, ladders: {...} },
            // { snakes: {...}, ladders: {...} },
            // ...
        ],
        Hard: [
            { // Hard Board 1: Many snakes, some long drops, fewer ladders
                snakes: { 15: 2, 25: 7, 38: 11, 49: 15, 63: 22, 75: 33, 88: 50, 94: 70, 97: 61, 99: 9 },
                ladders: { 5: 20, 18: 41, 36: 59, 68: 85, 72: 91 } // Fewer ladders
            },
            { // Hard Board 2: Snakes positioned to punish climbs
                snakes: { 19: 4, 31: 10, 44: 23, 58: 37, 69: 48, 77: 54, 85: 60, 92: 72, 96: 79, 98: 81 },
                ladders: { 2: 17, 12: 34, 28: 53, 50: 71, 65: 83 } // Ladders might lead near snakes
            },
            { // Hard Board 3: Brutal final stretch
                snakes: { 26: 6, 47: 19, 54: 30, 66: 45, 79: 58, 87: 65, 93: 73, 95: 75, 98: 78 }, // Lots near end
                ladders: { 3: 21, 13: 46, 33: 51, 42: 62, 68: 86 } // Less help at the top
            }
            // --- ADD AT LEAST 7 MORE HARD BOARD CONFIGURATIONS HERE ---
            // { snakes: {...}, ladders: {...} },
            // { snakes: {...}, ladders: {...} },
            // ...
        ]
    };

    // Declare global variables for the *currently selected* board layout
    let snakes = {};
    let ladders = {};

    // --- Event Listeners ---
    startButton.addEventListener('click', startGame);
    diceElement.addEventListener('click', handleDiceClick);

    // --- Functions ---

    function createBoard() {
        board.innerHTML = ''; // Clear previous board
        squareElements = []; // Reset square elements array
        for (let i = 0; i < boardSize; i++) {
            const square = document.createElement('div');
            square.classList.add('square');
            const squareNum = calculateSquareNumber(i);
            square.dataset.square = squareNum;

            const numberSpan = document.createElement('span');
            numberSpan.textContent = squareNum;
            square.appendChild(numberSpan);

            // Add to board and array
            board.appendChild(square);
            squareElements[squareNum] = square; // Store by square number (1-100)
        }
        // Update overlay image based on chosen board? (Optional, complex)
        // For now, we assume the visual overlay is generic or matches Medium Board 1
        const overlayImg = document.getElementById('board-overlay-img');
         if (overlayImg) {
            // If you create unique overlay images per board (e.g., 'overlay_medium_1.png')
            // you could potentially update the src here based on the selected board.
            // This example keeps the original single overlay:
              overlayImg.src = 'images/snakes_ladders_overlay.png';
              overlayImg.style.display = 'block';
         } else {
             console.warn("Board overlay image element not found!");
         }
    }

    function calculateSquareNumber(index) {
        const row = Math.floor(index / 10);
        const col = index % 10;
        let number;
        if (row % 2 === 0) { // Even row (0, 2, 4... starting from bottom)
            number = 100 - row * 10 - col;
        } else { // Odd row (1, 3, 5...)
            number = 100 - row * 10 - (9 - col);
        }
        return number;
    }

     function setupPlayers(count) {
        players = [];
        piecesContainer.innerHTML = ''; // Clear old pieces
        document.querySelectorAll('.player-info-box').forEach(box => box.style.display = 'none');

        for (let i = 0; i < count; i++) {
            const player = {
                id: i + 1,
                name: `Player ${i + 1}`,
                position: 0, // Start off-board
                element: createPlayerPiece(i),
                infoBox: document.getElementById(`player-info-${i + 1}`),
                colorClass: playerColors[i]
            };
            players.push(player);
            piecesContainer.appendChild(player.element);

            if(player.infoBox) {
                player.infoBox.style.display = 'flex';
                player.infoBox.querySelector('.player-name').textContent = player.name;
                player.infoBox.querySelector('.player-icon').className = `player-icon ${player.colorClass}`;
                 player.infoBox.classList.remove('active-player');
            } else {
                console.warn(`Info box for player ${i+1} not found.`);
            }
            updatePiecePosition(player);
        }
    }

    function createPlayerPiece(playerIndex) {
        const piece = document.createElement('div');
        piece.classList.add('player-piece', playerColors[playerIndex]);
        piece.dataset.playerId = playerIndex + 1;
        piece.style.top = '-20px';
        piece.style.left = `${10 + playerIndex * 10}%`;
        return piece;
    }

    function startGame() {
        const selectedPlayerCount = parseInt(playerCountSelect.value);
        gameLevel = gameLevelSelect.value; // Store selected level ('Easy', 'Medium', 'Hard')

        // --- <<< NEW: Select Random Board Configuration >>> ---
        const availableBoardsForLevel = boardConfigurations[gameLevel];
        if (!availableBoardsForLevel || availableBoardsForLevel.length === 0) {
            console.error(`No board configurations found for level: ${gameLevel}. Defaulting to Medium.`);
            gameLevel = 'Medium'; // Fallback
            availableBoardsForLevel = boardConfigurations[gameLevel];
        }

        const randomIndex = Math.floor(Math.random() * availableBoardsForLevel.length);
        const selectedBoardConfig = availableBoardsForLevel[randomIndex];

        // Update the global snakes and ladders for this game instance
        snakes = selectedBoardConfig.snakes;
        ladders = selectedBoardConfig.ladders;

        console.log(`Starting game with ${selectedPlayerCount} players. Level: ${gameLevel}. Using Board config #${randomIndex + 1}`);
        console.log("Selected Snakes:", snakes);
        console.log("Selected Ladders:", ladders);

        createBoard(); // Create the grid (visuals)
        setupPlayers(selectedPlayerCount); // Create players and pieces

        currentPlayerIndex = 0;
        canRoll = true;
        updateActivePlayerUI();
        setMessage(`${players[currentPlayerIndex].name}'s turn. Click the dice!`);

        startScreen.classList.remove('active'); // Hide start screen
        gameArea.style.opacity = '1'; // Make game area visible
    }

    // --- Dice Rolling and Movement Functions (Mostly Unchanged) ---

    function handleDiceClick() {
        if (!canRoll) return;
        canRoll = false;
        rollDice();
    }

    async function rollDice() {
        // Dice Animation (Visual) - Keep as is
        diceElement.style.transition = 'transform 1s ease-out';
        const randomRotations = 3 + Math.floor(Math.random() * 3);
        const finalX = Math.floor(Math.random() * 4) * 90;
        const finalY = Math.floor(Math.random() * 4) * 90;
        const finalZ = Math.floor(Math.random() * 4) * 90;
        diceElement.style.transform = `rotateX(${finalX + 360 * randomRotations}deg) rotateY(${finalY + 360 * randomRotations}deg) rotateZ(${finalZ + 360 * randomRotations}deg)`;

        // Generate Result
        diceValue = Math.floor(Math.random() * 6) + 1;

        await sleep(1000); // Wait for animation

        // Update Dice Face (Visual) - Keep as is
        let finalTransform = '';
         switch (diceValue) {
             case 1: finalTransform = 'rotateX(0deg) rotateY(0deg)'; break;
             case 6: finalTransform = 'rotateY(180deg)'; break;
             case 2: finalTransform = 'rotateY(-90deg)'; break;
             case 5: finalTransform = 'rotateY(90deg)'; break;
             case 3: finalTransform = 'rotateX(-90deg)'; break;
             case 4: finalTransform = 'rotateX(90deg)'; break;
             default: finalTransform = 'rotateX(0deg) rotateY(0deg)';
         }
        diceElement.style.transition = 'transform 0.5s ease-out';
        diceElement.style.transform = finalTransform;

        setMessage(`${players[currentPlayerIndex].name} rolled a ${diceValue}`);
        await movePiece(players[currentPlayerIndex], diceValue);
    }


    async function movePiece(player, steps) {
        setMessage(`Moving ${player.name}...`);
        let startPos = player.position;
        let targetPos = startPos + steps;

        // --- Handle unlocking piece (optional, assuming 6 unlocks) ---
        if (startPos === 0) {
             if (diceValue === 6) {
                 setMessage(`${player.name} rolled a 6 and is unlocked! Moving to square 1.`);
                 player.position = 1; // Move to square 1
                 updatePiecePosition(player);
                 await sleep(500);
                 // Player gets another turn after rolling a 6 (common rule)
                 // canRoll = true; // Allow rolling again immediately
                 // setMessage(`${player.name} rolled a 6! Roll again.`);
                 // return; // Don't switch player yet
                 // OR just proceed without extra turn:
                 switchPlayer(); // Switch after unlocking move is done
                 return;
             } else {
                 setMessage(`${player.name} needs a 6 to start.`);
                 await sleep(1000);
                 switchPlayer();
                 return;
             }
        }


        if (targetPos > boardSize) {
             setMessage(`${player.name} needs ${boardSize - startPos} exactly to win!`);
             await sleep(1000);
             switchPlayer();
             return;
        }

        // Step-by-step movement
        for (let i = 1; i <= steps; i++) {
            const currentStepPos = startPos + i;
            if (currentStepPos > boardSize) break; // Stop if overshoot during steps
            player.position = currentStepPos;
            updatePiecePosition(player);
            await sleep(350);

            if (currentStepPos === boardSize) break;
        }

        // Update final logical position
        player.position = Math.min(targetPos, boardSize); // Ensure not logically > 100
        updatePiecePosition(player); // Final visual update

        // Check for Win
        if (player.position === boardSize) {
            setMessage(`🎉 ${player.name} wins! 🎉`);
            canRoll = false;
            player.element.style.transform += ' scale(1.5)';
            return;
        }

        // Check for Snakes and Ladders (USING THE GLOBALLY SET snakes/ladders)
        await sleep(300);
        const landedSquare = player.position;
        let newPosition = landedSquare;

        // *** Uses the dynamically set 'ladders' and 'snakes' ***
        if (ladders[landedSquare]) {
            newPosition = ladders[landedSquare];
            setMessage(`🪜 ${player.name} found a ladder to ${newPosition}!`);
            player.element.style.transition = 'top 0.5s ease-in-out, left 0.5s ease-in-out';
        } else if (snakes[landedSquare]) {
            newPosition = snakes[landedSquare];
            setMessage(`🐍 Oh no! ${player.name} slid down to ${newPosition}!`);
             player.element.style.transition = 'top 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55), left 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
        }

        if (newPosition !== landedSquare) {
            await sleep(500);
            player.position = newPosition;
            updatePiecePosition(player);
            await sleep(600);
             player.element.style.transition = 'top 0.3s ease-in-out, left 0.3s ease-in-out'; // Reset transition
        }

        // Switch player (consider if 6 grants another turn - currently doesn't after initial unlock)
        // if (diceValue === 6) {
        //    setMessage(`${player.name} rolled a 6! Roll again.`);
        //    canRoll = true; // Allow same player to roll again
        // } else {
             switchPlayer();
        // }
    }

    // --- updatePiecePosition, switchPlayer, updateActivePlayerUI, setMessage, sleep functions remain the same ---
    // Paste the existing functions here:
    function updatePiecePosition(player) {
        const targetSquare = player.position;

        if (targetSquare <= 0) {
             const homeArea = player.infoBox?.querySelector('.player-home');
             if (homeArea) {
                 const homeRect = homeArea.getBoundingClientRect();
                 const gameRect = gameArea.getBoundingClientRect();
                 player.element.style.position = 'absolute';
                 player.element.style.left = `${homeRect.left - gameRect.left + homeRect.width / 2}px`;
                 player.element.style.top = `${homeRect.top - gameRect.top + homeRect.height / 2}px`;
                  player.element.style.width = '20px'; // Smaller size for home area
                  player.element.style.height = '25px';
                  player.element.style.transform = 'translate(-50%, -50%) rotate(0deg)'; // Reset rotation/centering for home
             } else {
                 player.element.style.top = '-30px';
                 player.element.style.left = `${10 + (player.id-1) * 10}%`;
                 player.element.style.transform = 'translate(-50%, -50%) rotate(0deg)'; // Reset rotation/centering
             }
        } else {
            const squareElement = squareElements[targetSquare];
            if (!squareElement) {
                 console.error(`Square element ${targetSquare} not found!`);
                 return;
            }

            const boardRect = boardContainer.getBoundingClientRect();
            const squareRect = squareElement.getBoundingClientRect();
            const squareCenterX = squareRect.left - boardRect.left + squareRect.width / 2;
            const squareCenterY = squareRect.top - boardRect.top + squareRect.height / 2;

            const pieceWidth = squareRect.width * 0.6;
            const pieceHeight = squareRect.height * 0.7;
            player.element.style.width = `${pieceWidth}px`;
            player.element.style.height = `${pieceHeight}px`;

            const piecesOnSquare = players.filter(p => p.position === targetSquare);
            const pieceIndex = piecesOnSquare.findIndex(p => p.id === player.id);
            const offsetFactor = 0.15;
            let offsetX = 0;
            let offsetY = 0;

            if (piecesOnSquare.length > 1) {
                 offsetX = (pieceIndex % 2 === 0 ? -1 : 1) * (Math.floor(pieceIndex / 2) + 0.5) * offsetFactor * squareRect.width;
                 offsetY = (pieceIndex % 2 === 1 ? -1 : 1) * (Math.floor(pieceIndex / 2) + 0.5) * offsetFactor * squareRect.height;
            }

            player.element.style.left = `${squareCenterX + offsetX}px`;
            player.element.style.top = `${squareCenterY + offsetY}px`;
            player.element.style.position = 'absolute';
            // Re-apply teardrop transform if it was reset
             player.element.style.transform = 'translate(-50%, -50%) rotate(-45deg)';

        }
    }

    function switchPlayer() {
         if (players[currentPlayerIndex]) {
            players[currentPlayerIndex].element.style.transition = 'top 0.3s ease-in-out, left 0.3s ease-in-out';
         }

        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        updateActivePlayerUI();
        setMessage(`${players[currentPlayerIndex].name}'s turn. Click the dice!`);
        canRoll = true;
    }

    function updateActivePlayerUI() {
        players.forEach((player, index) => {
            if (player.infoBox) {
                if (index === currentPlayerIndex) {
                    player.infoBox.classList.add('active-player');
                } else {
                    player.infoBox.classList.remove('active-player');
                }
            }
        });
    }

    function setMessage(msg) {
        messageArea.textContent = msg;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    // --- Initial Setup ---
    gameArea.style.opacity = '0';
    startScreen.classList.add('active');

}); // End DOMContentLoaded