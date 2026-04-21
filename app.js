// ====== FIREBASE SETUP ======
const firebaseConfig = {
    apiKey: "AIzaSyDvrNZ42sTCeGapeqEu1Y2es0z733TL6-U",
    authDomain: "arf-8892d.firebaseapp.com",
    databaseURL: "https://arf-8892d-default-rtdb.firebaseio.com",
    projectId: "arf-8892d",
    storageBucket: "arf-8892d.firebasestorage.app",
    messagingSenderId: "32427641278",
    appId: "1:32427641278:web:e3c4a52dec4dc72ce6d1ef",
    measurementId: "G-7HZYLMXD0W"
};

let db;
let useMock = false;

if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.warn("Firebase not set up! Online mode will run locally via mock unless you update config.");
    useMock = true;
} else {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
}


// ====== GLOBAL STATE ======

let lang = localStorage.getItem('harf_lang') || 'ar'; 
let theme = localStorage.getItem('harf_theme') || 'dark'; 
let currentMode = null; // 'local' or 'online'
let roomCode = null;
let isHost = false;
let myOnlineStars = 0;
let playerId = localStorage.getItem('harf_playerId') || Math.random().toString(36).substr(2, 9);
localStorage.setItem('harf_playerId', playerId);
let playerName = "";
let localWordReceivedTime = 0;
let lastSeenWordForTiming = "";
let buzzerPressed = false;

let localState = {
    targetStars: 5,
    team1Name: 'Team A',
    team1Stars: 0,
    team2Name: 'Team B',
    team2Stars: 0,
    currentWord: '',
    scrambledWord: ''
};

let onlineState = {
    status: 'idle', 
    currentWord: '',
    scrambledWord: '',
    hint: '',
    targetStars: 5,
    wrongAttempts: 0,
    currentBuzzer: null,
    winnerName: null
};

let playersList = {};

// Dictionary
const dictionary = {
    en: [
        { word: "ELEPHANT", hint: "Large animal with a trunk" },
        { word: "GUITAR", hint: "Musical instrument with 6 strings" },
        { word: "PYRAMID", hint: "Ancient Egyptian structure" },
        { word: "OCEAN", hint: "Large body of salt water" },
        { word: "UNIVERSE", hint: "All of space and time" },
        { word: "ASTRONAUT", hint: "Person who travels in space" },
        { word: "DIAMOND", hint: "Hard, precious gemstone" },
        { word: "VOLCANO", hint: "Mountain that erupts lava" },
        { word: "KANGAROO", hint: "Australian hopping animal" },
        { word: "CASTLE", hint: "Large fortified building" },
        { word: "CHOCOLATE", hint: "Sweet brown treat" },
        { word: "TORNADO", hint: "Violent rotating windstorm" },
        { word: "BUTTERFLY", hint: "Insect with colorful wings" },
        { word: "RAINBOW", hint: "Colors in the sky after rain" },
        { word: "AIRPLANE", hint: "Flying vehicle with wings" },
        { word: "PENGUIN", hint: "Flightless bird in ice" },
        { word: "TELESCOPE", hint: "Look at the stars" },
        { word: "DINOSAUR", hint: "Prehistoric giant reptile" },
        { word: "HOSPITAL", hint: "Place for sick people" },
        { word: "LIBRARY", hint: "A room full of books" },
        { word: "UMBRELLA", hint: "Protects from the rain" },
        { word: "BICYCLE", hint: "Two-wheeled pedal vehicle" },
        { word: "COMPUTER", hint: "Electronic calculating machine" },
        { word: "MICROSCOPE", hint: "Used to see tiny things" },
        { word: "CAMERA", hint: "Device to take pictures" },
        { word: "ORCHESTRA", hint: "Large group of musicians" },
        { word: "MOUNTAIN", hint: "Very tall land feature" },
        { word: "SUNFLOWER", hint: "Tall yellow flower" },
        { word: "SKELETON", hint: "Bones of a body" },
        { word: "VAMPIRE", hint: "Drinks blood in legends" },
        { word: "COMPASS", hint: "Shows north direction" },
        { word: "FIREWORKS", hint: "Colorful explosions in sky" },
        { word: "BASKETBALL", hint: "Sport with a hoop" },
        { word: "HELICOPTER", hint: "Aircraft with spinning rotors" },
        { word: "SUBMARINE", hint: "Underwater marine vessel" },
        { word: "PINEAPPLE", hint: "Tropical spiked fruit" },
        { word: "ALLIGATOR", hint: "Large reptile with teeth" },
        { word: "ISLAND", hint: "Land surrounded by water" },
        { word: "LUGGAGE", hint: "Bags for traveling" },
        { word: "AQUARIUM", hint: "Glass tank for fish" },
        { word: "CHAMPION", hint: "The winner of a game" },
        { word: "GALAXY", hint: "A system of stars" },
        { word: "SCIENTIST", hint: "Person who does experiments" },
        { word: "MAGNET", hint: "Attracts metal objects" },
        { word: "TREASURE", hint: "Hidden gold and gems" },
        { word: "MYSTERY", hint: "Something secretive to solve" },
        { word: "JOURNEY", hint: "A long trip" },
        { word: "WIZARD", hint: "A man with magical powers" },
        { word: "SHADOW", hint: "Dark shape cast by light" },
        { word: "SANDWICH", hint: "Food between two breads" }
    ],
    ar: [
        { word: "اسد", hint: "ملك الغابة" },
        { word: "خريطة", hint: "تستخدم لمعرفة الاتجاهات والأماكن" },
        { word: "سيف", hint: "سلاح أبيض قديم من الفولاذ" },
        { word: "تفاحة", hint: "فاكهة سقطت على نيوتن" },
        { word: "قطار", hint: "وسيلة نقل تسير على سكة حديد" },
        { word: "بركان", hint: "جبل تنفجر منه حمم نارية" },
        { word: "نظارة", hint: "تساعد في تحسين الرؤية" },
        { word: "سفينة", hint: "شراع أو محرك في وسط البحر" },
        { word: "بحر", hint: "مياه مالحة تغطي الأرض" },
        { word: "سيارة", hint: "أربع إطارات ومقود" },
        { word: "شجرة", hint: "جذع وفروع وأوراق" },
        { word: "حصان", hint: "يستخدم للفروسية والسباق" },
        { word: "كمبيوتر", hint: "جهاز إلكتروني يعالج البيانات" },
        { word: "مفتاح", hint: "يستخدم لفتح الأبواب" },
        { word: "شمس", hint: "نجم ساطع يضيء النهار" },
        { word: "قمر", hint: "ينير سماء الليل المظلمة" },
        { word: "طيارة", hint: "مركبة تحلق في السماء" },
        { word: "مستشفى", hint: "مكان علاج المرضى" },
        { word: "مكتبة", hint: "تحتوي على العديد من الكتب" },
        { word: "كتاب", hint: "صفحات تحتوي على المعرفة والقصص" },
        { word: "مدرسة", hint: "مكان لتلقي العلم" },
        { word: "صقر", hint: "طائر جارح حاد البصر" },
        { word: "ساعة", hint: "آلة لمعرفة الوقت" },
        { word: "مطبخ", hint: "المنطقة التي نصنع فيها الطعام" },
        { word: "نافذة", hint: "نطل منها على الشارع" },
        { word: "قلم", hint: "نستخدمه في الكتابة" },
        { word: "قهوة", hint: "مشروب صباحي مليء بالكافيين" },
        { word: "سرير", hint: "أثاث مخصص للنوم" },
        { word: "جبل", hint: "قمة عالية وتضاريس صخرية" },
        { word: "صحراء", hint: "مكان مليء بالرمال الحارة" },
        { word: "قصر", hint: "منزل فخم وكبير للملوك" },
        { word: "خيمة", hint: "مأوى نصنعه في التخييم" },
        { word: "سحاب", hint: "تتجمع في السماء لتسقط المطر" },
        { word: "شوكولاتة", hint: "حلوى بنية مفضلة للجميع" },
        { word: "هدية", hint: "مفاجأة توضع في صندوق" },
        { word: "وردة", hint: "نبات ذو رائحة جميلة ولون فاقع" },
        { word: "جسر", hint: "يعبر فوق النهر أو الوادي" },
        { word: "ملعب", hint: "مكان لممارسة كرة القدم" },
        { word: "مسجد", hint: "مكان عبادة المسلمين" },
        { word: "طبيب", hint: "يشخص الأمراض ويعالجها" },
        { word: "معلم", hint: "ينقل المعرفة للطلاب" },
        { word: "تمساح", hint: "زاحف برمائي بأسنان حادة" },
        { word: "عصفور", hint: "طائر صغير يغرد يومياً" },
        { word: "ثلاجة", hint: "تحافظ على برودة الطعام" },
        { word: "مظلة", hint: "تحميك من مياه المطر" },
        { word: "كاميرا", hint: "تستخدم لالتقاط الصور" },
        { word: "فيل", hint: "حيوان ضخم بخرطوم طويل" },
        { word: "قرد", hint: "يتسلق الأشجار ويحب الموز" },
        { word: "حقيبة", hint: "نحفظ ونحمل فيها الأشياء" },
        { word: "بطارية", hint: "تمنح الأجهزة الطاقة للعمل" }
    ]
};

const translations = {
    en: {
        welcome: "Welcome to Harf",
        gameDesc: "Select Game Mode",
        localModeBtn: "Local 2 Teams",
        onlineHostBtn: "Create Online Room",
        onlineJoinBtn: "Join with Code",
        team1: "Team 1 Name",
        team2: "Team 2 Name",
        targetStars: "Score to Win (3-10)",
        startGame: "Start Local Game",
        createHostReady: "Generate Room Code",
        joinGameReady: "Connect to Room",
        roomCodeDisplay: "Room Code:",
        scrambledWord: "Scrambled Word",
        originalWord: "Original:",
        scrambled: "Scrambled:",
        revealAnswer: "Reveal Answer",
        awardPoint: "Award Point To:",
        nextWord: "Next Word",
        revealHint: "Reveal Hint",
        whoBuzzed: "Who Buzzed?",
        correct: "Correct",
        wrong: "Wrong",
        players: "Players",
        buzz: "BUZZ!",
        winner: "WINNER!",
        playAgain: "Play Again / Close",
        hostDashboard: "Host Dashboard",
        waiting: "Waiting..."
    },
    ar: {
        welcome: "مرحباً في حرف",
        gameDesc: "اختر وضع اللعب",
        localModeBtn: "محلي: فريقين",
        onlineHostBtn: "إنشاء غرفة أونلاين",
        onlineJoinBtn: "انضمام بكود الغرفة",
        team1: "اسم الفريق الأول",
        team2: "اسم الفريق الثاني",
        targetStars: "النقاط للفوز (3-10)",
        startGame: "بدأ لعبة محلية",
        createHostReady: "توليد كود الغرفة",
        joinGameReady: "انضم للغرفة",
        roomCodeDisplay: "كود الغرفة:",
        scrambledWord: "الكلمة المبعثرة",
        originalWord: "الأصلية:",
        scrambled: "مبعثرة:",
        revealAnswer: "إظهار الإجابة",
        awardPoint: "إعطاء النقطة لـ:",
        nextWord: "الكلمة التالية",
        revealHint: "كشف التلميح",
        whoBuzzed: "من ضغط الزر؟",
        correct: "إجابة صحيحة",
        wrong: "خاطئة",
        players: "اللاعبين",
        buzz: "اضغط!",
        winner: "مبروك الفوز!",
        playAgain: "العب من جديد / إغلاق",
        hostDashboard: "لوحة تحكم المضيف",
        waiting: "في الانتظار..."
    }
};

const overlay = document.getElementById('celebration-overlay');

// ====== INITIALIZATION ======

function init() {
    applyTheme();
    applyLanguage();

    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('lang-toggle').addEventListener('click', toggleLanguage);

    // Setup mode selections
    document.getElementById('btn-select-local').addEventListener('click', () => toggleSetupPanel('local-setup-panel'));
    document.getElementById('btn-select-online-host').addEventListener('click', () => toggleSetupPanel('online-host-setup-panel'));
    document.getElementById('btn-select-online-join').addEventListener('click', () => toggleSetupPanel('online-join-setup-panel'));

    // Local
    document.getElementById('btn-start-local').addEventListener('click', startLocalGame);
    document.getElementById('btn-reveal').addEventListener('click', revealLocalAnswer);
    document.getElementById('btn-award-t1').addEventListener('click', () => awardLocalPoint('t1'));
    document.getElementById('btn-award-t2').addEventListener('click', () => awardLocalPoint('t2'));
    document.getElementById('btn-local-next-word').addEventListener('click', nextLocalWord);

    // Online
    document.getElementById('btn-join-player').addEventListener('click', joinOnlinePlayer);
    document.getElementById('btn-start-host').addEventListener('click', startOnlineHost);
    document.getElementById('btn-online-next-word').addEventListener('click', nextOnlineWord);
    document.getElementById('btn-reveal-hint').addEventListener('click', revealOnlineHint);
    document.getElementById('btn-correct').addEventListener('click', judgeOnlineCorrect);
    document.getElementById('btn-wrong').addEventListener('click', judgeOnlineWrong);
    
    const buzBtn = document.getElementById('btn-buzzer');
    buzBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if(!buzzerPressed) { buzzerPressed = true; buzzInOnline(); setTimeout(()=>buzzerPressed=false, 300); }
    }, {passive: false});
    buzBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if(!buzzerPressed) { buzzerPressed = true; buzzInOnline(); setTimeout(()=>buzzerPressed=false, 300); }
    });

    document.getElementById('btn-play-again').addEventListener('click', () => {
        overlay.classList.add('hidden');
        if (currentMode === 'local') {
            showView('view-setup');
        } else {
            // keep it simple, just hide overlay for online mode so they can start new word
        }
    });
}

// ====== COMMON UI FUNCTIONS ======

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    let v = document.getElementById(viewId);
    v.classList.remove('hidden');
    v.classList.add('active');
}

function toggleSetupPanel(id) {
    document.querySelectorAll('.setup-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function scramble(word) {
    let arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Using explicit non-breaking spaces ensures the browser renders the wide gaps
    return arr.join('\u00A0\u00A0\u00A0');
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = 'pixel-theme';
    const themeIcon = document.querySelector('#theme-toggle i');
    themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('harf_theme', theme);
    applyTheme();
}

function applyLanguage() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            if(el.tagName === 'INPUT' && el.type === 'text') {
                el.placeholder = translations[lang][key];
            } else {
                el.innerHTML = translations[lang][key];
            }
        }
    });

    if (currentMode === 'local') {
        document.getElementById('award-lbl-t1').innerText = localState.team1Name;
        document.getElementById('award-lbl-t2').innerText = localState.team2Name;
    }
}

function toggleLanguage() {
    lang = lang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('harf_lang', lang);
    applyLanguage();
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}

function createStarsHTML(count) {
    let html = '';
    for(let i=0; i<count; i++){
        html += '<img src="pixel_star.png" class="pixel-star" alt="star" />';
    }
    return html;
}

function showWinner(winnerName) {
    document.getElementById('winner-name-display').innerText = winnerName;
    overlay.classList.remove('hidden');
    
    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };

    var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        var particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));
    }, 250);
}

// ==========================================
// ====== LOCAL PARTY MODE (MODE 1) =========
// ==========================================

function startLocalGame() {
    const t1 = document.getElementById('team1-name').value.trim() || 'Team A';
    const t2 = document.getElementById('team2-name').value.trim() || 'Team B';
    const target = parseInt(document.getElementById('local-target-stars').value) || 5;

    currentMode = 'local';
    localState.team1Name = t1;
    localState.team2Name = t2;
    localState.targetStars = target;
    localState.team1Stars = 0;
    localState.team2Stars = 0;

    document.getElementById('score-t1-name').innerText = t1;
    document.getElementById('score-t2-name').innerText = t2;
    document.getElementById('award-lbl-t1').innerText = t1;
    document.getElementById('award-lbl-t2').innerText = t2;

    renderLocalStars('t1', 0);
    renderLocalStars('t2', 0);

    nextLocalWord();
    showView('view-local-game');
}

function nextLocalWord() {
    const list = dictionary[lang];
    const picked = list[Math.floor(Math.random() * list.length)];
    
    localState.currentWord = picked.word;
    localState.scrambledWord = scramble(picked.word);
    
    document.getElementById('local-scrambled').innerText = localState.scrambledWord;
    document.getElementById('local-answer').innerText = localState.currentWord;
    document.getElementById('local-answer-box').classList.add('hidden');
    document.getElementById('btn-reveal').classList.remove('hidden');
}

function revealLocalAnswer() {
    document.getElementById('local-answer-box').classList.remove('hidden');
    document.getElementById('btn-reveal').classList.add('hidden');
}

function renderLocalStars(team, count) {
    const container = document.getElementById(`stars-${team}`);
    container.innerHTML = createStarsHTML(count);
    if(count > 0) {
        const stars = container.querySelectorAll('.pixel-star');
        if(stars.length > 0) stars[stars.length - 1].classList.add('star-ping');
    }
}

function awardLocalPoint(team) {
    if (team === 't1') {
        localState.team1Stars++;
        renderLocalStars('t1', localState.team1Stars);
        if (localState.team1Stars >= localState.targetStars) showWinner(localState.team1Name);
        else revealLocalAnswer();
    } else {
        localState.team2Stars++;
        renderLocalStars('t2', localState.team2Stars);
        if (localState.team2Stars >= localState.targetStars) showWinner(localState.team2Name);
        else revealLocalAnswer();
    }
}

// ==========================================
// ====== ONLINE MULTIPLAYER (MODE 2) =======
// ==========================================

function updateOnlineDB(updates) {
    if(!roomCode) return;
    if (useMock) {
        onlineState = { ...onlineState, ...updates };
        handleOnlineStateSync(onlineState);
    } else {
        db.ref(`harf/rooms/${roomCode}/gameState`).update(updates);
    }
}

function updateOnlinePlayerInfo() {
    if(!roomCode) return;
    if (useMock) {
        playersList[playerId] = { name: playerName, stars: myOnlineStars };
        handlePlayersSync(playersList);
    } else {
        db.ref(`harf/rooms/${roomCode}/players/${playerId}`).set({ name: playerName, stars: myOnlineStars });
    }
}

function joinOnlinePlayer() {
    const name = document.getElementById('player-name').value.trim();
    const code = document.getElementById('join-room-code').value.trim().toUpperCase();
    if(!name || !code) { showToast(lang === 'ar' ? 'الرجاء إدخال الاسم وكود الغرفة' : 'Enter name and room code'); return;}
    
    currentMode = 'online';
    playerName = name;
    roomCode = code;
    isHost = false;
    myOnlineStars = 0;
    
    document.getElementById('display-player-name').innerText = playerName;
    if(!useMock) setupFirebaseListeners();

    updateOnlinePlayerInfo();
    showView('view-online-player');
}

function startOnlineHost() {
    currentMode = 'online';
    isHost = true;
    const target = parseInt(document.getElementById('online-target-stars').value) || 5;
    roomCode = Math.random().toString(36).substr(2, 4).toUpperCase();
    
    document.getElementById('display-room-code').innerText = roomCode;

    if(!useMock) {
        db.ref(`harf/rooms/${roomCode}/players`).remove();
        setupFirebaseListeners();
    } else {
        playersList = {}; handlePlayersSync(playersList);
    }
    
    updateOnlineDB({ status: 'playing', targetStars: target, currentBuzzer: null, winnerName: null });
    
    nextOnlineWord();
    showView('view-online-host');
}

function nextOnlineWord() {
    const list = dictionary[lang];
    const picked = list[Math.floor(Math.random() * list.length)];
    
    updateOnlineDB({
        status: 'playing',
        currentWord: picked.word,
        scrambledWord: scramble(picked.word),
        hint: picked.hint,
        wrongAttempts: 0,
        currentBuzzer: null
    });
}

function buzzInOnline() {
    if (!roomCode || onlineState.status !== 'playing' || onlineState.currentBuzzer) return;
    
    document.getElementById('btn-buzzer').style.backgroundColor = 'var(--secondary)'; // Turn green
    let reactTime = ((Date.now() - localWordReceivedTime) / 1000).toFixed(2);
    
    if (useMock) {
        updateOnlineDB({ status: 'judging', currentBuzzer: playerId, reactionTime: reactTime });
    } else {
        db.ref(`harf/rooms/${roomCode}/gameState`).transaction((currentData) => {
            if (currentData === null) return currentData;
            // In Firebase, setting to null removes the key, so currentData.currentBuzzer might be undefined
            if (!currentData.currentBuzzer) {
                currentData.currentBuzzer = playerId;
                currentData.status = 'judging';
                currentData.reactionTime = reactTime;
            }
            return currentData;
        });
    }
}

function revealOnlineHint() {
    document.getElementById('btn-reveal-hint').classList.add('hidden');
    updateOnlineDB({ wrongAttempts: 99 });
}

function judgeOnlineCorrect() {
    if (!onlineState.currentBuzzer) return;
    const buzzedPlayer = playersList[onlineState.currentBuzzer];
    
    if (buzzedPlayer) {
        const newStars = buzzedPlayer.stars + 1;
        if (!useMock) {
            db.ref(`harf/rooms/${roomCode}/players/${onlineState.currentBuzzer}/stars`).set(newStars);
        } else {
            playersList[onlineState.currentBuzzer].stars = newStars;
            if(onlineState.currentBuzzer === playerId) myOnlineStars = newStars;
            handlePlayersSync(playersList);
        }
        
        if (newStars >= onlineState.targetStars) {
            updateOnlineDB({ status: 'win', winnerName: buzzedPlayer.name, currentBuzzer: null });
        } else {
            nextOnlineWord();
        }
    }
}

function judgeOnlineWrong() {
    if (!onlineState.currentBuzzer) return;
    const newWrong = (onlineState.wrongAttempts || 0) + 1;
    updateOnlineDB({ status: 'playing', currentBuzzer: null, wrongAttempts: newWrong });
}

// Listeners / Sync Handling
function handleOnlineStateSync(state) {
    if (!state || currentMode !== 'online') return;
    onlineState = state;

    if (state.currentWord && state.currentWord !== lastSeenWordForTiming) {
        lastSeenWordForTiming = state.currentWord;
        localWordReceivedTime = Date.now();
    }

    if (state.status === 'win' && state.winnerName) {
        showWinner(state.winnerName);
    }

    if (isHost) {
        document.getElementById('host-original').innerText = state.currentWord || '---';
        document.getElementById('host-scrambled').innerText = state.scrambledWord || '---';
        
        const buzzerNameEl = document.getElementById('buzzed-player-name');
        const judgeActions = document.getElementById('judge-actions');
        const hintBtn = document.getElementById('btn-reveal-hint');
        
        if (state.currentBuzzer && playersList[state.currentBuzzer]) {
            let rtText = state.reactionTime ? ` (${state.reactionTime}s)` : '';
            buzzerNameEl.innerText = playersList[state.currentBuzzer].name + rtText;
            buzzerNameEl.style.animation = 'pulse 1s infinite alternate';
            judgeActions.classList.remove('hidden');
        } else {
            buzzerNameEl.innerText = translations[lang]['waiting'];
            buzzerNameEl.style.animation = 'none';
            judgeActions.classList.add('hidden');
        }

        if (state.wrongAttempts >= 3 && !state.currentBuzzer) hintBtn.classList.remove('hidden');
        else hintBtn.classList.add('hidden');

    } else {
        const buzBtn = document.getElementById('btn-buzzer');
        const scrambledEl = document.getElementById('player-scrambled');
        const hintEl = document.getElementById('player-hint-text');
        
        scrambledEl.innerText = state.scrambledWord || '????';
        
        if (state.wrongAttempts >= 99) { hintEl.innerText = state.hint; hintEl.classList.remove('hidden'); }
        else hintEl.classList.add('hidden');
        
        if (state.status === 'playing') {
            buzBtn.classList.remove('disabled');
            buzBtn.style.backgroundColor = ''; // Reset color
            buzBtn.innerHTML = `<span>${translations[lang]['buzz']}</span>`;
        } else {
            buzBtn.classList.add('disabled');
            if(state.currentBuzzer === playerId) buzBtn.innerHTML = '<i class="fa-solid fa-hourglass-half"></i>';
            else buzBtn.innerHTML = '<i class="fa-solid fa-lock"></i>';
        }
    }
}

function handlePlayersSync(players) {
    if(!players || currentMode !== 'online') return;
    playersList = players;
    
    if (isHost) {
        const listEl = document.getElementById('host-players-list');
        listEl.innerHTML = '';
        Object.keys(players).forEach(pId => {
            const p = players[pId];
            const li = document.createElement('li');
            li.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:1rem; border-bottom:4px solid var(--panel-border); background:rgba(0,0,0,0.2); margin-bottom:0.5rem;";
            li.innerHTML = `<span>${p.name}</span> <span style="display:flex; align-items:center; gap:0.5rem; color:var(--gold);">${p.stars} <img src="pixel_star.png" class="pixel-star" style="width:24px; height:24px;" alt="star"/></span>`;
            listEl.appendChild(li);
        });
    } else {
        if (players[playerId]) {
            myOnlineStars = players[playerId].stars;
            const container = document.getElementById('my-stars');
            const oldHtml = container.innerHTML;
            container.innerHTML = createStarsHTML(myOnlineStars);
            
            if(myOnlineStars > 0 && container.innerHTML !== oldHtml) {
                const stars = container.querySelectorAll('.pixel-star');
                if(stars.length > 0) stars[stars.length - 1].classList.add('star-ping');
            }
        }
    }
}

function setupFirebaseListeners() {
    db.ref(`harf/rooms/${roomCode}/gameState`).on('value', snap => { handleOnlineStateSync(snap.val()); });
    db.ref(`harf/rooms/${roomCode}/players`).on('value', snap => { handlePlayersSync(snap.val() || {}); });
    
    // Auto disconnect
    db.ref(`harf/rooms/${roomCode}/players/${playerId}`).onDisconnect().remove();
}

// ===== RUN =======
document.addEventListener('DOMContentLoaded', init);
