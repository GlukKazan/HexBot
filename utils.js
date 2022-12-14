"use strict";

const _ = require('underscore');

const SIZE = 11;
const LETTERS = 'ABCDEFGHIJKabcdefghijk';
const EPS = 0.01;

let edges = null;

function getSize() {
    return SIZE;
}

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

function map(dist, size) {
    for (let y = 0; y < size; y++) {
        let s = '';
        for (let i = 0; i <= y; i++) {
            s = s + ' ';
        }
        for (let x = 0; x < size; x++) {
            const pos = y * size + x;
            if (_.isUndefined(dist[pos])) {
                s = s + '.  ';
            } else {
                s = s + dist[pos] + ' ';
                if (dist[pos] < 10) s = s + ' ';
            }
        }
        console.log(s);
    }
    console.log('');
}

function pieceNotation(c, p, size) {
    if (p == 0) return '' + c;
    c--;
    if (p > 0.01) c += size;
    return LETTERS[c];
}

function getFen(board, player) {
    let str = '';
    let k = 0; let c = 0; let p = 0;
    for (let pos = 0; pos < SIZE * SIZE; pos++) {
        if (k >= SIZE) {
            if (c > 0) {
                str += pieceNotation(c, p, SIZE);
            }
            str += "/";
            k = 0;
            c = 0;
            p = 0;
        }
        k++;
        const v = board[pos] * player;
        if (Math.abs(v) < 0.01) {
            if ((p != 0) || ((c > 8) && (p == 0))) {
                str += pieceNotation(c, p, SIZE);
                c = 0;
            }
            c++;
            p = 0;
        } else {
            if (v * p < 0.01) {
                if (c > 0) {
                    str += pieceNotation(c, p, SIZE);
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
        str += pieceNotation(c, p, SIZE);
    }
    str += (player > 0) ? '-w' : '-b';
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

function navigate(pos, dir, size) {
    const x = pos % size;
    const y = (pos / size) | 0;
    if (dir < 0) {
        if (dir >= -1) {
            if (x == 0) return null;
        } else {
            if (y == 0) return null;
            if (dir > -size) {
                if (x == size - 1) return null;
            }
        }
    }
    if (dir > 0) {
        if (dir <= 1) {
            if (x == size - 1) return null;
        } else {
            if (y == size - 1) return null;
            if (dir < size) {
                if (x == 0) return null;
            }
        }
    }
    return pos + dir;
}

function getDirs(size) {
    return [-size, -size + 1, 1, size, size - 1, -1];
}

function checkGoal(board, player, size) {
    if (edges === null) {
        edges = [];
        let e = [];
        for (let i = 0; i < size; i++) e.push(i);
        edges.push(e);
        e = [];
        for (let i = 0; i < size; i++) e.push(size * (size - 1) + i);
        edges.push(e);
        e = [];
        for (let i = 0; i < size; i++) e.push(size * i);
        edges.push(e);
        e = [];
        for (let i = 0; i < size; i++) e.push(size * i + (size - 1));
        edges.push(e);
    }
    let ix = 0;
    let group = [];
    _.each(edges[ix], function(p) {
        if (board[p] * player < EPS) return;
        group.push(p);
    });
//  console.log(group);
    let f = false;
    for (let i = 0; i < group.length; i++) {
        if (f) break;
        _.each(getDirs(size), function(dir) {
            const p = navigate(group[i], dir, size);
            if (p === null) return;
            if (_.indexOf(group, p) >= 0) return;
            if (board[p] * player < EPS) return;
            if (_.indexOf(edges[ix + 1], p) >= 0) f = true;
            group.push(p);
        });
    }
    if (f) return player;
    ix += 2;
    group = [];
    _.each(edges[ix], function(p) {
        if (board[p] * player > -EPS) return;
        group.push(p);
    });
//  console.log(group);
    f = false;
    for (let i = 0; i < group.length; i++) {
        if (f) break;
        _.each(getDirs(size), function(dir) {
            const p = navigate(group[i], dir, size);
            if (p === null) return;
            if (_.indexOf(group, p) >= 0) return;
            if (board[p] * player > -EPS) return;
            if (_.indexOf(edges[ix + 1], p) >= 0) f = true;
            group.push(p);
        });
    }
    if (f) return -player;
    return null;
}

module.exports.getSize = getSize;
module.exports.dump = dump;
module.exports.map = map;
module.exports.getFen = getFen;
module.exports.InitializeFromFen = InitializeFromFen;
module.exports.FormatMove = FormatMove;
module.exports.navigate = navigate;
module.exports.getDirs = getDirs;
module.exports.checkGoal = checkGoal;
