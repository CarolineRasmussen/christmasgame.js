/* global createjs, updateFinalScore */

'use strict';

// ----------------- VARIABLES -----------------
var stage;
var bg;
var queue;
var preloadText;
var player;
var controls = {
    left: false,
    right: false,
    up: false,
    down: false,
    touchStartX: 0,
    touchStartY: 0
};


var healthText;
var healthPowerUp;
var health = 3;
var kul;
var present;
var sneFnug;
var cookie;
var aebleskrive;
var pointsText;
var points = 0;
var speed = 2;
var speedPlayer = 10;
var gameIsOver = true;
var ekstraSpeedText;

var lastEkstraLifeAt = 0;
var nextEkstraSpeed = 30;

var presents = [];
var christmasBalls = [];
var sneFnugs = [];
var healths = [];
var kuls = [];
var cookies = [];
var aebleskriver = [];

// ----------------- PRELOAD -----------------
function preload() {
    stage = new createjs.Stage("canvas");

    preloadText = new createjs.Text('Loading...', '60px Verdana', '#000');
    preloadText.textAlign = "center";
    preloadText.textBaseline = "middle";
    preloadText.x = stage.canvas.width / 2;
    preloadText.y = stage.canvas.height / 2;
    stage.addChild(preloadText);

    queue = new createjs.LoadQueue(true);
    queue.installPlugin(createjs.Sound);

    queue.loadManifest([
    { id:"bg", src:"background.png" },
    { id:"backgroundmusic", src:"audio/backgroundmusic.mp3" },
    { id:"lifesound", src:"audio/getlife.mp3" },
    { id:"pointssound", src:"audio/points.mp3" },
    { id:"santahohoho", src:"audio/santahoho.mp3" },
    { id:"levelup", src:"audio/levelup.mp3" },
    { id:"gameoversound", src:"audio/gameover.mp3" },
    { id:"speedup", src:"audio/speedup.mp3" },
    { id:"looselifesound", src:"audio/looselife.mp3" },
    { id:"santa", src:"santa.png" },
    { id:"dyr", src:"dyr.png" }
]);

queue.on('complete', init); // Sørg for at init kaldes, når alt er indlæst


    queue.on('progress', function(e) {
        preloadText.text = Math.round(e.progress*100) + "%";
    });

    queue.on('complete', init);
}


// ----------------- INIT -----------------
function init() {
    stage.removeChild(preloadText);

    var canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    resizeCanvas(); 

    stage = new createjs.Stage(canvas);
    

    // Hent baggrund fra queue
    bg = new createjs.Bitmap(queue.getResult("bg"));
    resizeBackground();
    stage.addChildAt(bg, 0);

    // ----------------- PLAYER -----------------
    var santa = new createjs.Bitmap(queue.getResult("santa")); // <-- hent fra queue
    santa.width = 40;
    santa.height = 37;

    var dyr = new createjs.Bitmap(queue.getResult("dyr"));     // <-- hent fra queue
    dyr.x = 40;
    dyr.y = -15;
    dyr.width = 44;
    dyr.height = 37;

    player = new createjs.Container();
    player.addChild(santa, dyr);
    player.x = stage.canvas.width / 2;
    player.y = stage.canvas.height / 2;
    player.safeTimeLeft = 0;
    player.width = dyr.width + santa.width;
    player.height = dyr.height + santa.height;
    player.regX = santa.width / 2;
    player.regY = santa.height / 2;

    // ----------------- TEXTS -----------------
    healthText = new createjs.Text("Health: " + health, "20px Verdana", "#000");
    healthText.x = 10;
    healthText.y = 10;

    pointsText = new createjs.Text("Points: " + points, "20px Verdana", "#000");
    pointsText.x = 10;
    pointsText.y = 30;

    stage.addChild(player, healthText, pointsText);

    createjs.Ticker.setFPS(40);
    createjs.Ticker.addEventListener('tick', tock);
}


// ----------------- PLAY GAME -----------------
function playGame() {
    health = 3;
    points = 0;
    speed = 2;
    speedPlayer = 10;
    nextEkstraSpeed = 30;
    lastEkstraLifeAt = 0;

    gameIsOver = false;

    presents = [];
    christmasBalls = [];
    sneFnugs = [];
    healths = [];
    kuls = [];
    cookies = [];
    aebleskriver = [];
    
    // Ændret kode:
    stage.removeAllChildren();
    stage.addChild(bg, player, healthText, pointsText);
    resizeBackground(); // Sørg for at bg fylder canvas korrekt


    createjs.Sound.stop('backgroundmusic');
    createjs.Sound.play('backgroundmusic');
}

// ----------------- HIT TEST -----------------
function hitTest(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// ----------------- SNEFNUG -----------------
function addSnefnug() {
    sneFnug = new createjs.Bitmap('snefnug.png');
    sneFnug.x = Math.floor(Math.random() * stage.canvas.width);
    sneFnug.width = 20;
    sneFnug.height = 21;
    sneFnug.regX = 10;
    sneFnug.regY = 10;
    sneFnugs.push(sneFnug);
    stage.addChild(sneFnug);
}
function moveSnefnug() {
    for (var i = sneFnugs.length - 1; i >= 0; i--) {
        sneFnugs[i].y += speed;
        if (sneFnugs[i].y > stage.canvas.height) {
            stage.removeChild(sneFnugs[i]);
            sneFnugs.splice(i, 1);
        }
    }
}
function chechForNewSnefnug() {
    if (Math.floor(Math.random() * 201) < 20) addSnefnug();
}

// ----------------- PRESENTS -----------------
function addPresent() {
    present = new createjs.Bitmap('Present.png');
    present.x = Math.floor(Math.random() * stage.canvas.width);
    present.width = 20;
    present.height = 21;
    present.regX = 10;
    present.regY = 10;
    presents.push(present);
    stage.addChild(present);
}
function movePresents() {
    for (var i = presents.length - 1; i >= 0; i--) {
        presents[i].y += speed;
        if (presents[i].y > stage.canvas.height) {
            stage.removeChild(presents[i]);
            presents.splice(i, 1);
            looseHealth();
        } else if (hitTest(player, presents[i])) {
            stage.removeChild(presents[i]);
            presents.splice(i, 1);
            points++;
            pointsText.text = "Points: " + points;
            createjs.Sound.play('pointssound');
        }
    }
}
function checkForNewPresent() {
    var rand = Math.floor(Math.random() * 400);
    if (points <= 10 && rand < 6) addPresent();
    if (rand < 4) addChristmasBall();
    if (points >= 40 && rand < 5) addChristmasBall();
}

// ----------------- CHRISTMAS BALL -----------------
function addChristmasBall() {
    if (points >= 10) {
        var christmasBall = new createjs.Bitmap('christmas_balls.png');
        christmasBall.x = Math.floor(Math.random() * stage.canvas.width);
        christmasBall.width = 10;
        christmasBall.height = 12;
        christmasBall.regX = 20;
        christmasBall.regY = 25;
        christmasBalls.push(christmasBall);
        stage.addChild(christmasBall);
    }
}
function moveChristmasBall() {
    for (var i = christmasBalls.length - 1; i >= 0; i--) {
        christmasBalls[i].y += speed;
        if (christmasBalls[i].y > stage.canvas.height) {
            stage.removeChild(christmasBalls[i]);
            christmasBalls.splice(i, 1);
            looseHealth();
        } else if (hitTest(player, christmasBalls[i])) {
            stage.removeChild(christmasBalls[i]);
            christmasBalls.splice(i, 1);
            points += 2;
            pointsText.text = "Points: " + points;
            createjs.Sound.play('pointssound');
        }
    }
}

// ----------------- COOKIES -----------------
function addCookie() {
    if (points >= 40) {
        cookie = new createjs.Bitmap('cookie.png');
        cookie.x = Math.floor(Math.random() * stage.canvas.width);
        cookie.width = 20;
        cookie.height = 23;
        cookie.regX = 7;
        cookie.regY = 7;
        cookies.push(cookie);
        stage.addChild(cookie);
    }
}
function moveCookie() {
    for (var i = cookies.length - 1; i >= 0; i--) {
        cookies[i].y += speed;
        if (cookies[i].y > stage.canvas.height) {
            stage.removeChild(cookies[i]);
            cookies.splice(i, 1);
        } else if (hitTest(player, cookies[i])) {
            stage.removeChild(cookies[i]);
            cookies.splice(i, 1);
            points += 8;
            pointsText.text = "Points: " + points;
            createjs.Sound.play('santahohoho');
        }
    }
}
function checkForNewCookie() {
    if (Math.floor(Math.random() * 600) < 1) addCookie();
}

// ----------------- EXTRA LIFE -----------------
function checkForEkstraLiv() {
    if (points >= 45 + lastEkstraLifeAt) {
        lastEkstraLifeAt = points;
        addEkstraLiv();
    }
}
function addEkstraLiv() {
    healthPowerUp = new createjs.Bitmap('life.png');
    healthPowerUp.x = Math.floor(Math.random() * stage.canvas.width);
    healthPowerUp.width = 15;
    healthPowerUp.height = 18;
    healthPowerUp.regX = 5;
    healthPowerUp.regY = 5;
    healths.push(healthPowerUp);
    stage.addChild(healthPowerUp);
}
function moveEkstraLiv() {
    for (var i = healths.length - 1; i >= 0; i--) {
        healths[i].y += speed;
        if (healths[i].y > stage.canvas.height) {
            stage.removeChild(healths[i]);
            healths.splice(i, 1);
        } else if (hitTest(player, healths[i])) {
            stage.removeChild(healths[i]);
            healths.splice(i, 1);
            health++;
            healthText.text = "Health: " + health;
            createjs.Sound.play('lifesound');
        }
    }
}

// ----------------- SHIELD -----------------
function checkForSkjold() {
    if (Math.floor(Math.random() * 1001) < 1) addSkjold();
}
function addSkjold() {
    if (points >= 35) {
        aebleskrive = new createjs.Bitmap('aebleskriver.png');
        aebleskrive.x = Math.floor(Math.random() * stage.canvas.width);
        aebleskrive.width = 20;
        aebleskrive.height = 18;
        aebleskrive.regX = 10;
        aebleskrive.regY = 9;
        aebleskriver.push(aebleskrive);
        stage.addChild(aebleskrive);
    }
}
function moveSkjold() {
    for (var i = aebleskriver.length - 1; i >= 0; i--) {
        aebleskriver[i].y += speed;
        if (aebleskriver[i].y > stage.canvas.height) {
            stage.removeChild(aebleskriver[i]);
            aebleskriver.splice(i, 1);
        } else if (hitTest(player, aebleskriver[i])) {
            stage.removeChild(aebleskriver[i]);
            aebleskriver.splice(i, 1);
            player.alpha = 0.5;
            player.safeTimeLeft = 400;
        }
    }
}
function finishSkjold() {
    if (player.safeTimeLeft > 0) {
        player.safeTimeLeft--;
    } else {
        player.alpha = 1;
    }
}

// ----------------- COAL -----------------
function checkForKul() {
    if (Math.floor(Math.random() * 180) < 2) addKul();
}
function addKul() {
    if (points >= 30) {
        kul = new createjs.Bitmap('kul.png');
        kul.x = Math.floor(Math.random() * stage.canvas.width);
        kul.width = 15;
        kul.height = 11;
        kul.regX = 5;
        kul.regY = 5;
        kuls.push(kul);
        stage.addChild(kul);
    }
}
function moveKul() {
    for (var i = kuls.length - 1; i >= 0; i--) {
        kuls[i].y += speed;
        if (kuls[i].y > stage.canvas.height) {
            stage.removeChild(kuls[i]);
            kuls.splice(i, 1);
        } else if (player.safeTimeLeft <= 0 && hitTest(player, kuls[i])) {
            stage.removeChild(kuls[i]);
            kuls.splice(i, 1);
            looseHealth();
        }
    }
}

// ----------------- LOOSE HEALTH -----------------
function looseHealth() {
    createjs.Sound.play('looselifesound');
    health--;
    healthText.text = "Health: " + health;
    if (health <= 0) gameOver();
}

// ----------------- SPEED -----------------
function checkForMoreSpeed() {
    if (points >= nextEkstraSpeed) {
        nextEkstraSpeed += 30;
        addEkstraSpeed();
    }
}
function addEkstraSpeed() {
    speed++;
    speedPlayer++;
    createjs.Sound.play('speedup');
    ekstraSpeedText = new createjs.Text("SPEED UP!", "30px Verdana", "#000");
    ekstraSpeedText.textAlign = "center";
    ekstraSpeedText.textBaseline = "middle";
    ekstraSpeedText.x = stage.canvas.width / 2;
    ekstraSpeedText.y = stage.canvas.height / 2;
    // stage.addChild(ekstraSpeedText); // kan tilføjes, hvis man vil vise speed up
}

// ----------------- GAME OVER -----------------
function gameOver() {
    gameIsOver = true;
    createjs.Sound.stop('backgroundmusic');
    createjs.Sound.play('gameoversound');
    stage.removeAllChildren();
    document.getElementById('gameOverOverlay').classList.remove('hide');
    document.getElementById('gameOverOverlay').classList.add('show');
    updateFinalScore(points);
}

// ----------------- TICK -----------------
function tock(evt) {
    stage.update(evt);

    if (!gameIsOver) {
        moveSnefnug();
        chechForNewSnefnug();
        checkForNewPresent();
        movePresents();
        moveChristmasBall();
        checkForEkstraLiv();
        moveEkstraLiv();
        checkForKul();
        moveKul();
        checkForSkjold();
        moveSkjold();
        checkForNewCookie();
        moveCookie();
        checkForMoreSpeed();
        finishSkjold();

        // Player movement
        if (controls.left && player.x - speedPlayer >= 0) {
            player.x -= speedPlayer;
            player.scaleX = -1;
        }
        if (controls.right && player.x + speedPlayer < stage.canvas.width - 30) {
            player.x += speedPlayer;
            player.scaleX = 1;
        }
        if (controls.up && player.y - speedPlayer >= 15) player.y -= speedPlayer;
        if (controls.down && player.y + speedPlayer < stage.canvas.height - 30) player.y += speedPlayer;
    }
}

// ----------------- PLAYER CONTROLS -----------------
function fingerLifted(evt) {
    if(evt.keyCode===37) controls.left=false;
    if(evt.keyCode===38) controls.up=false;
    if(evt.keyCode===39) controls.right=false;
    if(evt.keyCode===40) controls.down=false;
}
function fingerDown(evt) {
    if(evt.keyCode===37) controls.left=true;
    if(evt.keyCode===38) controls.up=true;
    if(evt.keyCode===39) controls.right=true;
    if(evt.keyCode===40) controls.down=true;
}

// ----------------- TOUCH CONTROLS -----------------
function touchStart(evt) {
    evt.preventDefault(); // forhindrer scroll på mobil
    const touch = evt.touches[0];
    controls.touchStartX = touch.clientX;
    controls.touchStartY = touch.clientY;


    if (controls.touchStartX < window.innerWidth / 2) controls.left = true;
    else controls.right = true;

}

function touchMove(evt) {
    evt.preventDefault();
    const touch = evt.touches[0];
    const deltaY = touch.clientY - controls.touchStartY;

    controls.up = deltaY < -10;   // Swipe op
    controls.down = deltaY > 10;  // Swipe ned
}

function touchEnd(evt) {
    evt.preventDefault();
    controls.left = false;
    controls.right = false;
    controls.up = false;
    controls.down = false;
}


// ----------------- HJÆLPEFUNKTIONER -----------------
function resizeCanvas() {
    var canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;


    // Center canvas i browseren via CSS
    canvas.style.display = "block";
    canvas.style.margin = "20px auto 0 auto"; // top margin 20px, centreret

    // Opdater baggrund
    resizeBackground();
}
function resizeBackground() {
    if (!bg) return;
    bg.x = 0;
    bg.y = 0;
    bg.scaleX = stage.canvas.width / bg.image.width;
    bg.scaleY = stage.canvas.height / bg.image.height;
}
// ----------------- LOAD -----------------
window.addEventListener('load', preload);
window.addEventListener('keyup', fingerLifted);
window.addEventListener('keydown', fingerDown);
window.addEventListener('resize', resizeCanvas);

const canvas = document.getElementById('canvas');
canvas.addEventListener('touchstart', touchStart);
canvas.addEventListener('touchmove', touchMove);
canvas.addEventListener('touchend', touchEnd);
canvas.addEventListener('touchcancel', touchEnd);

// ----------------- HTML BUTTON HANDLERS -----------------
document.addEventListener('DOMContentLoaded', () => {
    const btnStart = document.getElementById('btnStart');
    const btnInstructions = document.getElementById('btnInstructions');
    const btnBack = document.getElementById('btnBack');
    const btnTryAgain = document.getElementById('btnTryAgain');

    const menuOverlay = document.getElementById('menuOverlay');
    const instructionsOverlay = document.getElementById('instructionsOverlay');
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const finalScoreTxt = document.getElementById('finalScoreTxt');

    // Ændret kode:
btnStart.addEventListener('click', () => {
    menuOverlay.classList.add('hide');
    menuOverlay.classList.remove('show');
    playGame();
});

btnInstructions.addEventListener('click', () => {
    menuOverlay.classList.add('hide');
    menuOverlay.classList.remove('show');
    instructionsOverlay.classList.add('show');
    instructionsOverlay.classList.remove('hide');
});

btnBack.addEventListener('click', () => {
    instructionsOverlay.classList.add('hide');
    instructionsOverlay.classList.remove('show');
    menuOverlay.classList.add('show');
    menuOverlay.classList.remove('hide');
});

btnTryAgain.addEventListener('click', () => {
    gameOverOverlay.classList.add('hide');
    gameOverOverlay.classList.remove('show');
    playGame();
});

// Opdater score i game over overlay
window.updateFinalScore = function(score) {
    finalScoreTxt.textContent = `Your Score: ${score}`;
};

});
