import {ko, Model} from '@jamus/kom';
import * as kom from '@jamus/kom';
import moment from 'moment';

// DO NOT REORDER- RoomFunction needs to be an unresolved forward reference for tests
export class Room extends Model {
    constructor() {
        super();
        // this.obs.name = ko.observable(null); // string
        // this.obs.functions = ko.observableArray([]); // later, Map<function_type:string, Room>
    }

    // static __keys__ = ['name', 'functions',];
    // static __patchkeys__ = ['name', 'functions',];
    static __schema__ = {
        $name: String,
        // NEEDS to be an unresolved forward reference
        $functions: {type: ['RoomFunction'], indexer: rf=>rf.function_type}
    }

    // static __contracts__ = {
    //     default: ['$name', '$functions']
    // }
}
Room.__register__();



export class RoomFunction extends Model {
    constructor() {
        super();
        // this.obs.function_type = ko.observable(null); //string
    }

    static __schema__ = {
        function_type: String,
    }
    static __contracts__ = {
        // specially, this should not serialize at all
        // not even on subclasses (RestFunction, TrainingFunction)
        default: ['-function_type'],
    }
    // static __keys__ = [];
    // static __patchkeys__ = [];
}
RoomFunction.__register__();


export class GuildHall extends Model {
    constructor() {
        super();
        // this.obs.location = ko.observable({x: 0, y: 0}); // {x,y}
        // this.obs.rooms = kom.observableMap([], room=>room.name); // [Room], later Map<name:string, Room>
    }   

    // static __keys__ = [
    //     'location',
    //     'rooms',
    // ];
    // static __patchkeys__ = [
    //     'location',
    //     'rooms',
    // ];
    static __schema__ = {
        $location: {type: Object, init: ()=>({x: 0, y: 0}) },
        $rooms: {type: [Room], indexer: room=>room.name},
    }
    // static __contracts__ = {
    //     default: ['$location', '$rooms'],
    // }

}
GuildHall.__register__();





export class RestFunction extends RoomFunction {
    constructor() {
        super();
        this.function_type ='rest';
        // this.obs.sleeping_hours = ko.observable(8); //number
    }

    // static __keys__ = ['sleeping_hours',];
    // static __patchkeys__ = ['sleeping_hours',];
    static __schema__ = {
        $sleeping_hours: {type: Number, init: 8}
    }
    // static __contracts__ = {
    //     default: ['$sleeping_hours']
    // }
}
RestFunction.__register__();


export class TrainingFunction extends RoomFunction {
    constructor() {
        super();
        this.function_type = 'training';
        // this.obs.monster_types = ko.observableArray([]); // [string]
    }

    // static __keys__ = ['monster_types'];
    // static __patchkeys__ = ['monster_types'];
    static __schema__ = {
        $monster_types: [String],
    }
    // static __contracts__ = {
    //     default: ['$monster_types']
    // }
}
TrainingFunction.__register__();

export class GuildMember extends Model {
    constructor() {
        super();
        // this.obs.name = ko.observable(null); // string
        // this.obs.score = ko.observable(0.5); // number, but notably decimal
        // this.obs.awards = ko.observableArray([]); // [{name:string, awarded:datetime}]
        // this.obs.password = ko.observable(null);

        // this.favorite_colors = ko.observableArray([]); // [string]
        this._password = null; // not ko.
    }

    // static __keys__ = ['name', 'score', 'awards', 'favorite_colors'];
    // static __patchkeys__ = ['name', 'favorite_colors'];
    static __schema__ = {
        $name: {type: String, ko: ko.observable},
        score: {type: Number, init: 0.5},
        awards: [Object],
        _password: {type: String, ko: false},
        $favorite_colors: {type: [String], ko: ko.observableArray, init: ()=>['red']},
    }

    // static __contracts__ = {
    //     default: ['$name', 'score', 'awards', '$favorite_colors']
    // }

}
GuildMember.__register__();



export class Guild extends Model {
    constructor() {
        super();

        // this.obs.name = ko.observable(null); // string
        // this.obs.established = ko.observable(null); // datetime
        // this.obs.hall = ko.observable(new GuildHall()); // GuildHall
        // this.obs.roster = ko.observableArray([]); // [GuildMember]
    }

    // static __keys__ = [
    //     'name', 'established', 'hall', 'roster',
    // ];
    // static __patchkeys__ = [
    //     'name', 'hall', 'roster',
    // ];
    static __schema__ = {
        $name: String,
        established: moment,
        $hall: GuildHall,
        $roster: [GuildMember],
    }
    // static __contracts__ = {
    //     default: ['$name', 'established', '$hall', '$roster']
    // }
}
Guild.__register__();

