"use strict";

const graph = require('./graph');
const utils = require('./utils');

const SIZE   = 11;
const FEN    = '2A2Aa4/3a1A1a3/4B2a2/2aAaB4/2aBaAaA2/2bAbAa2/1aEaA2/1a2aAc2/2a2C1b/6aAaAa/7B2';
const PLAYER = -1;

async function run() {
    const board = new Float32Array(SIZE * SIZE);
    utils.InitializeFromFen(FEN, board, PLAYER);
    utils.dump(board, SIZE, 0);
    let goal = utils.checkGoal(board, PLAYER, SIZE);
    if (goal !== null) {
        console.log('Goal = ' + goal);
        return;
    }
}

(async () => { await run(); })();
