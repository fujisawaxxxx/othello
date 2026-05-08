const boardElement = document.getElementById('board');
const blackScoreElement = document.getElementById('black-score');
const whiteScoreElement = document.getElementById('white-score');
const turnElement = document.querySelector('#game-info p:first-child');

const boardSize = 8;
let board = []; // 0: empty, 1: black, 2: white
let currentPlayer = 1; // 1: black, 2: white

// --- AI Enhancement: Weight Map ---
const weights = [
    [120, -20, 20,  5,  5, 20, -20, 120],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [ 20,  -5, 15,  3,  3, 15,  -5,  20],
    [  5,  -5,  3,  3,  3,  3,  -5,   5],
    [  5,  -5,  3,  3,  3,  3,  -5,   5],
    [ 20,  -5, 15,  3,  3, 15,  -5,  20],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [120, -20, 20,  5,  5, 20, -20, 120]
];

function initGame() {
    board = Array(boardSize).fill(0).map(() => Array(boardSize).fill(0));
    board[3][3] = 2; // white
    board[3][4] = 1; // black
    board[4][3] = 1; // black
    board[4][4] = 2; // white
    currentPlayer = 1;
    renderBoard();
    updateScore();
    turnElement.textContent = 'あなたの番です';
}

function renderBoard() {
    boardElement.innerHTML = '';
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            // Add hover effect for valid moves for the player
            if (currentPlayer === 1 && isValidMove(board, row, col, 1)) {
                cell.classList.add('valid-move');
            }
            cell.addEventListener('click', handleCellClick);

            const disc = document.createElement('div');
            disc.className = 'disc';

            if (board[row][col] === 1) {
                disc.classList.add('black');
                cell.appendChild(disc);
            } else if (board[row][col] === 2) {
                disc.classList.add('white');
                cell.appendChild(disc);
            }
            boardElement.appendChild(cell);
        }
    }
}

function handleCellClick(event) {
    if (currentPlayer !== 1) return; // Not player's turn

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    if (isValidMove(board, row, col, currentPlayer)) {
        const newBoard = cloneBoard(board);
        newBoard[row][col] = currentPlayer;
        flipDiscs(newBoard, row, col, currentPlayer);
        board = newBoard; // Update the main board

        renderBoard();
        updateScore();

        // Check for game over
        if (getValidMoves(board, 1).length === 0 && getValidMoves(board, 2).length === 0) {
            endGame();
            return;
        }

        currentPlayer = 2;
        turnElement.textContent = 'CPUが考え中... (激ムズ)';
        // Remove hover effects while CPU is thinking
        renderBoard(); 

        setTimeout(cpuTurn, 10); // Start CPU turn immediately after UI updates
    }
}

// --- Refactored functions to accept a board state ---

function isValidMove(currentBoard, row, col, player) {
    if (row < 0 || row >= boardSize || col < 0 || col >= boardSize || currentBoard[row][col] !== 0) {
        return false;
    }

    const opponent = player === 1 ? 2 : 1;

    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;

            let r = row + dr;
            let c = col + dc;
            let foundOpponent = false;

            while (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
                if (currentBoard[r][c] === opponent) {
                    foundOpponent = true;
                } else if (currentBoard[r][c] === player) {
                    if (foundOpponent) return true;
                    break;
                } else { // Empty cell
                    break;
                }
                r += dr;
                c += dc;
            }
        }
    }
    return false;
}

function flipDiscs(currentBoard, row, col, player) {
    const opponent = player === 1 ? 2 : 1;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;

            let r = row + dr;
            let c = col + dc;
            const discsToFlip = [];

            while (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
                if (currentBoard[r][c] === 0) {
                    break;
                }
                if (currentBoard[r][c] === opponent) {
                    discsToFlip.push({ r, c });
                } else if (currentBoard[r][c] === player) {
                    for (const disc of discsToFlip) {
                        currentBoard[disc.r][disc.c] = player;
                    }
                    break;
                }
                r += dr;
                c += dc;
            }
        }
    }
}

function getValidMoves(currentBoard, player) {
    const validMoves = [];
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            if (isValidMove(currentBoard, row, col, player)) {
                validMoves.push({ row, col });
            }
        }
    }
    return validMoves;
}

function updateScore() {
    let blackScore = 0;
    let whiteScore = 0;
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            if (board[row][col] === 1) blackScore++;
            else if (board[row][col] === 2) whiteScore++;
        }
    }
    blackScoreElement.textContent = blackScore;
    whiteScoreElement.textContent = whiteScore;
}

function endGame() {
    const blackScore = parseInt(blackScoreElement.textContent);
    const whiteScore = parseInt(whiteScoreElement.textContent);
    let message = 'ゲーム終了！ ';
    if (blackScore > whiteScore) {
        message += 'あなたの勝ちです！';
    } else if (whiteScore > blackScore) {
        message += 'CPUの勝ちです！';
    } else {
        message += '引き分けです！';
    }
    turnElement.textContent = message;
    currentPlayer = 0; // Game over
}

// --- AI LOGIC ---

function getEmptyCellsCount(currentBoard) {
    let count = 0;
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (currentBoard[r][c] === 0) count++;
        }
    }
    return count;
}

function cloneBoard(currentBoard) {
    const newBoard = [];
    for (let r = 0; r < boardSize; r++) {
        newBoard.push([...currentBoard[r]]);
    }
    return newBoard;
}

function cpuTurn() {
    // Player is 2 (white)
    const validMoves = getValidMoves(board, 2);

    if (validMoves.length === 0) {
        // CPU must pass
        turnElement.textContent = 'CPUはパスしました。あなたの番です。';
        currentPlayer = 1;
        renderBoard(); // To show new valid moves for player
        // Check if player also has to pass
        if (getValidMoves(board, 1).length === 0) {
            endGame();
        }
        return;
    }

    // Dynamically adjust search depth based on empty cells
    const emptyCells = getEmptyCellsCount(board);
    let searchDepth = 7; // Extremely strong depth
    if (emptyCells <= 12) {
        searchDepth = 12; // Solve exactly to the end
    } else if (emptyCells <= 16) {
        searchDepth = 8;
    } else if (emptyCells >= 50) {
        searchDepth = 6; // Faster in the very beginning
    }

    // Use a tiny timeout to allow the browser to render the "CPU is thinking" message
    setTimeout(() => {
        // Minimax to find the best move
        const bestMove = findBestMove(board, searchDepth);

        if (bestMove) {
            board[bestMove.row][bestMove.col] = 2;
            flipDiscs(board, bestMove.row, bestMove.col, 2);
        }

        renderBoard();
        updateScore();

        // Check for game over
        if (getValidMoves(board, 1).length === 0 && getValidMoves(board, 2).length === 0) {
            endGame();
            return;
        }

        currentPlayer = 1;
        turnElement.textContent = 'あなたの番です';

        // If player has no moves, CPU plays again
        if (getValidMoves(board, 1).length === 0) {
            turnElement.textContent = 'あなたはパスしました。CPUの番です。';
            renderBoard();
            setTimeout(cpuTurn, 1000);
            return;
        }
        
        renderBoard(); // To show new valid moves for player
    }, 10);
}

function findBestMove(currentBoard, depth) {
    let bestScore = -Infinity;
    let bestMove = null;
    const validMoves = getValidMoves(currentBoard, 2);
    
    // Sort moves to improve Alpha-Beta pruning efficiency
    validMoves.sort((a, b) => weights[b.row][b.col] - weights[a.row][a.col]);

    for (const move of validMoves) {
        const newBoard = cloneBoard(currentBoard);
        newBoard[move.row][move.col] = 2;
        flipDiscs(newBoard, move.row, move.col, 2);
        const score = minimax(newBoard, depth - 1, false, -Infinity, Infinity);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return bestMove;
}

function minimax(currentBoard, depth, maximizingPlayer, alpha, beta) {
    const player = maximizingPlayer ? 2 : 1;
    const opponent = maximizingPlayer ? 1 : 2;
    const myValidMoves = getValidMoves(currentBoard, player);
    const oppValidMoves = getValidMoves(currentBoard, opponent);

    // Check game over
    if (myValidMoves.length === 0 && oppValidMoves.length === 0) {
        let blackScore = 0;
        let whiteScore = 0;
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (currentBoard[r][c] === 1) blackScore++;
                else if (currentBoard[r][c] === 2) whiteScore++;
            }
        }
        if (whiteScore > blackScore) return 10000 + whiteScore; // CPU Win
        if (blackScore > whiteScore) return -10000 - blackScore; // CPU Lose
        return 0; // Draw
    }

    if (depth === 0) {
        return evaluateBoard(currentBoard, maximizingPlayer ? myValidMoves.length : oppValidMoves.length, maximizingPlayer ? oppValidMoves.length : myValidMoves.length);
    }

    // Pass turn
    if (myValidMoves.length === 0) {
        return minimax(currentBoard, depth - 1, !maximizingPlayer, alpha, beta);
    }

    // Sort moves
    myValidMoves.sort((a, b) => weights[b.row][b.col] - weights[a.row][a.col]);

    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of myValidMoves) {
            const newBoard = cloneBoard(currentBoard);
            newBoard[move.row][move.col] = player;
            flipDiscs(newBoard, move.row, move.col, player);
            const evalScore = minimax(newBoard, depth - 1, false, alpha, beta);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) {
                break; // Beta cutoff
            }
        }
        return maxEval;
    } else { // Minimizing player
        let minEval = Infinity;
        for (const move of myValidMoves) {
            const newBoard = cloneBoard(currentBoard);
            newBoard[move.row][move.col] = player;
            flipDiscs(newBoard, move.row, move.col, player);
            const evalScore = minimax(newBoard, depth - 1, true, alpha, beta);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) {
                break; // Alpha cutoff
            }
        }
        return minEval;
    }
}

function evaluateBoard(currentBoard, cpuMobility, playerMobility) {
    let myScore = 0;
    let oppScore = 0;

    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            if (currentBoard[row][col] === 2) { // CPU
                myScore += weights[row][col];
            } else if (currentBoard[row][col] === 1) { // Player
                oppScore += weights[row][col];
            }
        }
    }
    
    // Evaluate mobility (number of valid moves)
    // Highly important for winning Othello
    if (cpuMobility !== undefined && playerMobility !== undefined) {
        myScore += cpuMobility * 15;
        oppScore += playerMobility * 15;
    }

    return myScore - oppScore; // Return score from CPU's perspective
}


initGame();
