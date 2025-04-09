// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Состояние игры
const gameState = {
    balance: 1000,
    cryptoBalance: 0,
    ownedBusinesses: [],
    characterStatus: "Уличный хулиган",
    businesses: [
        { id: "slot-machine", name: "Игровой автомат", price: 1000, income: 50, cryptoIncome: 0, unlocked: true, owned: false },
        { id: "casino", name: "Казино", price: 10000, income: 500, cryptoIncome: 0, unlocked: false, owned: false },
        { id: "crypto-farm", name: "Крипто-ферма", price: 50000, income: 0, cryptoIncome: 0.001, unlocked: false, owned: false }
    ],
    lastUpdate: Date.now()
};

// DOM элементы
const balanceElement = document.getElementById('balance');
const cryptoBalanceElement = document.getElementById('crypto-balance');
const characterStatusElement = document.querySelector('.character-status');
const businessElements = document.querySelectorAll('.business');
const buyButtons = document.querySelectorAll('.buy-btn');
const tabButtons = document.querySelectorAll('.tab-btn');

// Инициализация игры
function initGame() {
    updateUI();
    setupEventListeners();
    loadGame();
    startGameLoop();
}

// Обновление интерфейса
function updateUI() {
    balanceElement.textContent = `$${gameState.balance.toLocaleString()}`;
    cryptoBalanceElement.textContent = `${gameState.cryptoBalance.toFixed(6)} BTC`;
    characterStatusElement.textContent = gameState.characterStatus;
    
    gameState.businesses.forEach(business => {
        const businessElement = document.querySelector(`.business[data-id="${business.id}"]`);
        if (businessElement) {
            const priceElement = businessElement.querySelector('p:nth-of-type(2)');
            const button = businessElement.querySelector('.buy-btn');
            
            if (business.owned) {
                button.textContent = 'Куплено';
                button.disabled = true;
                button.style.backgroundColor = '#b2b2b2';
                businessElement.classList.add('owned');
            } else {
                button.disabled = gameState.balance < business.price || !business.unlocked;
            }
            
            // Разблокируем следующий бизнес, если текущий куплен
            if (business.owned) {
                unlockNextBusiness(business.id);
            }
        }
    });
    
    // Обновляем статус персонажа в зависимости от дохода
    updateCharacterStatus();
}

// Разблокировка следующего бизнеса
function unlockNextBusiness(currentBusinessId) {
    const businessIndex = gameState.businesses.findIndex(b => b.id === currentBusinessId);
    if (businessIndex >= 0 && businessIndex < gameState.businesses.length - 1) {
        const nextBusiness = gameState.businesses[businessIndex + 1];
        nextBusiness.unlocked = true;
        
        const nextBusinessElement = document.querySelector(`.business[data-id="${nextBusiness.id}"]`);
        if (nextBusinessElement) {
            nextBusinessElement.classList.remove('locked');
            const button = nextBusinessElement.querySelector('.buy-btn');
            button.disabled = gameState.balance < nextBusiness.price;
        }
    }
}

// Обновление статуса персонажа
function updateCharacterStatus() {
    const totalIncome = calculateTotalIncome();
    
    if (totalIncome >= 1000) {
        gameState.characterStatus = "Крипто-предприниматель";
    } else if (totalIncome >= 500) {
        gameState.characterStatus = "Владелец казино";
    } else if (totalIncome >= 50) {
        gameState.characterStatus = "Владелец автоматов";
    } else {
        gameState.characterStatus = "Уличный хулиган";
    }
}

// Расчет общего дохода
function calculateTotalIncome() {
    return gameState.businesses
        .filter(b => b.owned)
        .reduce((total, business) => total + business.income, 0);
}

// Настройка обработчиков событий
function setupEventListeners() {
    buyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const businessElement = this.closest('.business');
            const businessId = businessElement.dataset.id;
            buyBusiness(businessId);
        });
    });
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            switchTab(tabId);
        });
    });
}

// Покупка бизнеса
function buyBusiness(businessId) {
    const business = gameState.businesses.find(b => b.id === businessId);
    
    if (business && !business.owned && gameState.balance >= business.price) {
        gameState.balance -= business.price;
        business.owned = true;
        gameState.ownedBusinesses.push(businessId);
        
        // Обновляем UI
        updateUI();
        
        // Сохраняем игру
        saveGame();
        
        // Показываем анимацию
        const businessElement = document.querySelector(`.business[data-id="${businessId}"]`);
        businessElement.classList.add('new-item');
        setTimeout(() => {
            businessElement.classList.remove('new-item');
        }, 1000);
    }
}

// Переключение вкладок
function switchTab(tabId) {
    // В этой версии просто меняем активную кнопку
    tabButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    
    // Здесь можно добавить логику для отображения разных разделов
    console.log(`Переключено на вкладку: ${tabId}`);
}

// Игровой цикл
function startGameLoop() {
    setInterval(() => {
        const now = Date.now();
        const timePassed = (now - gameState.lastUpdate) / 1000 / 60 / 60; // в часах
        
        if (timePassed > 0) {
            // Начисляем доход
            gameState.businesses.forEach(business => {
                if (business.owned) {
                    gameState.balance += business.income * timePassed;
                    gameState.cryptoBalance += business.cryptoIncome * timePassed;
                }
            });
            
            gameState.lastUpdate = now;
            updateUI();
            saveGame();
        }
    }, 1000); // Проверяем каждую секунду
}

// Сохранение игры
function saveGame() {
    localStorage.setItem('cryptoStartupTycoon', JSON.stringify(gameState));
}

// Загрузка игры
function loadGame() {
    const savedGame = localStorage.getItem('cryptoStartupTycoon');
    if (savedGame) {
        const parsedGame = JSON.parse(savedGame);
        Object.assign(gameState, parsedGame);
        
        // Обновляем разблокировку бизнесов в UI
        gameState.businesses.forEach(business => {
            if (business.unlocked) {
                const businessElement = document.querySelector(`.business[data-id="${business.id}"]`);
                if (businessElement) {
                    businessElement.classList.remove('locked');
                }
            }
        });
    }
}

// Запуск игры при загрузке страницы
document.addEventListener('DOMContentLoaded', initGame);