"use strict";

const tf = require('@tensorflow/tfjs');

const URL = 'https://games.dtco.ru/hex-11/model.json';

let model = null;

async function init() {
    await tf.ready();
    console.log(tf.getBackend());
}

async function load(url) {
    await init();
    model = await tf.loadLayersModel(url);
}

async function predict(board, size) {
    await load(URL);
    const shape = [1, 1, size, size];
    const xs = tf.tensor4d(board, shape, 'float32');
    const ys = await model.predict(xs);
    const moves = await ys.data();
    xs.dispose();
    ys.dispose();
    return moves;
}

module.exports.load = load;
module.exports.predict = predict;
