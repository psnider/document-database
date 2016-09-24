type Promise<T> = any

type DatabaseID = string;

export interface Cursor {
    start_offset?:  number
    count?:         number
}


export interface UpdateFieldCommand {
    cmd:            string;     // set, unset, and for arrays: insert, remove
    field:          string
    key_field?:     string;     // The field that contains the unique key of an array element
    element_id?:    any;        // The unique key of an array element, required for selecting an array element
    subfield?:      string;     // the path within the array element for the value to be updated
    value?:         any
}


type Conditions = {}
type Fields = string[]
// specify the field on which to sort, with a value of 1 meaning ascending, and -1 meaning descending
type Sort = {[fieldname: string]: number}


export interface RequestQuery {
    ids?:           string[];   // DatabaseObjectID
    conditions?:    Conditions
    fields?:        Fields
    sort?:          Sort
    cursor?:        Cursor
}


type Action = 'create' | 'read' | 'update' | 'replace' | 'delete' | 'find'

export interface Request<T> {
    action:         Action
    obj?:           T
    query?:         RequestQuery
    updates?:       UpdateFieldCommand[]
}


export interface Response<T> {
    error?: any
    total_count?: number
    data?: T | T[]
}



type ErrorOnlyCallback = (error?: Error) => void
type ObjectCallback<T>   = (error: Error, result?: T) => void
type ArrayCallback<T> = (error: Error, results?: T[]) => void


// Calls return either:
// - void: if a callback is provided
// - a Promise: if a callback is not provided
export abstract class DocumentDatabase<T> {
    constructor(id: string, type: string | {})
    connect(done: ErrorOnlyCallback): void
    connect() : Promise<void>
    disconnect(done: ErrorOnlyCallback): void
    disconnect() : Promise<void>
    create(obj: T): Promise<T>
    create(obj: T, done: ObjectCallback<T>): void
    read(id : string) : Promise<T>
    read(id : string, done: ObjectCallback<T>) : void
    replace(obj: T) : Promise<T>
    replace(obj: T, done: ObjectCallback<T>) : void
    update(conditions : Conditions, updates: UpdateFieldCommand[], getOriginalDocument?: ObjectCallback<T>) : Promise<T>
    update(conditions : Conditions, updates: UpdateFieldCommand[], getOriginalDocument: ObjectCallback<T>, done: ObjectCallback<T>) : void
    del(conditions : Conditions, getOriginalDocument?: (doc : T) => void) : Promise<void>
    del(conditions : Conditions, getOriginalDocument: (doc : T) => void, done: ErrorOnlyCallback) : void
    find(conditions : Conditions, fields?: Fields, sort?: Sort, cursor?: Cursor) : Promise<T[]> 
    find(conditions : Conditions, fields: Fields, sort: Sort, cursor: Cursor, done: ArrayCallback<T>) : void
}
