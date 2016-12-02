type DocumentID = string
// Every document must implement this.
export interface DocumentBase {
    _id?: DocumentID
}
type DocumentType = DocumentBase

export interface Cursor {
    start_offset?:  number
    count?:         number
}


export interface UpdateFieldCommand {
    cmd:            string     // set, unset, and for arrays: insert, remove
    field:          string
    key_field?:     string     // The field that contains the unique key of an array element
    element_id?:    any        // The unique key of an array element, required for selecting an array element
    subfield?:      string     // the path within the array element for the value to be updated
    value?:         any
}


type Conditions = {}
type Fields = string[]
// specify the field on which to sort, with a value of 1 meaning ascending, and -1 meaning descending
type Sort = {[fieldname: string]: number}


export interface RequestQuery {
    // ids: use this for any queries that do not involve other fields.
    // Required for read, delete
    ids?:           DocumentID[]
    // Used only by update, find
    conditions?:    Conditions
    fields?:        Fields
    sort?:          Sort
    cursor?:        Cursor
}


type Action = 'create' | 'read' | 'update' | 'replace' | 'delete' | 'find'

export interface Request {
    action:         Action
    // obj: used only by create and replace
    obj?:           DocumentType
    // query: used for all but create and replace
    query?:         RequestQuery
    // updates: used by update only
    updates?:       UpdateFieldCommand[]
}


export interface Response {
    error?: any
    total_count?: number
    data?: DocumentType | DocumentType[]
}


type ErrorOnlyCallback = (error?: Error) => void
type ObjectCallback  = (error: Error, result?: DocumentType) => void
type ArrayCallback = (error: Error, results?: DocumentType[]) => void
type ObjectOrArrayCallback = (error: Error, results?: DocumentType | DocumentType[]) => void


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
    read(_id_or_ids: DocumentID | DocumentID[]) : Promise<DocumentType | DocumentType[]> 
    read(_id_or_ids: DocumentID | DocumentID[], done: ObjectOrArrayCallback) : void
    replace(obj: DocumentType) : Promise<DocumentType>
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


export function deepEqualObjOrMarshalledObj(lhs, rhs): boolean
