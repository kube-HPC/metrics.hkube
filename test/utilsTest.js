const { expect } = require('chai');
const { utils } = require('../index');

describe('Utils function', () => {
    describe('arithmaticSequence', () => {
        it('should create increasing sequence with constant step', () => {
            const expected = [0, 1, 2, 3, 4, 5];
            const generated = utils.arithmatcSequence(6, 0, 1);
            expect(generated).to.eql(expected);
        });
        it('should create increasing sequence with constant step from start', () => {
            const expected = [10, 11, 12, 13, 14, 15];
            const generated = utils.arithmatcSequence(6, 10, 1);
            expect(generated).to.eql(expected);
        });
        it('should create increasing sequence with constant step and factor', () => {
            const expected = [0, 2, 4, 6, 8, 10];
            const generated = utils.arithmatcSequence(6, 0, 2);
            expect(generated).to.eql(expected);
        });
    });
    describe('geometricSequence', () => {
        it('should create increasing sequence with constant ratio', () => {
            const expected = [1, 2, 4, 8, 16, 32];
            const generated = utils.geometricSequence(6, 0, 2, 1);
            expect(generated).to.eql(expected);
        });
        it('should create increasing sequence with constant ratio from start', () => {
            const expected = [11, 12, 14, 18, 26, 42];
            const generated = utils.geometricSequence(6, 10, 2, 1);
            expect(generated).to.eql(expected);
        });
        it('should create increasing sequence with constant ratio from start with factor', () => {
            const expected = [13, 16, 22, 34, 58, 106];
            const generated = utils.geometricSequence(6, 10, 2, 3);
            expect(generated).to.eql(expected);
        });
    });
});
