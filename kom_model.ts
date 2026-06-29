import {ko} from './knockout-3.4.0.koplus';
import moment from 'moment';
import * as fir from '@jamus/fir';
//It's fine to share this, because this is only accessed in narrow
// circumstances (within fir.Model constructors)

function createArrayProxy(koObservableArray, underlying) {
    return new Proxy(koObservableArray(), { // Target the underlying raw array
        get(target, key, receiver) {
            // route mutators to the observableArray itself
            const koMutators = [
                'push', 'pop', 'remove', 'removeAll',
                'shift', 'unshift', 
                'splice', 
                'reverse', 'sort',
                'get', 'set', 'reindex' // map functions
            ];
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


const ProxyModelSymbol = Symbol('ProxyModelSymbol');

class ObservableStore {
    constructor(model: fir.Model) {
        this[ProxyModelSymbol] = model;
        // const model = model;
        // this.model = model;


        return new Proxy(this, {
            // get(target, key) {
            //     return Reflect.get(target, key)
            // },
            set(target, key, val) {
                // check if val is an actual observable?
                //stash the observable for later
                // target.observables.set(key, val);
                // setup the accessor on model

                // if this is an observableMap, add get/set/indexer to the
                // underlying array.

                if(ko.isObservableArray(val)) {
                    const underlying = val.peek();
                    val.proxy = createArrayProxy(val, underlying);
                    
                    Object.defineProperty(model, key, {
                        'get': ()=>val.proxy,
                        'set': (newArray)=>{
                            // console.log("Reassigning ", key, " to new array ", newArray);
                            val.proxy = createArrayProxy(val, newArray); // new proxy on the same observable
                            val(newArray);
                        },
                        enumerable: true,
                        configurable: true,
                    });
                } else if(ko.isObservable(val)) {

                    Object.defineProperty(model, key, {
                        'get': val,
                        'set': val,
                        enumerable: true,
                        configurable: true,
                    });
                }
                return Reflect.set(target, key, val);
            },
        });
    }
};


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

}
Model.__register__();
