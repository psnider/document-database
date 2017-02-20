import {DocumentDatabase, DocumentBase, DocumentID, SupportedFeatures, UpdateFieldCommand} from '../document-database.d'



// Any missing fields prevent any dependent tests from being run.
export interface Field {
    name: string 
    type: 'number' | 'string'
}

export interface FieldsUsedInTests {
    // must refer to a top-level field that is not present and supports operator "+ 1" (either a string or a number)
    populated_string?: string
    // must refer to a top-level field that is a string, and is not present
    unpopulated_string?: string
    // must refer to a top-level field that is a string, and is not preseis always unique
    unique_key_fieldname?: string
    string_array?: {
        name: string
    }
    obj_array?: {
        name: string
        key_field?: string
        populated_field: Field
        unpopulated_field?: Field
        createElement: () => {}   // 2 sequential calls must return different results
    }
}


export function test_create<DocumentType extends DocumentBase>(getDB: () => DocumentDatabase, createNewObject: () => DocumentType, test_fields: FieldsUsedInTests): void
export function test_read<DocumentType extends DocumentBase>(getDB: () => DocumentDatabase, createNewObject: () => DocumentType, test_fields: FieldsUsedInTests): void
export function test_replace<DocumentType extends DocumentBase>(getDB: () => DocumentDatabase, createNewObject: () => DocumentType, test_fields: FieldsUsedInTests, config: SupportedFeatures): void
export function test_update<DocumentType extends DocumentBase>(getDB: () => DocumentDatabase, createNewObject: () => DocumentType, test_fields: FieldsUsedInTests, config: SupportedFeatures): void
export function test_del<DocumentType extends DocumentBase>(getDB: () => DocumentDatabase, createNewObject: () => DocumentType, test_fields: FieldsUsedInTests): void
export function test_find<DocumentType extends DocumentBase>(getDB: () => DocumentDatabase, createNewObject: () => DocumentType, test_fields: FieldsUsedInTests, config: SupportedFeatures): void
