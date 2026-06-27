import {ko} from './knockout-3.4.0.koplus';
import moment from 'moment';
import * as fir from '@jamus/fir';
console.log("Fir is ", fir);
//It's fine to share this, because this is only accessed in narrow
// circumstances (within fir.Model constructors)
const sharedDescriptor = {
  enumerable: true,
  configurable: true,
  writable: true,
  value: null // We will mutate this placeholder
};

function createArrayProxy(koObservableArray, underlying) {
    return new Proxy(koObservableArray(), { // Target the underlying raw array
        get(target, key, receiver) {
            // route mutators to the observableArray itself
            const koMutators = ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse', 'sort'];
            if (koMutators.includes(key)) {
                return (...args) => koObservableArray[key](...args);
            }

            //on any other read access, trigger dependency tracking.
            koObservableArray(); 

            // route everything else to the underlying raw array
            const value = Reflect.get(underlying, key, receiver);
            if (typeof value === 'function') {
                return value.bind(underlying);
            }
            return value;
        },
        set(target, key, value, receiver) {
            // model.some_list[0] = 'new item'
            if (!isNaN(Number(key))) {
                // const rawArray = koObservableArray.peek();
                underlying[key] = value;
                koObservableArray.valueHasMutated(); // Force update
                return true;
            }
            // set anything else through reflect
            return Reflect.set(underlying, key, value, receiver);
        },
        getOwnPropertyDescriptor(target, key) {
            return Reflect.getOwnPropertyDescriptor(underlying, key);
        },
        ownKeys(target) {
            const keys = Reflect.ownKeys(underlying);
            return keys;
        },
    });
}

class ObservableStore {
    model: fir.Model = null;
    observables = new Map();
    keys_cache = [];
    keys_set = new Set();

    constructor(model: fir.Model) {
        this.model = model;


        return new Proxy(this, {
            get(target, key) {
                if (key === Symbol.iterator) {
                    // because this is a map, it returns [[key, observable], ...]
                    return target.observables[Symbol.iterator].bind(target.observables);
                }

                return target.observables.get(key);
            },
            set(target, key, val) {
                // check if val is an actual observable?
                //stash the observable for later
                target.observables.set(key, val);
                // setup the accessor on model

                if(ko.isObservableArray(val)) {
                    const underlying = val.peek();
                    val.proxy = createArrayProxy(val, underlying);
                    
                    Object.defineProperty(target.model, key, {
                        'get': ()=>val.proxy,
                        'set': (newArray)=>{
                            // console.log("Reassigning ", key, " to new array ", newArray);
                            val.proxy = createArrayProxy(val, newArray); // new proxy on the same observable
                            val(newArray);
                        },
                        enumerable: true,
                        configurable: true,
                    });
                } else {
                    Object.defineProperty(target.model, key, {
                        'get': val,
                        'set': val,
                        enumerable: true,
                        configurable: true,
                    });
                }

                if(!target.keys_set.has(key)) {
                    target.keys_set.add(key);
                    target.keys_cache.push(key);
                }

                return true;
                // console.log(`Proxy set ${key}=${val}`, key, val);
            },
            deleteProperty(target, key) {
                console.log("Deleting observable ", key);
                target.observables.delete(key);
                if(target.keys_set.has(key)) {
                    target.keys_set.delete(key);
                    target.keys_cache = Array.from(target.keys_set);
                    delete target.model[key];
                }

            },
            has(target, key) {
                return target.keys_set.has(key);
            },
            ownKeys(target) {
                return target.keys_cache;
            },
            getOwnPropertyDescriptor(target, key) {
                if (target.keys_set.has(key)) {
                  // Reuse the exact same memory address, just swap the value pointer
                  sharedDescriptor.value = target.observables.get(key)
                  return sharedDescriptor; 
                }
                return undefined;
            },

        });
    }
};



// const ObsStoreSymbol = Symbol('obs_store');
const MroMap = new Map();
const KeysMap = new Map();
const PatchKeysMap = new Map();
const ModelRegistry = new Map();
const ChildClassMap = new Map();



export class Model extends fir.Model {

    constructor() {
        super();
        //hide the observable store from enumeration.
        Object.defineProperty(this, 'obs', {
            value: new ObservableStore(this),
            enumerable: false,
            configurable: true,
            writable: true
        });
        this.obs.pk = ko.observable(this.pk);

    }
    // get obs() {
    //     return this[ObsStoreSymbol];
    // }

}
fir.Model.__register__();
