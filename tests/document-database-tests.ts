import chai                             = require('chai')
var expect                              = chai.expect

import {DocumentDatabase, DocumentBase, DocumentID, SupportedFeatures, UpdateFieldCommand, UpdateFieldCommandType, Cursor} from '../document-database.d'
import {FieldsUsedInTests} from './document-database-tests.d'


// defaults to test, but selects skip if:
// @param conditions.requires must all be true when cast to boolearn
// @param conditions.requires must all be false when cast to boolearn
function testOrSkip(conditions: {requires?: boolean[], skip_if?: boolean[]}): Mocha.ITestDefinition {
    let skip = false
    if (conditions.requires) {
        skip = !conditions.requires.every((condition) => {return condition}) 
    }
    if (!skip && conditions.skip_if) {
        skip = conditions.skip_if.some((condition) => {return condition}) 
    }
    return skip ? <Mocha.ITestDefinition>it.skip : it
}


// @return the element at given field path, e.g. "hat.size""
function getValue(obj, fieldpath) {
    var name_components = fieldpath.split('.');
    for (var i in name_components) {
        var name_component = name_components[i];
        obj = obj[name_component];
        if (obj == null)
            return null;
    }
    return obj;
}



function getRandomValue(type: string): number | string {
    var value: number | string = Math.random()
    if (type === 'string') {
        value = value.toString()
    }
    return value
}



function expectDBOjectToContainAllObjectFields(db_obj, obj) {
    for (var key in obj) {
        expect(obj[key]).to.deep.equal(db_obj[key])
    }
}


// seem to need getDB to be dynamic, otherwise DocumentDatabase is undefined!
export function test_create<DocumentType extends DocumentBase>(getDB: () => DocumentDatabase, createNewObject: () => DocumentType, test_fields: FieldsUsedInTests): void {

    it('+ should create a new object', function() {
        var db = getDB()
        var obj: DocumentType = createNewObject()
        return db.create(obj).then(
            (created_obj) => {
                expect(created_obj).to.not.be.eql(obj)
                expect(created_obj._id).to.exist
                expect(created_obj[test_fields.populated_string]).to.equal(obj[test_fields.populated_string])
            }
        )
    })


    it('+ should not modify the original object', function() {
        var db = getDB()
        var obj: DocumentType = createNewObject()
        return db.create(obj).then(
            (created_obj) => {
                expect(obj).to.not.have.property('_id')
            }
        )
    })


    it('+ should return an error if the object to be created contains an _id', function() {
        var db = getDB()
        var obj: DocumentType = createNewObject()
        obj['_id'] = '123456789012345678901234'
        return db.create(obj).then(
            (created_obj) => {
                throw new Error('_id not allowed in object to be created')
            },
            (error) => {
                expect(error.message).to.equal('_id isnt allowed for create')
                return 'ok'
            }
        )
    })


    it('+ should create a new object, containing an object version of 1', function() {
        var db = getDB()
        var obj: DocumentType = createNewObject()
        return db.create(obj).then(
            (created_obj) => {
                expect(created_obj._obj_ver).to.eql(1)
            }
        )
    })

}


// seem to need getDB to be dynamic, otherwise DocumentDatabase is undefined!
export function test_read<DocumentType extends DocumentBase>(getDB: () => DocumentDatabase, createNewObject: () => DocumentType, test_fields: FieldsUsedInTests): void {

    describe('read an object specified by a single string ID', function() {

        it('+ should read a previously created object', function() {
            var db = getDB()
            var obj: DocumentType = createNewObject()
            return db.create(obj).then(
                (created_obj) => {
                    return db.read(created_obj._id).then(
                        (read_obj: DocumentType) => {
                            expect(read_obj).to.not.be.eql(obj)
                            expect(created_obj[test_fields.populated_string]).to.equal(obj[test_fields.populated_string])
                        }
                    )
                }
            )
        })


        it('+ should return no result for a non-existant object', function() {
            var db = getDB()
            return db.read('ffffffffffffffffffffffff').then(
                (result) => {
                    expect(result).to.not.exist
                },
                (error) => {
                    console.log('ERROR: read of valid format _id, but not referenceing an object should not return error')
                    throw error
                }
            )
        })


        it('should return an error when the request is missing the _id', function() {
            var db = getDB()
            return db.read(undefined).then(
                (result) => {
                    throw new Error('read of invalid _id should return error')
                },
                (error) => {
                    expect(error.message).to.equal('_id_or_ids is invalid')
                    return 'ok'
                }
            )
        })

    })


    describe('read an array of objects specified by an array of string IDs', function() {

        it('+ should read a set of previously created objects', function() {
            var db = getDB()
            const OBJ_COUNT = 2
            let promises: Promise<DocumentType>[] = []
            for (let i = 0 ; i < OBJ_COUNT ; ++i) {
                let obj: DocumentType = createNewObject()
                promises.push(db.create(obj))
            }
            return Promise.all(promises).then((created_objs) => {
                var _ids = created_objs.map((created_obj: DocumentType) => {return created_obj._id})
                return db.read(_ids).then((read_objs: DocumentType[]) => {
                    for (let i = 0 ; i < OBJ_COUNT ; ++i) {
                        let created_obj = created_objs[i]
                        let read_obj = read_objs.find((obj) => {return obj._id === created_obj._id})
                        expect(read_obj).to.deep.equal(created_obj)
                        expect(read_obj).to.not.equal(created_obj)
                        expect(read_obj[test_fields.populated_string]).to.equal(created_obj[test_fields.populated_string])
                    }
                })
            })
        })


        it('+ should not add anything to the results for an ID that doesnt reference a document', function() {
            var db = getDB()
            const OBJ_COUNT = 2
            let promises: Promise<DocumentType>[] = []
            for (let i = 0 ; i < OBJ_COUNT ; ++i) {
                let obj: DocumentType = createNewObject()
                promises.push(db.create(obj))
            }
            return Promise.all(promises).then((created_objs) => {
                var _ids = created_objs.map((created_obj: DocumentType) => {return created_obj._id})
                // insert an invalid ID in the middle
                _ids.splice(1, 0, '123456789012345678901234')
                expect(_ids).to.have.lengthOf(OBJ_COUNT + 1)
                return db.read(_ids).then((read_objs: DocumentType[]) => {
                    expect(read_objs).to.have.lengthOf(OBJ_COUNT)
                    for (let i = 0 ; i < OBJ_COUNT ; ++i) {
                        let created_obj = created_objs[i]
                        let read_obj = read_objs.find((obj) => {return obj._id === created_obj._id})
                        expect(read_obj).to.deep.equal(created_obj)
                        expect(read_obj).to.not.be.equal(created_obj)
                        expect(read_obj[test_fields.populated_string]).to.equal(created_obj[test_fields.populated_string])
                    }
                })
            })
        })


        it('+ should return an empty array if none of the IDs reference a document', function() {
            var db = getDB()
            let _ids = ['123456789012345678901234', '123456789012345678901235']

            return db.read(_ids).then((read_objs: DocumentType[]) => {
                expect(read_objs).to.be.an('array')
                expect(read_objs).to.have.lengthOf(0)
            })
        })

    })

}



// seem to need getDB to be dynamic, otherwise DocumentDatabase is undefined!
export function test_replace<DocumentType extends DocumentBase>(getDB: () => DocumentDatabase, createNewObject: () => DocumentType, test_fields: FieldsUsedInTests, supported: SupportedFeatures): void {

    function replace(): Promise<{created_obj: DocumentType, updated_obj: DocumentType, replaced_obj: DocumentType}> {
        var db = getDB()
        var original_obj: DocumentType = createNewObject()
        return db.create(original_obj).then(
            (created_obj) => {
                let updated_obj = Object.assign({}, created_obj)
                updated_obj[test_fields.populated_string] = created_obj[test_fields.populated_string] + 1
                return db.replace(updated_obj).then(
                    (replaced_obj) => {
                        expect(replaced_obj).to.not.equal(updated_obj)
                        expect(replaced_obj[test_fields.populated_string]).to.equal(updated_obj[test_fields.populated_string])
                        return {created_obj, updated_obj, replaced_obj}
                    }
                )
            }
        )
    }


    let _it = testOrSkip({requires: [supported.replace]})
    it('+ should replace an existing object', function() {
        return replace().then((objs) => {
            let created_obj = objs.created_obj
            let updated_obj = objs.updated_obj
            let replaced_obj = objs.replaced_obj
            expect(replaced_obj[test_fields.populated_string]).to.equal(updated_obj[test_fields.populated_string])
            expect(replaced_obj[test_fields.populated_string]).to.not.equal(created_obj[test_fields.populated_string])
        })
    })

    _it = testOrSkip({requires: [supported.replace]})
    it('+ should update the object version', function() {
        return replace().then((objs) => {
            let created_obj = objs.created_obj
            let updated_obj = objs.updated_obj
            let replaced_obj = objs.replaced_obj
            expect(created_obj._obj_ver).to.equal(1)
            expect(replaced_obj._obj_ver).to.equal(2)
        })
    })

}

// seem to need getDB to be dynamic, otherwise DocumentDatabase is undefined!
export function test_update<DocumentType extends DocumentBase>(getDB: () => DocumentDatabase, createNewObject: () => DocumentType, test_fields: FieldsUsedInTests, supported: SupportedFeatures): void {

    let supported_array  = supported.update.array
    let supported_object = supported.update.object


    function test_update(obj: DocumentType, update_cmd: UpdateFieldCommand): Promise<{created_obj: DocumentType, updated_obj: DocumentType}> {
        var db = getDB()
        return db.create(obj).then((created_obj: DocumentType) => {
            let _id = created_obj._id
            let original_obj_ver = created_obj._obj_ver
            return db.update(_id, original_obj_ver, [update_cmd]).then((updated_obj) => {
                expect(updated_obj._id).to.equal(_id)
                return {created_obj, updated_obj}
            })
        })
    }


    describe('if selected item has a path without an array:', function() {

        describe('cmd=set:', function() {

            let cmd: UpdateFieldCommandType = 'set'

            let _it = testOrSkip({requires: [(test_fields.populated_string != null), supported_object[cmd]], skip_if: []})
            _it('+ should replace an existing field in an object', function() {
                var obj: DocumentType = createNewObject()
                var populated_string = test_fields.populated_string 
                expect(obj[populated_string]).to.exist
                var replacement_value = obj[populated_string] + 1
                var UPDATE_CMD: UpdateFieldCommand = {cmd, field: populated_string, value: replacement_value}
                return test_update(obj, UPDATE_CMD).then((objs) => {
                    expect(objs.updated_obj[populated_string]).to.equal(replacement_value)
                })
            })


            _it = testOrSkip({requires: [(test_fields.unpopulated_string != null), supported_object[cmd]], skip_if: []})
            _it('+ should create a non-existant field in an object', function() {
                var obj: DocumentType = createNewObject()
                var unpopulated_string = test_fields.unpopulated_string 
                expect(obj[unpopulated_string]).to.not.exist
                var value = 'abc'
                var UPDATE_CMD: UpdateFieldCommand = {cmd, field: unpopulated_string, value}
                return test_update(obj, UPDATE_CMD).then((objs) => {
                    expect(objs.updated_obj[unpopulated_string]).to.equal(value)
                })
            })


            _it = testOrSkip({requires: [(test_fields.unpopulated_string != null), supported_object[cmd]], skip_if: []})
            _it('+ should update the object version', function() {
                var obj: DocumentType = createNewObject()
                var unpopulated_string = test_fields.unpopulated_string 
                expect(obj[unpopulated_string]).to.not.exist
                var value = 'abc'
                var UPDATE_CMD: UpdateFieldCommand = {cmd, field: unpopulated_string, value}
                return test_update(obj, UPDATE_CMD).then((objs) => {
                    expect(objs.created_obj._obj_ver).to.equal(1)
                    expect(objs.updated_obj._obj_ver).to.equal(2)
                })
            })

        })


        describe('cmd=unset', function() {

            let cmd: UpdateFieldCommandType = 'unset'


            let _it = testOrSkip({requires: [(test_fields.populated_string != null), supported_object[cmd]], skip_if: []})
            _it('+ should remove an existing field in an object', function() {
                var obj: DocumentType = createNewObject()
                var populated_string = test_fields.populated_string 
                var UPDATE_CMD : UpdateFieldCommand = {cmd, field: populated_string}
                return test_update(obj, UPDATE_CMD).then((objs) => {
                    expect(objs.updated_obj[populated_string]).to.be.undefined
                })
            })


        })

    })


    describe('if selected item has a path with an array', function() {

        describe('cmd=set', function() {

            let cmd: UpdateFieldCommandType = 'set'


            let _it = testOrSkip({requires: [(test_fields.string_array != null), supported_array[cmd]], skip_if: []})
            _it('+ should replace an existing element in an array of simple types', function() {
                var string_array = test_fields.string_array
                var obj: DocumentType = createNewObject()
                const original_value = obj[string_array.name][0]
                const updated_value = original_value + 1
                var conditions = {_id: obj._id}
                conditions[string_array.name] = original_value
                var UPDATE_CMD : UpdateFieldCommand = {cmd, field: string_array.name, element_id: original_value, value: updated_value}
                return test_update(obj, UPDATE_CMD).then((objs) => {
                    expect(objs.updated_obj[string_array.name].length).to.equal(1)
                    expect(objs.updated_obj[string_array.name][0]).to.equal(updated_value)
                })
            })


            _it = testOrSkip({requires: [(test_fields.obj_array != null), (test_fields.obj_array.key_field != null), supported_array[cmd]], skip_if: []})
            _it('+ should replace an existing element in an array of objects', function() {
                var obj_array = test_fields.obj_array
                var obj: DocumentType = createNewObject()
                var original_first_element = obj[obj_array.name][0]
                var original_element_id = original_first_element[obj_array.key_field]
                var path = `${obj_array.name}.${obj_array.key_field}`
                var conditions = {}
                conditions[path] = original_element_id
                var REPLACED_ELEMENT = obj_array.createElement()
                var UPDATE_CMD : UpdateFieldCommand = {cmd, field: obj_array.name, key_field: obj_array.key_field, element_id: original_element_id, value: REPLACED_ELEMENT}
                return test_update(obj, UPDATE_CMD).then((objs) => {
                    expect(objs.updated_obj[obj_array.name].length).to.equal(1)
                    var updated_first_element = objs.updated_obj[obj_array.name][0]
                    expect(updated_first_element).to.deep.equal(REPLACED_ELEMENT)
                })
            })


            _it = testOrSkip({requires: [(test_fields.obj_array != null), (test_fields.obj_array.unpopulated_field != null), supported_array[cmd]], skip_if: []})
            _it('+ should create a new field in an existing element in an array of objects', function() {
                var unpopulated_field = test_fields.obj_array.unpopulated_field
                var obj: DocumentType = createNewObject()
                var original_first_element = obj[test_fields.obj_array.name][0]
                var original_element_id = original_first_element[test_fields.obj_array.key_field]
                var path = `${test_fields.obj_array.name}.${test_fields.obj_array.key_field}`
                var conditions = {}
                conditions[path] = original_element_id
                var value = getRandomValue(unpopulated_field.type)
                var UPDATE_CMD : UpdateFieldCommand = {cmd, field: test_fields.obj_array.name, key_field: test_fields.obj_array.key_field, element_id: original_element_id, subfield: unpopulated_field.name, value}
                return test_update(obj, UPDATE_CMD).then((objs) => {
                    var updated_first_element = objs.updated_obj[test_fields.obj_array.name][0]
                    var updated_value = getValue(updated_first_element, unpopulated_field.name)
                    expect(updated_value).to.equal(value)
                })
            })


            _it = testOrSkip({requires: [(test_fields.obj_array != null), (test_fields.obj_array.key_field != null), supported_array[cmd]], skip_if: []})
            _it('+ should replace an existing field in an existing element in an array of objects', function() {
                var populated_field = test_fields.obj_array.populated_field
                var obj: DocumentType = createNewObject()
                var original_first_element = obj[test_fields.obj_array.name][0]
                var original_element_id = original_first_element[test_fields.obj_array.key_field]
                var path = `${test_fields.obj_array.name}.${test_fields.obj_array.key_field}`
                var conditions = {}
                conditions[path] = original_element_id
                var replacement_obj: DocumentType = createNewObject()
                var value = getValue(replacement_obj[test_fields.obj_array.name][0], populated_field.name)
                var UPDATE_CMD : UpdateFieldCommand = {cmd, field: test_fields.obj_array.name, key_field: test_fields.obj_array.key_field, element_id: original_element_id, subfield: populated_field.name, value}
                return test_update(obj, UPDATE_CMD).then((objs) => {
                    var updated_first_element = objs.updated_obj[test_fields.obj_array.name][0]
                    var updated_value = getValue(updated_first_element, populated_field.name)
                    expect(updated_value).to.equal(value)
                })
            })
        
        })


        describe('cmd=unset ', function() {

            let cmd: UpdateFieldCommandType = 'unset'


            let _it = testOrSkip({requires: [(test_fields.obj_array != null), (test_fields.obj_array.key_field != null), supported_array[cmd]], skip_if: []})
            _it('+ should remove an existing field from an existing element in the array', function() {
                var populated_field = test_fields.obj_array.populated_field
                var obj: DocumentType = createNewObject()
                var original_first_element = obj[test_fields.obj_array.name][0]
                var original_element_id = original_first_element[test_fields.obj_array.key_field]
                var path = `${test_fields.obj_array.name}.${test_fields.obj_array.key_field}`
                var conditions = {}
                conditions[path] = original_element_id
                var replacement_obj: DocumentType = createNewObject()
                var value = getValue(replacement_obj[test_fields.obj_array.name][0], populated_field.name)
                var UPDATE_CMD : UpdateFieldCommand = {cmd, field: test_fields.obj_array.name, key_field: test_fields.obj_array.key_field, element_id: original_element_id, subfield: populated_field.name}
                return test_update(obj, UPDATE_CMD).then((objs) => {
                    var updated_first_element = objs.updated_obj[test_fields.obj_array.name][0]
                    expect(updated_first_element).to.exist
                    var updated_value = getValue(updated_first_element, populated_field.name)
                    expect(updated_value).to.not.exist
                })
            })


            _it = testOrSkip({requires: [(test_fields.string_array != null), supported_array[cmd]], skip_if: []})
            _it('- should not remove or delete an existing element of an array of simple types', function() {
                var obj: DocumentType = createNewObject()
                const original_value = obj[test_fields.string_array.name][0]
                var conditions = {}
                conditions[test_fields.string_array.name] = original_value
                var UPDATE_CMD : UpdateFieldCommand = {cmd, field: test_fields.string_array.name, element_id: original_value}
                return test_update(obj, UPDATE_CMD).then(
                    (objs) => {
                        throw new Error('unset unexpectedly succeeded')
                    },
                    (error) => {
                        if (error != null) {
                            expect(error.message).to.equal('cmd=unset not allowed on array without a subfield, use cmd=remove')
                            return 'ok'
                        } else {
                            throw new Error('unset unexpectedly succeeded')
                        }
                    }
                )
            })


            _it = testOrSkip({requires: [(test_fields.obj_array != null), (test_fields.obj_array.key_field != null), supported_array[cmd]], skip_if: []})
            _it('- should not remove or delete an existing element of an array of objects', function() {
                var obj: DocumentType = createNewObject()
                const original_first_element = obj[test_fields.obj_array.name][0]
                var original_element_id = original_first_element[test_fields.obj_array.key_field]
                var path = `${test_fields.obj_array.name}.${test_fields.obj_array.key_field}`
                var conditions = {}
                conditions[path] = original_element_id
                var UPDATE_CMD : UpdateFieldCommand = {cmd, field: test_fields.obj_array.name, key_field: test_fields.obj_array.key_field, element_id: original_element_id}
                return test_update(obj, UPDATE_CMD).then(
                    (objs) => {
                        throw new Error('unset unexpectedly succeeded')
                    },
                    (error) => {
                        if (error != null) {
                            expect(error.message).to.equal('cmd=unset not allowed on array without a subfield, use cmd=remove')
                            return 'ok'
                        } else {
                            throw new Error('unset unexpectedly succeeded')
                        }
                    }
                )
            })

        })


        describe('cmd=insert', function() {

            let cmd: UpdateFieldCommandType = 'insert'


            let _it = testOrSkip({requires: [(test_fields.string_array != null), supported_array[cmd]], skip_if: []})
            _it('+ should create a new element in an array of simple types', function() {
                var obj: DocumentType = createNewObject()
                const original_value = getRandomValue('string')
                obj[test_fields.string_array.name] = [original_value]
                var conditions = {}
                conditions[test_fields.string_array.name] = original_value
                const additional_value = getRandomValue('string')
                var UPDATE_CMD : UpdateFieldCommand = {cmd, field: test_fields.string_array.name, value: additional_value}
                return test_update(obj, UPDATE_CMD).then((objs) => {
                    var array = objs.updated_obj[test_fields.string_array.name]
                    expect(array.length).to.equal(2)
                    expect(array[0]).to.equal(original_value)
                    expect(array[1]).to.equal(additional_value)
                })
            })


            _it = testOrSkip({requires: [(test_fields.obj_array != null), (test_fields.obj_array.key_field != null), supported_array[cmd]], skip_if: []})
            _it('+ should create a new element in an array of objects', function() {
                var obj: DocumentType = createNewObject()
                const original_first_element = obj[test_fields.obj_array.name][0]
                var original_element_id = original_first_element[test_fields.obj_array.key_field]
                var path = `${test_fields.obj_array.name}.${test_fields.obj_array.key_field}`
                var conditions = {}
                conditions[path] = original_element_id
                var added_element = test_fields.obj_array.createElement()
                var UPDATE_CMD : UpdateFieldCommand = {cmd, field: test_fields.obj_array.name, value: added_element}
                return test_update(obj, UPDATE_CMD).then((objs) => {
                    var array = objs.updated_obj[test_fields.obj_array.name]
                    expect(array).to.have.lengthOf(2)
                    // didn't compare entire component via deep.equal because of _id
                    expectDBOjectToContainAllObjectFields(array[0], original_first_element)
                    expectDBOjectToContainAllObjectFields(array[1], added_element)
                })
            })

        })


        describe('cmd=remove', function() {

            let cmd: UpdateFieldCommandType = 'remove'


            let _it = testOrSkip({requires: [(test_fields.string_array != null), supported_array[cmd]], skip_if: []})
            _it('+ should remove an existing element from an array of simple types', function() {
                var obj: DocumentType = createNewObject()
                expect(obj[test_fields.string_array.name]).to.have.lengthOf(1)
                var original_value = obj[test_fields.string_array.name][0]
                var UPDATE_CMD : UpdateFieldCommand = {cmd, field: test_fields.string_array.name, element_id: original_value}
                return test_update(obj, UPDATE_CMD).then((objs) => {
                    expect(objs.updated_obj[test_fields.string_array.name]).to.have.lengthOf(0)
                })
            })


            _it = testOrSkip({requires: [(test_fields.obj_array != null), (test_fields.obj_array.key_field != null), supported_array[cmd]], skip_if: []})
            _it('+ should remove an existing element from an array of objects', function() {
                var obj: DocumentType = createNewObject()
                expect(obj[test_fields.obj_array.name]).to.have.lengthOf(1)
                const first_element = obj[test_fields.obj_array.name][0]
                var element_id = first_element[test_fields.obj_array.key_field]
                var UPDATE_CMD : UpdateFieldCommand = {cmd, field: test_fields.obj_array.name, key_field: test_fields.obj_array.key_field, element_id}
                return test_update(obj, UPDATE_CMD).then((objs) => {
                    expect(objs.updated_obj[test_fields.obj_array.name]).to.have.lengthOf(0)
                })
            })

        })

    })

}



// seem to need getDB to be dynamic, otherwise DocumentDatabase is undefined!
export function test_del<DocumentType extends DocumentBase>(getDB: () => DocumentDatabase, createNewObject: () => DocumentType, config: string[]): void {

    it('+ should not be able to read after delete', function() {
        var db = getDB()
        var obj: DocumentType = createNewObject()
        return db.create(obj).then(
            (created_obj) => {
                return db.del(created_obj._id).then(
                    (result) => {
                        return db.read(created_obj._id).then(
                            (read_obj) => {
                                expect(read_obj).to.not.exist
                            }
                        )
                    }
                )
            }
        )
    })


    it('- should return an error when the request is missing the _id', function() {
        var db = getDB()
        var obj: DocumentType = createNewObject()
        return db.del(undefined).then(
            (result) => {
                throw new Error('expected del to return error')
            },
            (error) => {
                expect(error.message).to.equal('_id is invalid')
                return 'ok'
            }
        )
    })


    it('- should not return an error when the _id doesnt reference an object', function() {
        const query_id = '123456789012345678901234'
        var db = getDB()
        var obj: DocumentType = createNewObject()
        return db.create(obj).then(
            (created_obj) => {
                return db.del(query_id).then(
                    (result) => {
                        expect(result).to.not.exist
                    }
                )
            }
        )
    })

}


// seem to need getDB to be dynamic, otherwise DocumentDatabase is undefined!
export function test_find<DocumentType extends DocumentBase>(getDB: () => DocumentDatabase, createNewObject: () => DocumentType, test_fields: FieldsUsedInTests, supported: SupportedFeatures): void {

    it('+ should find an object with a matching unique field', function () {
        var db = getDB()
        var obj = createNewObject()
        return db.create(obj).then(function (created_obj) {
            var conditions = {}
            conditions[test_fields.unique_key_fieldname] = obj[test_fields.unique_key_fieldname]
            return db.find(conditions).then(function (found_objs) {
                expect(found_objs).to.be.instanceof(Array)
                expect(found_objs).to.have.lengthOf(1)
                var found_obj = found_objs[0]
                expect(found_obj[test_fields.unique_key_fieldname]).to.equal(obj[test_fields.unique_key_fieldname])
            });
        });
    });


    describe('cursor', function() {

        // add 20 elements to the database
        before(() => {
            var db = getDB()
            var promises = []
            for (var i = 0 ; i < 20 ; ++i) {
                var obj: DocumentType = createNewObject()
                promises.push(db.create(obj))
            }
            return Promise.all(promises)
        })


        it('should return the first item when start_offset = 0', function() {
            let db = getDB()
            let find_promise = db.find(undefined, undefined, undefined, {start_offset: 0})
            find_promise.then(
                (found_objs) => {
                    // cannot know which database item will be first
                    expect(found_objs[0]).to.exist
                }
            )
        })


        it('should default start_offset to 0', function() {
            let db = getDB()
            // get the first element
            return db.find(undefined, undefined, undefined, {start_offset: 0}).then(
                (found_objs) => {
                    expect(found_objs[0]).to.exist
                    // save the first element
                    const first_element = found_objs[0]
                    return db.find(undefined, undefined, undefined, undefined).then(
                        (found_objs) => {
                            // confirm the default returns the first element
                            expect(found_objs[0]).to.eql(first_element)
                        }
                    )
                }
            )
        })


        it('should return the tenth item when start_offset = 9', function() {
            let db = getDB()
            return db.find(undefined, undefined, undefined, {start_offset: 0, count: 10}).then(
                (found_objs) => {
                    expect(found_objs[9]).to.exist
                    const saved = found_objs
                    return db.find(undefined, undefined, undefined, {start_offset: 9}).then(
                        (found_objs) => {
                            // confirm the default returns the first element
                            expect(found_objs[0]).to.eql(saved[9])
                        }
                    )
                }
            )
        })


        it('should return one item if count = 1', function() {
            let db = getDB()
            return db.find(undefined, undefined, undefined, {count: 1}).then(
                (found_objs) => {
                    expect(found_objs).to.have.lengthOf(1)
                }
            )
        })


        it('should default count to 10', function() {
            let db = getDB()
            return db.find(undefined, undefined, undefined, undefined).then(
                (found_objs) => {
                    expect(found_objs).to.have.lengthOf(10)
                }
            )
        })


        it('should return 11 items if count = 11', function() {
            let db = getDB()
            return db.find(undefined, undefined, undefined, {count: 11}).then(
                (found_objs) => {
                    expect(found_objs).to.have.lengthOf(11)
                }
            )
        })

    })

}