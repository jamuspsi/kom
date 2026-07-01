import {ko} from './knockout-3.4.0.koplus';

export const observableMap = function(initial, indexer) {
    const list = ko.observableArray(initial || []);

    list.isObservableMap = true;
    list.indexer = indexer;

    const obj_map = list.obj_map = new Map(); //index->obj

    list.reindex = (announce) => {
        announce = announce === undefined ? false : announce;
        obj_map.clear();
        for(var obj of list.peek()) {
            obj_map.set(list.indexer(obj), obj);
        }
        if(announce) {
            list.valueHasMutated();
        }
    }
    list.get = (key)=>{
        return obj_map.get(key);
    };
    // list.set = (key, val)=>{
    //     return obj_map.set(key, val);
    // }

    list.reindex();

    list.subscribe(()=>list.reindex());

    return list;
}


