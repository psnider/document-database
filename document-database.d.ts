export type DocumentID = string
// Every document must implement this.
export interface DocumentBase {
    _id?: DocumentID
}
type DocumentType = DocumentBase

export interface Cursor {
    start_offset?:  number
    count?:         number
}


export type UpdateFieldCommandType = 'set' | 'unset' | 'insert' | 'remove'


export interface UpdateFieldCommand {
    cmd:            UpdateFieldCommandType
    field:          string
    key_field?:     string     // The field that contains the unique key of an array element
    element_id?:    any        // The unique key of an array element, required for selecting an array element
    subfield?:      string     // the path within the array element for the value to be updated
    value?:         any
}


export type Conditions = any
export type Fields = string[]
// specify the field on which to sort, with a value of 1 meaning ascending, and -1 meaning descending
export type Sort = {[fieldname: string]: number}


export type ErrorOnlyCallback = (error?: Error) => void
export type ObjectCallback  = (error: Error, result?: DocumentType) => void
export type ArrayCallback = (error: Error, results?: DocumentType[]) => void
export type ObjectOrArrayCallback = (error: Error, results?: DocumentType | DocumentType[]) => void


// Calls return either:
// - void: if a callback is provided
// - a Promise: if a callback is not provided
export abstract class DocumentDatabase {
    constructor(db_name: string, type: string | {})
    connect(done: ErrorOnlyCallback): void
    connect() : Promise<void>
    disconnect(done: ErrorOnlyCallback): void
    disconnect() : Promise<void>
    create(obj: DocumentType): Promise<DocumentType>
    create(obj: DocumentType, done: ObjectCallback): void
    // if the document doesn't exist, it returns null/undefined
    read(_id: DocumentID) : Promise<DocumentType> 
    read(_id: DocumentID, done: ObjectCallback) : void
    // The returned documents may be in any order (.and not in the order of the input IDs)
    // if a document doesn't exist, nothing is added to the result set for that ID
    // if no documents are found, an empty array is returned
    // if the caller is interested in invalid IDs, then it must track the difference between the input _ids and the results itself
    read(_ids: DocumentID[]) : Promise<DocumentType[]> 
    read(_ids: DocumentID[], done: ArrayCallback) : void
    // @deprecated
    replace(obj: DocumentType) : Promise<DocumentType>
    // @deprecated
    replace(obj: DocumentType, done: ObjectCallback) : void
    update(conditions : Conditions, updates: UpdateFieldCommand[]) : Promise<DocumentType>
    update(conditions : Conditions, updates: UpdateFieldCommand[], done: ObjectCallback) : void
    del(_id: DocumentID) : Promise<void>
    del(_id: DocumentID, done: ErrorOnlyCallback) : void
    find(conditions : Conditions, fields?: Fields, sort?: Sort, cursor?: Cursor) : Promise<DocumentType[]> 
    find(conditions : Conditions, fields: Fields, sort: Sort, cursor: Cursor, done: ArrayCallback) : void
}


// set each property true if it is fully supported
export interface SupportedFeatures {
    // create must always be supported
    // read must always be supported
    // del must always be supported
    replace: boolean
    update: {
        object: {
            set: boolean 
            unset: boolean
        }
        array: {
            set: boolean 
            unset: boolean
            insert: boolean
            remove: boolean
        }
    }
    find: {
        all: boolean
    }
}


export function deepEqualObjOrMarshalledObj(lhs: {}, rhs: {}): boolean
