module.exports = {
    arithmatcSequence: (count, start, step) => {
        return [...Array(count).keys()].map(i => start + (i * step));
    },
    geometricSequence: (count, start, ratio, factor) => {
        return [...Array(count).keys()].map(i => start + (factor * (ratio ** i)));
    }
};
