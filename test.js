"use strict";

const graph = require('./graph');
const utils = require('./utils');

const SIZE   = 11;
const FEN    = '92/92/1B2Aa1A2/1a1A1B1b1/2b1cA2/2AbA5/3AaA1a3/2Aa1B1aA1/2aA2Bb1/bA4AaA1/Aa6a2';
const PLAYER = 1;

async function run() {
    const board = new Float32Array(SIZE * SIZE);
    utils.InitializeFromFen(FEN, board, SIZE, PLAYER);
    utils.dump(board, SIZE, 0);
    const g = graph.isLose(board, -PLAYER);
    console.log('Lose: ' + g);
}

(async () => { await run(); })();
