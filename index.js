"use strict";

const axios = require('axios');
const _ = require('underscore');

const game = require('./game');

const STATE = {
    INIT: 1,
    TURN: 2,
    MOVE: 3,
    WAIT: 4,
    STOP: 5,
    RECO: 6,
    GETM: 7
};

const SERVICE  = 'https://games.dtco.ru';
const USERNAME = 'HexBot';
const PASSWORD = 'HexBot';

let TOKEN   = null;
let sid     = null;
let uid     = null;
let setup   = null;
let turn    = null;

var winston = require('winston');
require('winston-daily-rotate-file');

const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(
        info => `${info.level}: ${info.timestamp} - ${info.message}`
    )
);

var transport = new winston.transports.DailyRotateFile({
    dirname: '',
    filename: 'hexbot-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
});

var logger = winston.createLogger({
    format: logFormat,
    transports: [
      transport
    ]
});

function App() {
    this.state  = STATE.INIT;
    this.states = [];
}

let app = new App();

let init = function(app) {
    console.log('INIT');
    logger.info('INIT');
    app.state = STATE.WAIT;
    axios.post(SERVICE + '/api/auth/login', {
        username: USERNAME,
        password: PASSWORD
    })
    .then(function (response) {
        TOKEN = response.data.access_token;
        app.state = STATE.TURN;
    })
    .catch(function (error) {
        console.log('INIT ERROR: ' + error);
        logger.error('INIT ERROR: ' + error);
        app.state  = STATE.STOP;
    });
    return true;
}

let checkTurn = function(app) {
    //  console.log('TURN');
    app.state = STATE.WAIT;
    axios.get(SERVICE + '/api/session/current', {
        headers: { Authorization: `Bearer ${TOKEN}` }
    })
    .then(function (response) {
        if (response.data.length > 0) {
//          console.log(response.data);
            sid = response.data[0].id;
            setup = response.data[0].last_setup;
            app.state = STATE.RECO;
        } else {
            app.state = STATE.TURN;
        }
    })
    .catch(function (error) {
        console.log('TURN ERROR: ' + error);
        logger.error('TURN ERROR: ' + error);
        app.state  = STATE.INIT;
    });
    return true;
}

let recovery = function(app) {
    //  console.log('RECO');
    app.state = STATE.WAIT;
    axios.post(SERVICE + '/api/session/recovery', {
        id: sid,
        setup_required: true
    }, {
        headers: { Authorization: `Bearer ${TOKEN}` }
    })
    .then(function (response) {
        console.log(response.data);
        uid = response.data.uid;
        app.state = STATE.GETM;
    })
    .catch(function (error) {
        console.log('RECO ERROR: ' + error);
        logger.error('RECO ERROR: ' + error);
        app.state  = STATE.INIT;
    });
    return true;
}

let getConfirmed = function(app) {
    //  console.log('GETM');
    app.state = STATE.WAIT;
    axios.get(SERVICE + '/api/move/confirmed/' + uid, {
        headers: { Authorization: `Bearer ${TOKEN}` }
    })
    .then(function (response) {
//      console.log(response.data);
        app.state = STATE.MOVE;
    })
    .catch(function (error) {
        console.log('GETM ERROR: ' + error);
        logger.error('GETM ERROR: ' + error);
        app.state  = STATE.INIT;
    });
    return true;
}

function getSetup(fen) {
    let r = '?turn=';
    if (turn == 0) {
        r += '1;&setup=' + fen;
    } else {
        r += '0;&setup=' + fen;
    }
    return r;
}

function DoneCallback(goal) {
    app.state  = STATE.WAIT;
    if (goal > 0) {
        console.log('WON !!!');
        logger.info('WON !!!');
        axios.post(SERVICE + '/session/close', {
            winner: uid
        }, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        })
        .then(function (response) {
            app.state  = STATE.TURN;
        })
        .catch(function (error) {
            console.log('MOVE ERROR: ' + error);
            logger.error('MOVE ERROR: ' + error);
            app.state  = STATE.INIT;
        });
    } else {
        console.log('LOSE !!!');
        logger.info('LOSE !!!');
        axios.post(SERVICE + '/session/close', {
            loser: uid
        }, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        })
        .then(function (response) {
            app.state  = STATE.TURN;
        })
        .catch(function (error) {
            console.log('MOVE ERROR: ' + error);
            logger.error('MOVE ERROR: ' + error);
            app.state  = STATE.INIT;
        });
    }
}

function FinishTurnCallback(bestMove, fen, value, time) {
    let move = game.FormatMove(bestMove);
    const result = setup.match(/[?&]turn=(\d+)/);
    if (result) {
        turn = result[1];
    }
    console.log('move = ' + move + ', value=' + value + ', time = ' + time);
    logger.info('move = ' + move + ', value=' + value + ', time = ' + time);
    app.state  = STATE.WAIT;
    axios.post(SERVICE + '/api/move', {
        uid: uid,
        next_player: (turn == 0) ? 2 : 1,
        move_str: move,
        setup_str: getSetup(fen),
        note: 'value=' + value + ', time = ' + time
    }, {
        headers: { Authorization: `Bearer ${TOKEN}` }
    })
    .then(function (response) {
        app.state  = STATE.TURN;
    })
    .catch(function (error) {
        console.log('MOVE ERROR: ' + error);
        logger.error('MOVE ERROR: ' + error);
        app.state  = STATE.INIT;
    });
}

let sendMove = function(app) {
    //  console.log('MOVE');
    app.state  = STATE.WAIT;
    const result = setup.match(/\?turn=(\d+);\&setup=([^-]*)/);
    if (result) {
        const player = (result[1] == '0') ? 1 : -1;
        let fen = result[2];
        console.log('[' + sid + '] fen = ' + fen);
        logger.info('[' + sid + '] fen = ' + fen);
        game.FindMove(fen, player, FinishTurnCallback, DoneCallback, logger);
    } else {
        app.state  = STATE.STOP;
    }
    return true;
}

let wait = function(app) {
    return true;
}
    
let stop = function(app) {
    console.log('STOP');
    return false;
}
    
App.prototype.exec = function() {
    if (_.isUndefined(this.states[this.state])) return true;
    return this.states[this.state](this);
}

app.states[STATE.INIT] = init;
app.states[STATE.WAIT] = wait;
app.states[STATE.STOP] = stop;
app.states[STATE.TURN] = checkTurn;
app.states[STATE.RECO] = recovery;
app.states[STATE.GETM] = getConfirmed;
app.states[STATE.MOVE] = sendMove;

let run = function() {
    if (app.exec()) {
        setTimeout(run, 1000);
    }
}
run();
