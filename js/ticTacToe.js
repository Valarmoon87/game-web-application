// js/ticTacToe.js
document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.cell');
    const statusText = document.getElementById('status');
    const restartBtn = document.getElementById('restart-btn');
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    let options = ["", "", "", "", "", "", "", "", ""];
    let currentPlayer = "X";
    let running = false;
    let xpAward = 100;
    let sessionScores = { you: 0, ai: 0, draw: 0 };

    function updateScoreDisplay() {
        const sy = document.getElementById('score-you');
        const sd = document.getElementById('score-draw');
        const sa = document.getElementById('score-ai');
        if(sy) sy.textContent = sessionScores.you;
        if(sd) sd.textContent = sessionScores.draw;
        if(sa) sa.textContent = sessionScores.ai;
    }
    
    const xIcon = '<i class="fas fa-network-wired"></i>';
    const oIcon = '<i class="fas fa-bug"></i>';

    function initGame(){
        cells.forEach(cell => cell.addEventListener('click', cellClicked));
        restartBtn.addEventListener('click', restartGame);
        statusText.innerHTML = `Your Turn (${xIcon})`;
        running = true;
    }

    function cellClicked(){
        const cellIndex = this.getAttribute("data-index");

        if(options[cellIndex] != "" || !running || currentPlayer !== "X"){
            return;
        }

        updateCell(this, cellIndex);
        checkWinner();
        
        if(running) {
            currentPlayer = "O";
            statusText.innerHTML = `AI Processing (${oIcon})...`;
            setTimeout(aiMove, 600);
        }
    }

    function updateCell(cell, index){
        options[index] = currentPlayer;
        cell.innerHTML = currentPlayer === "X" ? xIcon : oIcon;
        cell.classList.add(currentPlayer === "X" ? 'x-marker' : 'o-marker');
        playSound('click');
    }

    function aiMove() {
        if(!running) return;
        
        const difficulty = document.getElementById('diff-select').value;
        let move;

        if (difficulty === 'easy') {
            move = getRandomMove();
        } else if (difficulty === 'medium') {
            move = getTacticalMove();
        } else {
            move = getBestMove(); // Hard (Minimax)
        }

        if (move !== null && move !== undefined) {
            const cell = document.querySelector(`.cell[data-index="${move}"]`);
            updateCell(cell, move);
            checkWinner();
            
            if(running) {
                currentPlayer = "X";
                statusText.innerHTML = `Your Turn (${xIcon})`;
            }
        }
    }

    function getRandomMove() {
        let emptyIndexes = options.map((opt, idx) => opt === "" ? idx : null).filter(val => val !== null);
        return emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
    }

    function getTacticalMove() {
        // 1. Try to win
        for (let i = 0; i < winConditions.length; i++) {
            const [a, b, c] = winConditions[i];
            if (options[a] === "O" && options[b] === "O" && options[c] === "") return c;
            if (options[a] === "O" && options[c] === "O" && options[b] === "") return b;
            if (options[b] === "O" && options[c] === "O" && options[a] === "") return a;
        }
        // 2. Block player
        for (let i = 0; i < winConditions.length; i++) {
            const [a, b, c] = winConditions[i];
            if (options[a] === "X" && options[b] === "X" && options[c] === "") return c;
            if (options[a] === "X" && options[c] === "X" && options[b] === "") return b;
            if (options[b] === "X" && options[c] === "X" && options[a] === "") return a;
        }
        // 3. Random
        return getRandomMove();
    }

    function getBestMove() {
        let bestScore = -Infinity;
        let move;
        for (let i = 0; i < options.length; i++) {
            if (options[i] === "") {
                options[i] = "O";
                let score = minimax(options, 0, false);
                options[i] = "";
                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }
        return move;
    }

    const scores = { O: 1, X: -1, tie: 0 };

    function minimax(board, depth, isMaximizing) {
        let result = checkWinStatus();
        if (result !== null) return scores[result];

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === "") {
                    board[i] = "O";
                    let score = minimax(board, depth + 1, false);
                    board[i] = "";
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === "") {
                    board[i] = "X";
                    let score = minimax(board, depth + 1, true);
                    board[i] = "";
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    function checkWinStatus() {
        for (let i = 0; i < winConditions.length; i++) {
            const [a, b, c] = winConditions[i];
            if (options[a] && options[a] === options[b] && options[a] === options[c]) {
                return options[a];
            }
        }
        if (!options.includes("")) return 'tie';
        return null;
    }

    function checkWinner(){
        let roundWon = false;
        let winNodes = [];

        for(let i=0; i<winConditions.length; i++){
            const condition = winConditions[i];
            const cellA = options[condition[0]];
            const cellB = options[condition[1]];
            const cellC = options[condition[2]];

            if(cellA == "" || cellB == "" || cellC == ""){
                continue;
            }
            if(cellA == cellB && cellB == cellC){
                roundWon = true;
                winNodes = condition;
                break;
            }
        }

        if(roundWon){
            statusText.textContent = `${currentPlayer === "X" ? "Security Admin" : "Rogue AI"} WINS!`;
            running = false;
            
            winNodes.forEach(idx => {
                document.querySelector(`.cell[data-index="${idx}"]`).classList.add('winning-cell');
            });

            if(currentPlayer === "X") {
                // User Won
                sessionScores.you++;
                updateScoreDisplay();
                awardXP(xpAward, 'tictactoe', 1);
                setTimeout(() => showMissionComplete(1, xpAward, "Tic Tac Toe"), 1000);
            } else {
                sessionScores.ai++;
                updateScoreDisplay();
                playSound('error');
            }
        } else if(!options.includes("")){
            statusText.textContent = "Draw! System Stalemate.";
            running = false;
            sessionScores.draw++;
            updateScoreDisplay();
            awardXP(20, 'tictactoe', 0.5);
            setTimeout(() => showMissionComplete(0.5, 20, "Tic Tac Toe"), 1000);
        }
    }

    function restartGame(){
        currentPlayer = "X";
        options = ["", "", "", "", "", "", "", "", ""];
        statusText.innerHTML = `Your Turn (${xIcon})`;
        cells.forEach(cell => {
            cell.innerHTML = "";
            cell.className = "cell";
        });
        running = true;
    }

    initGame();
});
