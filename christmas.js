/* global createjs, updateFinalScore */

'use strict';

// ----------------- SCALE CONFIG -----------------
var BASE_WIDTH = 1000;   // øget fra 800 → elementer større på PC
var BASE_HEIGHT = 750;   // øget fra 600
var scale = 1;            

// helper til skaleret værdi
function s(v) { return v * scale; }

function speedScaled() { return speed * scale; }
function playerSpeedScaled() { return speedPlayer * scale; }

// ----------------- VARIABLES -----------------
var stage, bg, queue, preloadText, player;
var controls = { left:false, right:false, up:false, down:false, touchStartX:0, touchStartY:0 };

var healthText, healthPowerUp, health=3;
var kul, present, sneFnug, cookie, aebleskrive;
var pointsText, points=0, speed=2, speedPlayer=10, gameIsOver=true, ekstraSpeedText;
var lastEkstraLifeAt=0, nextEkstraSpeed=30;

var presents=[], christmasBalls=[], sneFnugs=[], healths=[], kuls=[], cookies=[], aebleskriver=[];

// ----------------- PRELOAD -----------------
function preload() {
    stage = new createjs.Stage("canvas");

    preloadText = new createjs.Text('Loading...', '60px Verdana', '#000');
    preloadText.textAlign = "center";
    preloadText.textBaseline = "middle";
    preloadText.x = stage.canvas.width/2;
    preloadText.y = stage.canvas.height/2;
    stage.addChild(preloadText);

    queue = new createjs.LoadQueue(true);
    queue.installPlugin(createjs.Sound);
    queue.loadManifest([
        {id:"bg", src:"background.png"},
        {id:"backgroundmusic", src:"audio/backgroundmusic.mp3"},
        {id:"lifesound", src:"audio/getlife.mp3"},
        {id:"pointssound", src:"audio/points.mp3"},
        {id:"santahohoho", src:"audio/santahoho.mp3"},
        {id:"levelup", src:"audio/levelup.mp3"},
        {id:"gameoversound", src:"audio/gameover.mp3"},
        {id:"speedup", src:"audio/speedup.mp3"},
        {id:"looselifesound", src:"audio/looselife.mp3"},
        {id:"santa", src:"santa.png"},
        {id:"dyr", src:"dyr.png"}
    ]);

    queue.on('progress', e => { preloadText.text = Math.round(e.progress*100)+"%"; });
    queue.on('complete', init);
}

// ----------------- INIT -----------------
function init() {
    stage.removeChild(preloadText);

    var canvas = document.getElementById("canvas");
    canvas.width = Math.floor(window.innerWidth*0.8);
    canvas.height = Math.floor(window.innerHeight*0.8);

    stage = new createjs.Stage(canvas);
    updateScale();

    // Baggrund
    bg = new createjs.Bitmap(queue.getResult("bg"));
    resizeBackground();
    stage.addChildAt(bg, 0);

    // ----------------- PLAYER -----------------
    var SANTA_W=60, SANTA_H=55, DYR_W=66, DYR_H=55; // større base størrelser

    var santa = new createjs.Bitmap(queue.getResult("santa"));
    santa.baseWidth = SANTA_W; santa.baseHeight = SANTA_H;
    santa.width = s(SANTA_W); santa.height = s(SANTA_H);

    var dyr = new createjs.Bitmap(queue.getResult("dyr"));
    dyr.baseX = 60; dyr.baseY = -22;
    dyr.x = s(dyr.baseX); dyr.y = s(dyr.baseY);
    dyr.baseWidth = DYR_W; dyr.baseHeight = DYR_H;
    dyr.width = s(DYR_W); dyr.height = s(DYR_H);

    player = new createjs.Container();
    player.addChild(santa, dyr);
    player.x = stage.canvas.width/2; player.y = stage.canvas.height/2;
    player.safeTimeLeft = 0;
    player.baseWidth = DYR_W + SANTA_W;
    player.baseHeight = DYR_H + SANTA_H;
    player.width = s(player.baseWidth); player.height = s(player.baseHeight);
    player.regX = s(SANTA_W/2); player.regY = s(SANTA_H/2);

    // ----------------- TEXTS -----------------
    healthText = new createjs.Text("Health: "+health, Math.max(12, Math.round(20*scale))+"px Verdana","#000");
    healthText.x = s(10); healthText.y = s(10);

    pointsText = new createjs.Text("Points: "+points, Math.max(12, Math.round(20*scale))+"px Verdana","#000");
    pointsText.x = s(10); pointsText.y = s(30);

    stage.addChild(player, healthText, pointsText);

    createjs.Ticker.setFPS(40);
    createjs.Ticker.addEventListener('tick', tock);
}

// ----------------- SCALE HELPERS -----------------
function updateScale() {
    var canvas = document.getElementById('canvas');
    if(!canvas) return;
    var scaleX = canvas.width / BASE_WIDTH;
    var scaleY = canvas.height / BASE_HEIGHT;
    scale = Math.min(scaleX, scaleY);
    if(!isFinite(scale) || scale <= 0) scale = 1;

    if(healthText){ healthText.font = Math.max(12, Math.round(20*scale))+"px Verdana"; healthText.x=s(10); healthText.y=s(10);}
    if(pointsText){ pointsText.font = Math.max(12, Math.round(20*scale))+"px Verdana"; pointsText.x=s(10); pointsText.y=s(30);}

    applyScaleToPlayer();
}
function applyScaleToPlayer() {
    if(!player) return;
    player.width = s(player.baseWidth||0); player.height = s(player.baseHeight||0);
    if(player.getNumChildren && player.getNumChildren()>0){
        var first = player.getChildAt(0);
        if(first && first.baseWidth){ player.regX = s(first.baseWidth/2); player.regY = s(first.baseHeight/2);}
    }
}
function resizeBackground(){
    if(!bg || !bg.image) return;
    bg.x = 0; bg.y = 0;
    bg.scaleX = stage.canvas.width / bg.image.width;
    bg.scaleY = stage.canvas.height / bg.image.height;
}
function resizeCanvas(){
    var canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display="block";
    canvas.style.margin="20px auto 0 auto";

    if(stage){ updateScale(); resizeBackground(); applyScaleToTextsAndPlayer(); }
}
function applyScaleToTextsAndPlayer(){ updateScale(); }

// ----------------- LOAD EVENTS -----------------
window.addEventListener('load', preload);
window.addEventListener('resize', resizeCanvas);
window.addEventListener('keyup', fingerLifted);
window.addEventListener('keydown', fingerDown);

const canvas = document.getElementById('canvas');
if(canvas){
    canvas.addEventListener('touchstart', touchStart);
    canvas.addEventListener('touchmove', touchMove);
    canvas.addEventListener('touchend', touchEnd);
    canvas.addEventListener('touchcancel', touchEnd);
}
