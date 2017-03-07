import chai                             = require('chai')
var expect                              = chai.expect

import {deepEqualObjOrMarshalledObj} from '@sabbatical/document-database'

describe('deepEqualObjOrMarshalledObj', function() {    

    it('+ should compare null-equivalent values as equal', function() {
        expect(deepEqualObjOrMarshalledObj(null, null)).to.be.true
        expect(deepEqualObjOrMarshalledObj(undefined, undefined)).to.be.true
        expect(deepEqualObjOrMarshalledObj(null, undefined)).to.be.true
        expect(deepEqualObjOrMarshalledObj(undefined, null)).to.be.true
    })


    it('+ should compare null-equivalent and non-null-equivalent values as not equal', function() {
        expect(deepEqualObjOrMarshalledObj(null, 0)).to.be.false
        expect(deepEqualObjOrMarshalledObj(0, null)).to.be.false
        expect(deepEqualObjOrMarshalledObj(undefined, 0)).to.be.false
        expect(deepEqualObjOrMarshalledObj(0, undefined)).to.be.false
    })


    it('+ should compare equivalent arrays as equal', function() {
        expect(deepEqualObjOrMarshalledObj([1,'b',3], [1,'b',3])).to.be.true
    })
            

    it('+ should compare unequivalent arrays as not equal', function() {
        expect(deepEqualObjOrMarshalledObj([1,'b',3], [1,'b',3, 4])).to.be.false
        expect(deepEqualObjOrMarshalledObj([1,'b',3], [1,'b',3.01])).to.be.false
    })
            

    it('+ should compare equivalent objects as equal', function() {
        expect(deepEqualObjOrMarshalledObj({a: 1, b: 2}, {b: 2, a: 1})).to.be.true
    })
            

    it('+ should compare unequivalent objects as not equal', function() {
        expect(deepEqualObjOrMarshalledObj({a: 1, b: 2}, {a: 1, b: 3})).to.be.false
        expect(deepEqualObjOrMarshalledObj({a: 1, b: 2}, {a: 1, c: 2})).to.be.false
    })
            

    it('+ should compare equivalent Dates as equal', function() {
        var base_time = 1000000000000
        expect(deepEqualObjOrMarshalledObj(new Date(base_time), new Date(base_time))).to.be.true
    })
            

    it('+ should compare unequivalent Dates as notequal', function() {
        var base_time = 1000000000000
        expect(deepEqualObjOrMarshalledObj(new Date(base_time), new Date(base_time + 2000))).to.be.false
    })
            
})

