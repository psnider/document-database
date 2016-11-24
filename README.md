# document-database-if

Interface to a generic document (no-SQL) database.
See [DocumentDatabase](./document-database.d.ts)

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
