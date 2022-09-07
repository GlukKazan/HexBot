"use strict";

const _ = require('underscore');

const SIZE = 11;

const LETTERS = 'ABCDEFGHIJKabcdefghijk';

function dump(board, size, moves) {
    for (let y = 0; y < size; y++) {
        let s = '';
        for (let i = 0; i <= y; i++) {
            s = s + ' ';
        }
        for (let x = 0; x < size; x++) {
            const pos = y * size + x;
            if (board[pos] > 0) {
                s = s + '* ';
            } else if (board[pos] < 0) {
                s = s + 'o ';
            } else if (!_.isUndefined(moves) && (moves[pos] > 1 / (size * size))) {
                s = s + '+ ';
            } else {
                s = s + '. ';
            }
        }
        console.log(s);
    }
    console.log('');
}

function pieceNotation(c, p) {
    if (p == 0) return '' + c;
    c--;
    if (p > 0.01) c += SIZE;
    return LETTERS[c];
}

function getFen(board, player) {
    let str = '';
    let k = 0; let c = 0; let p = 0;
    for (let pos = 0; pos < SIZE * SIZE; pos++) {
        if (k >= SIZE) {
            if (c > 0) {
                str += pieceNotation(c, p);
            }
            str += "/";
            k = 0;
            c = 0;
        }
        k++;
        const v = board[pos];
        if (Math.abs(v) < 0.01) {
            if ((p != 0) || ((c > 8) && (p == 0))) {
                str += pieceNotation(c, p);
                c = 0;
            }
            c++;
            p = 0;
        } else {
            if (v * player < -0.01) {
                if (c > 0) {
                    str += pieceNotation(c, p);
                    c = 0;
                }
                p = v;
                c = 1;
            } else {
                c++;
            }
        }
    }
    if (c > 0) {
        str += pieceNotation(c, p);
    }
    return str;
}

function InitializeFromFen(fen, board, player) {
    let pos = 0;
    for (let i = 0; i < fen.length; i++) {
        const c = fen[i];
        if (c != '/') {
            if ((c >= '0') && (c <= '9')) {
                pos += +c;
            } else {
                let ix = _.indexOf(LETTERS, c);
                if (ix >= 0) {
                    let p = 1;
                    if (ix >= SIZE) {
                        p = -p;
                        ix -= SIZE;
                    }
                    ix++;
                    for (; ix > 0; ix--) {
                        board[pos] = p * player;
                        pos++;
                    }
                }
            }
            if (pos >= SIZE * SIZE) break;
        } 
    }
}

function FormatMove(move) {
    const col = move % SIZE;
    const row = (move / SIZE) | 0;
    return LETTERS[col + SIZE] + (row + 1);
}

async function FindMove(fen, player, callback, logger) {
    const t0 = Date.now();
    let board = new Float32Array(SIZE * SIZE);
    InitializeFromFen(fen, board, player);

    let moves = [];
    for (let pos = 0; pos < SIZE * SIZE; pos++) {
        if (Math.abs(board[pos]) < 0.01) moves.push(pos);
    }
    const ix = _.random(moves.length);
    const m = moves[ix];

    let result = new Float32Array(SIZE * SIZE);
    result[m] = 1;
    dump(board, SIZE, result);
    const t1 = Date.now();

    board[m] = 1;
    const setup = getFen(board, player);
    callback(m, setup, 1000, t1 - t0);
}

module.exports.FindMove = FindMove;
module.exports.FormatMove = FormatMove;
