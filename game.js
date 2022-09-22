"use strict";

const _ = require('underscore');

const model = require('./model');
const graph = require('./graph');
const utils = require('./utils');

async function FindMove(fen, player, callback, done, logger) {
    const size = utils.getSize();

    const t0 = Date.now();
    let board = new Float32Array(size * size);
    utils.InitializeFromFen(fen, board, player);

    if (graph.isLose(board, player)) {
        done(-1);
        return;
    }
    if (graph.isLose(board, -player)) {
        done(1);
        return;
    }

    const w = await model.predict(board, size);
    utils.dump(board, size, w);

    let moves = []; let total = 0;
    for (let p = 0; p < size * size; p++) {
        if (Math.abs(board[p]) < 0.01) {
            moves.push({
                pos: p,
                weight: w[p]
            });
            total += w[p];
        }
    }

    _.each(moves, function(m) {
        m.weight = m.weight / total;
    });
    moves = _.sortBy(moves, function(m) {
        return -m.weight;
    });

    const h = _.random(0, 999);
    let c = 0; let ix = 0;
    for (let i = 0; i < moves.length; i++) {
        c += moves[i].weight * 1000;
        if (c >= h) {
            ix = i;
            break;
        }
    }

    const m = moves[ix].pos;
    board[m] = 1;
    const t1 = Date.now();

    const setup = utils.getFen(board, -player);
    callback(m, setup, moves[ix].weight * 1000, t1 - t0);
}

module.exports.FindMove = FindMove;
