class Nonogram {
    constructor(size = 5) {
        this.size = size;
        this.grid = Array(size).fill().map(() => Array(size).fill(false));
        this.marks = Array(size).fill().map(() => Array(size).fill(false)); // Çarpı işaretlerini takip etmek için
        this.solution = this.generateRandomSolution();
        this.rowHints = this.generateRowHints();
        this.colHints = this.generateColHints();
        this.startTime = null;
        this.timerInterval = null;
        this.isDragging = false;
        this.dragMode = null;
        this.lives = 3;
        this.mistakes = 0;
        this.autoFillEnabled = true;
        this.markMode = false; 
        this.gameStarted = false;
        this.initializeGame();
    }

    generateRandomSolution() {
        return Array(this.size).fill().map(() => 
            Array(this.size).fill().map(() => Math.random() < 0.5)
        );
    }

    generateRowHints() {
        return this.solution.map(row => {
            const hints = [];
            let count = 0;
            for (let i = 0; i <= row.length; i++) {
                if (i < row.length && row[i]) {
                    count++;
                } else if (count > 0) {
                    hints.push(count);
                    count = 0;
                }
            }
            return hints.length ? hints : [0];
        });
    }

    generateColHints() {
        const hints = [];
        for (let col = 0; col < this.size; col++) {
            const colHints = [];
            let count = 0;
            for (let row = 0; row <= this.size; row++) {
                if (row < this.size && this.solution[row][col]) {
                    count++;
                } else if (count > 0) {
                    colHints.push(count);
                    count = 0;
                }
            }
            hints.push(colHints.length ? colHints : [0]);
        }
        return hints;
    }

    initializeGame() {
        this.createGrid();
        this.createHints();
        this.addEventListeners();
        // Remove startTimer() from here
    }

    createGrid() {
        const grid = document.querySelector('.grid');
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        
        // 5x5'lik bölmeler için sınıf ekle
        grid.className = 'grid' + (this.size > 5 ? ' large' : '') + ` size-${this.size}`;

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                grid.appendChild(cell);
            }
        }
    }

    createHints() {
        const rowHints = document.querySelector('.row-hints');
        const colHints = document.querySelector('.col-hints');
        rowHints.innerHTML = '';
        colHints.innerHTML = '';
        colHints.style.gridTemplateColumns = `repeat(${this.size}, 50px)`;

        // Row hints
        this.rowHints.forEach(hints => {
            const hintDiv = document.createElement('div');
            hintDiv.className = 'hint';
            hintDiv.textContent = hints.join(' ');
            rowHints.appendChild(hintDiv);
        });

        // Column hints - sayıları alt alta yaz
        this.colHints.forEach(hints => {
            const hintDiv = document.createElement('div');
            hintDiv.className = 'hint';
            hintDiv.textContent = hints.join('\n');
            colHints.appendChild(hintDiv);
        });
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.startTime = Date.now();
        const timerElement = document.getElementById('timer');
        
        this.timerInterval = setInterval(() => {
            const currentTime = Date.now();
            const elapsedTime = Math.floor((currentTime - this.startTime) / 1000);
            const minutes = Math.floor(elapsedTime / 60);
            const seconds = elapsedTime % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    addEventListeners() {
        const grid = document.querySelector('.grid');
        
        // Touch events for mobile
        grid.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('cell')) {
                this.isDragging = true;
                const cell = e.target;
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);

                if (this.markMode) {
                    // Mark mode (X)
                    if (!cell.classList.contains('filled')) {
                        if (this.checkMove(row, col, false, true)) {
                            if (!this.gameStarted) {
                                this.gameStarted = true;
                                this.startTimer();
                            }
                            this.dragMode = 'mark';
                            cell.classList.add('marked');
                            this.marks[row][col] = true;
                        }
                    }
                } else {
                    // Fill mode
                    if (!cell.classList.contains('marked')) {
                        if (this.checkMove(row, col, true, false)) {
                            if (!this.gameStarted) {
                                this.gameStarted = true;
                                this.startTimer();
                            }
                            this.dragMode = 'fill';
                            this.grid[row][col] = true;
                            cell.classList.add('filled');
                            
                            if (this.isGameComplete()) {
                                this.handleGameComplete();
                            }
                        }
                    }
                }
            }
        });

        grid.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDragging) {
                const touch = e.touches[0];
                const cell = document.elementFromPoint(touch.clientX, touch.clientY);
                
                if (cell && cell.classList.contains('cell')) {
                    const row = parseInt(cell.dataset.row);
                    const col = parseInt(cell.dataset.col);

                    if (this.markMode) {
                        if (!cell.classList.contains('filled')) {
                            if (this.checkMove(row, col, false, true)) {
                                cell.classList.add('marked');
                                this.marks[row][col] = true;
                            }
                        }
                    } else {
                        if (!cell.classList.contains('marked')) {
                            if (this.checkMove(row, col, true, false)) {
                                this.grid[row][col] = true;
                                cell.classList.add('filled');
                                
                                if (this.isGameComplete()) {
                                    this.handleGameComplete();
                                }
                            }
                        }
                    }
                }
            }
        });

        grid.addEventListener('touchend', () => {
            this.isDragging = false;
            this.dragMode = null;
        });

        grid.addEventListener('touchcancel', () => {
            this.isDragging = false;
            this.dragMode = null;
        });

        grid.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('cell')) {
                e.preventDefault();
                this.isDragging = true;
                
                if (e.button === 2) { // Sağ tık
                    const row = parseInt(e.target.dataset.row);
                    const col = parseInt(e.target.dataset.col);
                    
                    if (e.target.classList.contains('marked')) {
                        this.dragMode = 'unmark';
                        e.target.classList.remove('marked');
                        this.marks[row][col] = false;
                    } else if (!e.target.classList.contains('filled')) {
                        if (this.checkMove(row, col, false, true)) {
                            this.dragMode = 'mark';
                            e.target.classList.add('marked');
                            this.marks[row][col] = true;
                        }
                    }
                } else if (e.button === 0) { // Sol tık
                    const row = parseInt(e.target.dataset.row);
                    const col = parseInt(e.target.dataset.col);
                    
                    if (e.target.classList.contains('filled')) {
                        this.dragMode = 'unfill';
                        this.grid[row][col] = false;
                        e.target.classList.remove('filled');
                    } else if (!e.target.classList.contains('marked')) {
                        if (this.checkMove(row, col, true, false)) {
                            if (!this.gameStarted) {
                                this.gameStarted = true;
                                this.startTimer();
                            }
                            this.dragMode = 'fill';
                            this.grid[row][col] = true;
                            e.target.classList.add('filled');
                            
                            if (this.isGameComplete()) {
                                this.handleGameComplete();
                            }
                        }
                    }
                }
            }
        });

        grid.addEventListener('mouseover', (e) => {
            if (this.isDragging && e.target.classList.contains('cell')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);

                if (this.dragMode === 'mark' && !e.target.classList.contains('filled')) {
                    if (this.checkMove(row, col, false, true)) {
                        e.target.classList.add('marked');
                        this.marks[row][col] = true;
                    }
                } else if (this.dragMode === 'unmark') {
                    e.target.classList.remove('marked');
                    this.marks[row][col] = false;
                } else if (this.dragMode === 'fill' && !e.target.classList.contains('marked')) {
                    if (this.checkMove(row, col, true, false)) {
                        this.grid[row][col] = true;
                        e.target.classList.add('filled');
                        
                        if (this.isGameComplete()) {
                            this.handleGameComplete();
                        }
                    }
                } else if (this.dragMode === 'unfill') {
                    this.grid[row][col] = false;
                    e.target.classList.remove('filled');
                }
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.dragMode = null;
        });

        grid.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        document.getElementById('newGame').addEventListener('click', () => this.newGame());
        document.getElementById('clearGrid').addEventListener('click', () => this.clearGrid());
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.size = parseInt(e.target.value);
            this.newGame();
        });
        
        // Mark mode toggle event listener
        document.getElementById('markModeToggle').addEventListener('change', (e) => {
            this.markMode = e.target.checked;
        });

        // Add auto-fill toggle listener
        document.getElementById('autoFillToggle').addEventListener('change', (e) => {
            this.autoFillEnabled = e.target.checked;
        });
    }

    checkAndAutoComplete() {
        let completed = false;

        // Satırları kontrol et
        for (let i = 0; i < this.size; i++) {
            const groups = this.findFilledGroups(i, true); // Dolu grupları bul
            const hints = this.rowHints[i];
            
            // Satırdaki toplam dolu hücre sayısını hesapla
            let totalFilled = 0;
            let totalMarked = 0;
            let emptyPositions = [];
            
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j]) totalFilled++;
                if (this.marks[i][j]) totalMarked++;
                if (!this.grid[i][j] && !this.marks[i][j]) emptyPositions.push(j);
            }
            
            const totalHintsSum = hints.reduce((a, b) => a + b, 0);
            
            // Eğer ipucu sayısı kadar dolu hücre varsa, geri kalanları çarpı yap
            if (totalFilled === totalHintsSum && emptyPositions.length > 0) {
                for (let j of emptyPositions) {
                    this.marks[i][j] = true;
                    const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                    cell.classList.add('marked', 'auto-completed');
                    completed = true;
                }
            }
            
            // Eğer boş kalan yer sayısı, kalan doldurulması gereken hücre sayısı kadar ise
            if (emptyPositions.length > 0 && totalFilled < totalHintsSum) {
                const remainingToFill = totalHintsSum - totalFilled;
                if (emptyPositions.length === remainingToFill) {
                    for (let j of emptyPositions) {
                        this.grid[i][j] = true;
                        const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                        cell.classList.add('filled', 'auto-completed');
                        completed = true;
                    }
                }
            }
        }

        // Sütunları kontrol et
        for (let j = 0; j < this.size; j++) {
            const groups = this.findFilledGroups(j, false);
            const hints = this.colHints[j];
            
            // Sütundaki toplam dolu hücre sayısını hesapla
            let totalFilled = 0;
            let totalMarked = 0;
            let emptyPositions = [];
            
            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j]) totalFilled++;
                if (this.marks[i][j]) totalMarked++;
                if (!this.grid[i][j] && !this.marks[i][j]) emptyPositions.push(i);
            }
            
            const totalHintsSum = hints.reduce((a, b) => a + b, 0);
            
            // Eğer ipucu sayısı kadar dolu hücre varsa, geri kalanları çarpı yap
            if (totalFilled === totalHintsSum && emptyPositions.length > 0) {
                for (let i of emptyPositions) {
                    this.marks[i][j] = true;
                    const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                    cell.classList.add('marked', 'auto-completed');
                    completed = true;
                }
            }
            
            // Eğer boş kalan yer sayısı, kalan doldurulması gereken hücre sayısı kadar ise
            if (emptyPositions.length > 0 && totalFilled < totalHintsSum) {
                const remainingToFill = totalHintsSum - totalFilled;
                if (emptyPositions.length === remainingToFill) {
                    for (let i of emptyPositions) {
                        this.grid[i][j] = true;
                        const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                        cell.classList.add('filled', 'auto-completed');
                        completed = true;
                    }
                }
            }
        }

        // Gruplar arası boşlukları doldur (önceki koddan)
        this.fillGapsBetweenGroups();

        if (completed) {
            // Otomatik tamamlanan hücrelerin efektini kaldır
            setTimeout(() => {
                document.querySelectorAll('.auto-completed').forEach(cell => {
                    cell.classList.remove('auto-completed');
                });
            }, 500);
            
            // Oyun bitti mi kontrol et
            if (this.isGameComplete()) {
                this.handleGameComplete();
            }
        }
    }

    fillGapsBetweenGroups() {
        // Satırları kontrol et
        for (let i = 0; i < this.size; i++) {
            const groups = this.findFilledGroups(i, true);
            const hints = this.rowHints[i];
            
            if (groups.length === hints.length) {
                let allMatch = true;
                for (let j = 0; j < groups.length; j++) {
                    if (groups[j].length !== hints[j]) {
                        allMatch = false;
                        break;
                    }
                }
                
                if (allMatch) {
                    // Gruplar arası boşlukları çarpı ile doldur
                    for (let j = 0; j < groups.length - 1; j++) {
                        const groupEnd = groups[j][groups[j].length - 1].col;
                        const nextGroupStart = groups[j + 1][0].col;
                        
                        for (let col = groupEnd + 1; col < nextGroupStart; col++) {
                            if (!this.marks[i][col] && !this.grid[i][col]) {
                                this.marks[i][col] = true;
                                const cell = document.querySelector(`[data-row="${i}"][data-col="${col}"]`);
                                cell.classList.add('marked', 'auto-completed');
                            }
                        }
                    }
                    
                    // Başlangıçtaki ve sondaki boşlukları da doldur
                    const firstGroupStart = groups[0][0].col;
                    const lastGroupEnd = groups[groups.length - 1][groups[groups.length - 1].length - 1].col;
                    
                    for (let col = 0; col < firstGroupStart; col++) {
                        if (!this.marks[i][col] && !this.grid[i][col]) {
                            this.marks[i][col] = true;
                            const cell = document.querySelector(`[data-row="${i}"][data-col="${col}"]`);
                            cell.classList.add('marked', 'auto-completed');
                        }
                    }
                    
                    for (let col = lastGroupEnd + 1; col < this.size; col++) {
                        if (!this.marks[i][col] && !this.grid[i][col]) {
                            this.marks[i][col] = true;
                            const cell = document.querySelector(`[data-row="${i}"][data-col="${col}"]`);
                            cell.classList.add('marked', 'auto-completed');
                        }
                    }
                }
            }
        }

        // Sütunları kontrol et (aynı mantık)
        for (let j = 0; j < this.size; j++) {
            const groups = this.findFilledGroups(j, false);
            const hints = this.colHints[j];
            
            if (groups.length === hints.length) {
                let allMatch = true;
                for (let i = 0; i < groups.length; i++) {
                    if (groups[i].length !== hints[i]) {
                        allMatch = false;
                        break;
                    }
                }
                
                if (allMatch) {
                    // Gruplar arası boşlukları çarpı ile doldur
                    for (let i = 0; i < groups.length - 1; i++) {
                        const groupEnd = groups[i][groups[i].length - 1].row;
                        const nextGroupStart = groups[i + 1][0].row;
                        
                        for (let row = groupEnd + 1; row < nextGroupStart; row++) {
                            if (!this.marks[row][j] && !this.grid[row][j]) {
                                this.marks[row][j] = true;
                                const cell = document.querySelector(`[data-row="${row}"][data-col="${j}"]`);
                                cell.classList.add('marked', 'auto-completed');
                            }
                        }
                    }
                    
                    // Başlangıçtaki ve sondaki boşlukları da doldur
                    const firstGroupStart = groups[0][0].row;
                    const lastGroupEnd = groups[groups.length - 1][groups[groups.length - 1].length - 1].row;
                    
                    for (let row = 0; row < firstGroupStart; row++) {
                        if (!this.marks[row][j] && !this.grid[row][j]) {
                            this.marks[row][j] = true;
                            const cell = document.querySelector(`[data-row="${row}"][data-col="${j}"]`);
                            cell.classList.add('marked', 'auto-completed');
                        }
                    }
                    
                    for (let row = lastGroupEnd + 1; row < this.size; row++) {
                        if (!this.marks[row][j] && !this.grid[row][j]) {
                            this.marks[row][j] = true;
                            const cell = document.querySelector(`[data-row="${row}"][data-col="${j}"]`);
                            cell.classList.add('marked', 'auto-completed');
                        }
                    }
                }
            }
        }
    }

    findFilledGroups(index, isRow) {
        const groups = [];
        let currentGroup = [];
        
        for (let i = 0; i < this.size; i++) {
            const isFilled = isRow ? this.grid[index][i] : this.grid[i][index];
            const pos = isRow ? {row: index, col: i} : {row: i, col: index};
            
            if (isFilled) {
                currentGroup.push(pos);
            } else if (currentGroup.length > 0) {
                groups.push(currentGroup);
                currentGroup = [];
            }
        }
        
        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }
        
        return groups;
    }

    checkMove(row, col, isAdding, isMarking) {
        if (isMarking) {
            if (this.solution[row][col]) {
                this.loseLife();
                return false;
            }
            this.marks[row][col] = true;
        } else if (isAdding && !this.solution[row][col]) {
            this.loseLife();
            return false;
        } else if (isAdding && this.autoFillEnabled) { // Add this condition
            setTimeout(() => this.checkAndAutoComplete(), 100);
        }
        return true;
    }

    loseLife() {
        this.lives--;
        const hearts = document.querySelectorAll('.heart');
        const heart = hearts[this.lives];
        
        // Kalbi gri yap ve salla
        heart.classList.add('lost');
        heart.classList.add('shake');
        
        // Sallama animasyonunu kaldır
        setTimeout(() => {
            heart.classList.remove('shake');
        }, 500);

        const message = document.getElementById('message');
        if (this.lives > 0) {
            message.textContent = `Hatalı hamle! ${this.lives} hakkınız kaldı.`;
            message.className = 'message error';
        } else {
            message.textContent = 'Hakkınız kalmadı! Oyun yeniden başlatılıyor...';
            message.className = 'message error';
            
            // Tüm hücreleri kırmızı yap
            document.querySelectorAll('.cell').forEach(cell => {
                if (cell.classList.contains('filled')) {
                    cell.classList.add('error');
                }
            });

            // 2 saniye bekleyip yeni oyun başlat
            setTimeout(() => {
                this.newGame();
            }, 2000);
        }
    }

    isGameComplete() {
        return this.grid.every((row, i) => 
            row.every((cell, j) => cell === this.solution[i][j])
        );
    }

    handleGameComplete() {
        clearInterval(this.timerInterval);
        const currentTime = document.getElementById('timer').textContent;
        const message = document.getElementById('message');
        message.textContent = `Tebrikler! Bulmacayı ${currentTime.replace('Süre: ', '')} sürede çözdünüz!`;
        message.className = 'message success';
    }

    newGame() {
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(false));
        this.marks = Array(this.size).fill().map(() => Array(this.size).fill(false));
        this.solution = this.generateRandomSolution();
        this.rowHints = this.generateRowHints();
        this.colHints = this.generateColHints();
        this.lives = 3;
        this.gameStarted = false;
        document.getElementById('message').classList.remove('message', 'error', 'success');
        document.getElementById('message').textContent = '';
        // Kalpleri sıfırla
        document.querySelectorAll('.heart').forEach(heart => {
            heart.classList.remove('lost', 'shake');
        });
        
        this.createGrid();
        this.createHints();
        // document.getElementById('message').textContent = '';
        // this.startTimer();
    }

    clearGrid() {
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(false));
        this.marks = Array(this.size).fill().map(() => Array(this.size).fill(false));
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('filled', 'marked');
        });
        document.getElementById('message').classList.remove('message', 'error', 'success');
        document.getElementById('message').textContent = '';
        this.lives = 3;
        
        // Kalpleri sıfırla
        document.querySelectorAll('.heart').forEach(heart => {
            heart.classList.remove('lost', 'shake');
        });
    }
}

// Oyunu başlat
document.addEventListener('DOMContentLoaded', () => {
    new Nonogram(5);
});
