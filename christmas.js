/* global createjs, updateFinalScore */

'use strict';

// ----------------- SCALE CONFIG -----------------
var BASE_WIDTH = 800;   // think of these as "design-time" canvas size
var BASE_HEIGHT = 600;
var scale = 1;          // computed scale factor (applied uniformly)

// helper to scale a numeric base value
function s(v) {
    return v * scale;
}

// scaled speeds (use these when moving things each tick)
function speedScaled() {
    return speed * scale;
}
function playerSpeedScaled() {
    return speedPlayer * scale;
}

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
var speed = 2;           // base speed (will be multiplied by scale when applied)
var speedPlayer = 10;    // base player speed (also scaled on use)
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

    queue.on('progress', function(e) {
        preloadText.text = Math.round(e.progress*100) + "%";
    });

    queue.on('complete', init); // Sørg for at init kaldes, når alt er indlæst
}


// ----------------- INIT -----------------
function init() {
    stage.removeChild(preloadText);

    var canvas = document.getElementById("canvas");
    // sæt en startstørrelse (kan justeres)
    canvas.width = Math.floor(window.innerWidth * 0.8);
    canvas.height = Math.floor(window.innerHeight * 0.8);
    resizeCanvas(); 

    // gen-opret stage med det konkrete canvas
    stage = new createjs.Stage(canvas);

    // beregn skala baseret på canvas (skal nok kaldes igen på resize)
    updateScale();

    // Hent baggrund fra queue
    bg = new createjs.Bitmap(queue.getResult("bg"));
    resizeBackground();
    stage.addChildAt(bg, 0);

    // ----------------- PLAYER -----------------
    // definér base størrelser (design-time)
    var SANTA_W = 40, SANTA_H = 37;
    var DYR_W = 44, DYR_H = 37;

    var santa = new createjs.Bitmap(queue.getResult("santa"));
    santa.baseWidth = SANTA_W;
    santa.baseHeight = SANTA_H;
    santa.width = s(santa.baseWidth);
    santa.height = s(santa.baseHeight);

    var dyr = new createjs.Bitmap(queue.getResult("dyr"));
    dyr.baseX = 40;
    dyr.baseY = -15;
    dyr.x = s(dyr.baseX);
    dyr.y = s(dyr.baseY);
    dyr.baseWidth = DYR_W;
    dyr.baseHeight = DYR_H;
    dyr.width = s(dyr.baseWidth);
    dyr.height = s(dyr.baseHeight);

    player = new createjs.Container();
    player.addChild(santa, dyr);
    player.x = stage.canvas.width / 2;
    player.y = stage.canvas.height / 2;
    player.safeTimeLeft = 0;
    player.baseWidth = dyr.baseWidth + santa.baseWidth;
    player.baseHeight = dyr.baseHeight + santa.baseHeight;
    player.width = s(player.baseWidth);
    player.height = s(player.baseHeight);
    player.regX = s(santa.baseWidth / 2);
    player.regY = s(santa.baseHeight / 2);

    // ----------------- TEXTS -----------------
    healthText = new createjs.Text("Health: " + health, Math.max(12, Math.round(20 * scale)) + "px Verdana", "#000");
    healthText.x = s(10);
    healthText.y = s(10);

    pointsText = new createjs.Text("Points: " + points, Math.max(12, Math.round(20 * scale)) + "px Verdana", "#000");
    pointsText.x = s(10);
    pointsText.y = s(30);

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

    // opdater UI-tekster (skal være i korrekt font størrelse også)
    updateScale(); // sikre at fontstørrelser osv. er opdateret
    healthText.text = "Health: " + health;
    pointsText.text = "Points: " + points;

    presents = [];
    christmasBalls = [];
    sneFnugs = [];
    healths = [];
    kuls = [];
    cookies = [];
    aebleskriver = [];
    
    // ryd stage og tilføj de faste elementer igen
    stage.removeAllChildren();
    stage.addChild(bg, player, healthText, pointsText);
    resizeBackground(); // Sørg for at bg fylder canvas korrekt

    createjs.Sound.stop('backgroundmusic');
    createjs.Sound.play('backgroundmusic');
}

// ----------------- HIT TEST -----------------
function hitTest(obj1, obj2) {
    // både obj1 og obj2 forventes at have x,y,width,height opdateret i scaled units
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// ----------------- SNEFNUG -----------------
function addSnefnug() {
    sneFnug = new createjs.Bitmap('snefnug.png');
    sneFnug.baseWidth = 20;
    sneFnug.baseHeight = 21;
    sneFnug.x = Math.floor(Math.random() * stage.canvas.width);
    sneFnug.width = s(sneFnug.baseWidth);
    sneFnug.height = s(sneFnug.baseHeight);
    sneFnug.regX = s(10);
    sneFnug.regY = s(10);
    sneFnugs.push(sneFnug);
    stage.addChild(sneFnug);
}
function moveSnefnug() {
    for (var i = sneFnugs.length - 1; i >= 0; i--) {
        sneFnugs[i].y += speedScaled();
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
    present.baseWidth = 20;
    present.baseHeight = 21;
    present.x = Math.floor(Math.random() * stage.canvas.width);
    present.width = s(present.baseWidth);
    present.height = s(present.baseHeight);
    present.regX = s(10);
    present.regY = s(10);
    presents.push(present);
    stage.addChild(present);
}
function movePresents() {
    for (var i = presents.length - 1; i >= 0; i--) {
        presents[i].y += speedScaled();
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
        christmasBall.baseWidth = 10;
        christmasBall.baseHeight = 12;
        christmasBall.x = Math.floor(Math.random() * stage.canvas.width);
        christmasBall.width = s(christmasBall.baseWidth);
        christmasBall.height = s(christmasBall.baseHeight);
        christmasBall.regX = s(20);
        christmasBall.regY = s(25);
        christmasBalls.push(christmasBall);
        stage.addChild(christmasBall);
    }
}
function moveChristmasBall() {
    for (var i = christmasBalls.length - 1; i >= 0; i--) {
        christmasBalls[i].y += speedScaled();
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
        cookie.baseWidth = 20;
        cookie.baseHeight = 23;
        cookie.x = Math.floor(Math.random() * stage.canvas.width);
        cookie.width = s(cookie.baseWidth);
        cookie.height = s(cookie.baseHeight);
        cookie.regX = s(7);
        cookie.regY = s(7);
        cookies.push(cookie);
        stage.addChild(cookie);
    }
}
function moveCookie() {
    for (var i = cookies.length - 1; i >= 0; i--) {
        cookies[i].y += speedScaled();
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
    healthPowerUp.baseWidth = 15;
    healthPowerUp.baseHeight = 18;
    healthPowerUp.x = Math.floor(Math.random() * stage.canvas.width);
    healthPowerUp.width = s(healthPowerUp.baseWidth);
    healthPowerUp.height = s(healthPowerUp.baseHeight);
    healthPowerUp.regX = s(5);
    healthPowerUp.regY = s(5);
    healths.push(healthPowerUp);
    stage.addChild(healthPowerUp);
}
function moveEkstraLiv() {
    for (var i = healths.length - 1; i >= 0; i--) {
        healths[i].y += speedScaled();
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
        aebleskrive.baseWidth = 20;
        aebleskrive.baseHeight = 18;
        aebleskrive.x = Math.floor(Math.random() * stage.canvas.width);
        aebleskrive.width = s(aebleskrive.baseWidth);
        aebleskrive.height = s(aebleskrive.baseHeight);
        aebleskrive.regX = s(10);
        aebleskrive.regY = s(9);
        aebleskriver.push(aebleskrive);
        stage.addChild(aebleskrive);
    }
}
function moveSkjold() {
    for (var i = aebleskriver.length - 1; i >= 0; i--) {
        aebleskriver[i].y += speedScaled();
        if (aebleskriver[i].y > stage.canvas.height) {
            stage.removeChild(aebleskriver[i]);
            aebleskriver.splice(i, 1);
        } else if (hitTest(player, aebleskriver[i])) {
            stage.removeChild(aebleskriver[i]);
            aebleskriver.splice(i, 1);
            player.alpha = 0.5;
            player.safeTimeLeft = Math.round(400 * scale); // kortere/nyere varighed på små skærme
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
        kul.baseWidth = 15;
        kul.baseHeight = 11;
        kul.x = Math.floor(Math.random() * stage.canvas.width);
        kul.width = s(kul.baseWidth);
        kul.height = s(kul.baseHeight);
        kul.regX = s(5);
        kul.regY = s(5);
        kuls.push(kul);
        stage.addChild(kul);
    }
}
function moveKul() {
    for (var i = kuls.length - 1; i >= 0; i--) {
        kuls[i].y += speedScaled();
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
    // vis speed up i scaled tekst hvis du ønsker det:
    ekstraSpeedText = new createjs.Text("SPEED UP!", Math.max(12, Math.round(30 * scale)) + "px Verdana", "#000");
    ekstraSpeedText.textAlign = "center";
    ekstraSpeedText.textBaseline = "middle";
    ekstraSpeedText.x = stage.canvas.width / 2;
    ekstraSpeedText.y = stage.canvas.height / 2;
    // kort visning kan implementeres hvis ønsket
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

        // Player movement (brug scaled player speed)
        var ps = playerSpeedScaled();
        if (controls.left && player.x - ps >= 0) {
            player.x -= ps;
            player.scaleX = -1;
        }
        if (controls.right && player.x + ps < stage.canvas.width - s(30)) {
            player.x += ps;
            player.scaleX = 1;
        }
        if (controls.up && player.y - ps >= s(15)) player.y -= ps;
        if (controls.down && player.y + ps < stage.canvas.height - s(30)) player.y += ps;
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
    // opdater canvas til viewport størrelse
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Center canvas i browseren via CSS
    canvas.style.display = "block";
    canvas.style.margin = "20px auto 0 auto"; // top margin 20px, centreret

    // Opdater scale og baggrund/tekst/objekter
    if (stage) {
        updateScale();
        resizeBackground();
        applyScaleToTextsAndPlayer();
    }
}
function resizeBackground() {
    if (!bg || !bg.image) return;
    bg.x = 0;
    bg.y = 0;
    bg.scaleX = stage.canvas.width / bg.image.width;
    bg.scaleY = stage.canvas.height / bg.image.height;
}

// update global scale baseret på nuværende canvas
function updateScale() {
    var canvas = document.getElementById('canvas');
    if (!canvas) return;
    var scaleX = canvas.width / BASE_WIDTH;
    var scaleY = canvas.height / BASE_HEIGHT;
    scale = Math.min(scaleX, scaleY);
    if (!isFinite(scale) || scale <= 0) scale = 1;

    // opdater fonts og positions for UI
    if (healthText) {
        healthText.font = Math.max(12, Math.round(20 * scale)) + "px Verdana";
        healthText.x = s(10);
        healthText.y = s(10);
    }
    if (pointsText) {
        pointsText.font = Math.max(12, Math.round(20 * scale)) + "px Verdana";
        pointsText.x = s(10);
        pointsText.y = s(30);
    }

    // opdatér player-related mål hvis player eksisterer
    applyScaleToPlayer();
}

// opdatér spillerens størrelse/reg (kaldes når scale ændrer sig)
function applyScaleToPlayer() {
    if (!player) return;
    // opdater hver child (santa/dyr) hvis de har baseWidth/baseHeight
    player.width = s(player.baseWidth || 0);
    player.height = s(player.baseHeight || 0);

    // adjust registration point (antaget at første child er santa)
    if (player.getNumChildren && player.getNumChildren() > 0) {
        var first = player.getChildAt(0);
        if (first && first.baseWidth) {
            player.regX = s(first.baseWidth / 2);
            player.regY = s(first.baseHeight / 2);
        }
    }
}

// opdatér fonts/positioner for UI elementer hvis scale ændrer sig
function applyScaleToTextsAndPlayer() {
    updateScale(); // sikre fonts sat korrekt
    // sørg for at healthText / pointsText er i stage og har rigtige positions
    if (healthText) {
        healthText.x = s(10);
        healthText.y = s(10);
    }
    if (pointsText) {
        pointsText.x = s(10);
        pointsText.y = s(30);
    }
}

// ----------------- LOAD -----------------
window.addEventListener('load', preload);
window.addEventListener('keyup', fingerLifted);
window.addEventListener('keydown', fingerDown);
window.addEventListener('resize', resizeCanvas);

const canvas = document.getElementById('canvas');
if (canvas) {
    canvas.addEventListener('touchstart', touchStart);
    canvas.addEventListener('touchmove', touchMove);
    canvas.addEventListener('touchend', touchEnd);
    canvas.addEventListener('touchcancel', touchEnd);
}

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
