"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
var expect = chai.expect;
const document_database_1 = require("@sabbatical/document-database");
describe('deepEqualObjOrMarshalledObj', function () {
    it('+ should compare null-equivalent values as equal', function () {
        expect(document_database_1.deepEqualObjOrMarshalledObj(null, null)).to.be.true;
        expect(document_database_1.deepEqualObjOrMarshalledObj(undefined, undefined)).to.be.true;
        expect(document_database_1.deepEqualObjOrMarshalledObj(null, undefined)).to.be.true;
        expect(document_database_1.deepEqualObjOrMarshalledObj(undefined, null)).to.be.true;
    });
    it('+ should compare null-equivalent and non-null-equivalent values as not equal', function () {
        expect(document_database_1.deepEqualObjOrMarshalledObj(null, 0)).to.be.false;
        expect(document_database_1.deepEqualObjOrMarshalledObj(0, null)).to.be.false;
        expect(document_database_1.deepEqualObjOrMarshalledObj(undefined, 0)).to.be.false;
        expect(document_database_1.deepEqualObjOrMarshalledObj(0, undefined)).to.be.false;
    });
    it('+ should compare equivalent arrays as equal', function () {
        expect(document_database_1.deepEqualObjOrMarshalledObj([1, 'b', 3], [1, 'b', 3])).to.be.true;
    });
    it('+ should compare unequivalent arrays as not equal', function () {
        expect(document_database_1.deepEqualObjOrMarshalledObj([1, 'b', 3], [1, 'b', 3, 4])).to.be.false;
        expect(document_database_1.deepEqualObjOrMarshalledObj([1, 'b', 3], [1, 'b', 3.01])).to.be.false;
    });
    it('+ should compare equivalent objects as equal', function () {
        expect(document_database_1.deepEqualObjOrMarshalledObj({ a: 1, b: 2 }, { b: 2, a: 1 })).to.be.true;
    });
    it('+ should compare unequivalent objects as not equal', function () {
        expect(document_database_1.deepEqualObjOrMarshalledObj({ a: 1, b: 2 }, { a: 1, b: 3 })).to.be.false;
        expect(document_database_1.deepEqualObjOrMarshalledObj({ a: 1, b: 2 }, { a: 1, c: 2 })).to.be.false;
    });
    it('+ should compare equivalent Dates as equal', function () {
        var base_time = 1000000000000;
        expect(document_database_1.deepEqualObjOrMarshalledObj(new Date(base_time), new Date(base_time))).to.be.true;
    });
    it('+ should compare unequivalent Dates as notequal', function () {
        var base_time = 1000000000000;
        expect(document_database_1.deepEqualObjOrMarshalledObj(new Date(base_time), new Date(base_time + 2000))).to.be.false;
    });
});
