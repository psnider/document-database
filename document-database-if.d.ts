type Promise<T> = any


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


export interface RequestQuery {
    ids?:           string[];   // DatabaseObjectID
    conditions?:    Object
    fields?:        string[]
    sort?:          Object
    cursor?:        Cursor
}


export interface Request<T> {
    action:         string
    obj?:           T
    query?:         RequestQuery
    updates?:       UpdateFieldCommand[]
}


export interface Response_Result<T> {
    total_count?: number
    elements: T[]
}


export interface Response<T> {
    error?: any
    result?: Response_Result<T>
}


export interface ResponseWStatus<T> {
    http_status?:   number
    response?:      Response<T>
}

// type place-holders until mongoose.d.ts defines these
type Conditions = {}
type Fields = {}
type Sort = {}


// Calls return either:
// - void: if a callback is provided
// - a Promise: if a callback is not provided
export interface DocumentDatabase<T> {
    create(obj : T) : Promise<T>
    create(obj : T, done: (error: Error, result?: T) => void) : void
    read(id : string) : Promise<T>
    read(id : string, done: (error: Error, result?: T) => void) : void
    update(conditions : Conditions, updates: UpdateFieldCommand[], getOriginalDocument?: (doc : T) => void) : Promise<T>
    update(conditions : Conditions, updates: UpdateFieldCommand[], getOriginalDocument: (doc : T) => void, done: (error: Error, result?: T) => void) : void
    delete(conditions : Conditions, getOriginalDocument?: (doc : T) => void) : Promise<void>
    delete(conditions : Conditions, getOriginalDocument: (doc : T) => void, done: (error: Error) => void) : void
    find(conditions : Conditions, fields?: Fields, sort?: Sort, cursor?: Cursor) : Promise<T[]> 
    find(conditions : Conditions, fields: Fields, sort: Sort, cursor: Cursor, done: (error: Error, result?: T[]) => void) : void
}
