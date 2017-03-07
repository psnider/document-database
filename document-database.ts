
// @return the element at given field path, e.g. "hat.size""
export function getValue(obj: object, fieldpath: string): any {
    var name_components = fieldpath.split('.');
    for (var i in name_components) {
        var name_component = name_components[i];
        obj = obj[name_component];
        if (obj == null)
            return null;
    }
    return obj;
}


// considers null, empty array, and obj._id to all be undefined
export function deepEqualObjOrMarshalledObj(lhs: {}, rhs: {}) : boolean {
    function coerceType(value: any) {
        if (value == null) return undefined
        if (Array.isArray(value) && (value.length === 0)) return undefined
        return value
    }
    lhs = coerceType(lhs)
    rhs = coerceType(rhs)
    if ((lhs == null) && (rhs == null)) {
        return true;        
    }
    if ((lhs == null) || (rhs == null)) {
        return false
    }
    if (Array.isArray(lhs) && Array.isArray(rhs)) {
        if (lhs.length !== rhs.length) {
            return false
        } else {
            return lhs.every((element, i) => {
                return deepEqualObjOrMarshalledObj(element, rhs[i])
            })
        }
    } else if ((lhs instanceof Date) && (rhs instanceof Date)) {
        return (lhs.getTime() == rhs.getTime())
    } else if ((typeof lhs === 'object') && (typeof rhs === 'object')) {
        let lhs_keys = new Set(Object.keys(lhs))
        let rhs_keys = new Set(Object.keys(rhs))
        let all_keys = new Set([...lhs_keys, ...rhs_keys])
        // check each key, because a missing key is equivalent to an empty value at an existing key
        return [...all_keys].every((key) => {
            if (key === '_id') {
                // ignore _id fields, but compare id, as id is a user-defined field
                return true
            } else {
                return deepEqualObjOrMarshalledObj(lhs[key], rhs[key])
            }
        })
    } else {
        return (lhs === rhs)
    }
}

