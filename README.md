# document-database-if

Interface to a generic document (no-SQL) database.  
See the **DocumentDatabase** type in the [declarations file](./document-database.d.ts).

## adaptors

- [InMemoryDB](https://www.npmjs.com/package/@sabbatical/in-memory-db)  
An in-memory database, that doesn't persist its data.  
This is great for testing.
- [MongoDBApaptor](https://www.npmjs.com/package/@sabbatical/mongoose-adaptor)  
For use with a mongoDB database, using mongoose.js for schema enforcement.  
We use this for initial databases.


# tests
There are tests for this interface in the [tests](./tests) sub-package, that can be configured for use with any DocumentDatabase-compliant object.

To use these tests for you own database adaptor, 
install these packages to your database adaptor package:
- chai
- mocha
- @sabbatical/document-database/tests

and add these dependencies to the *compilerOptions.types* field of your tsconfig.json file:
```
    "compilerOptions": {
        "types" : ["chai", "mocha", "@psnider/document-database/tests"]
``` 
