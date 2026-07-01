import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
// import { Model } from './icemodels';
import {Model} from '@jamus/kom';
import { Guild, GuildHall, Room, RestFunction, TrainingFunction, GuildMember } from '@jamus/kom/test_models';
import moment from 'moment';
import {guild_pojo, guild_loaded, gm_pojo_good, gm_pojo_scuffed, gm_loaded} from '@jamus/kom/test_models.fixtures'

import {FirInterop} from '@jamus/fir/fir_interop';

function assert(condition, msg) {
    if (!condition) throw new Error(`Assert Failed: ${msg}`);
};

function mirror_test(str, obj) {
    test(str, ()=>{
        var copy = Model.from_pojo(obj);
        expect(copy).toEqual(obj);
    });
}

describe('Rehydrate plain objects ', ()=>{
    mirror_test('False', false);
    mirror_test('True', true);
    mirror_test('Null', null);
    mirror_test('undefined', undefined);
    mirror_test('Number', 3);
    mirror_test('String', 'potato');
    mirror_test('Array', [1,'banana', 3]);
    mirror_test('Object', {x:0, y: 400});

});

describe('Deserialize special types', ()=> {
    test('Now', ()=>{
        var now = new moment();
        var iso = now.toDate().toISOString();
        var pojo = {__kls__: 'datetime', d: iso};
        var rehydrated = Model.from_pojo(pojo);
        expect(rehydrated.toDate().toISOString()).toEqual(now.toDate().toISOString());

    });
    test('0.5', ()=>{
        var half = Model.from_pojo({__kls__: 'Decimal', str:'0.5'});
        expect(half).toEqual(0.5);

    });

});

describe('Objects with falseys ', ()=>{
    mirror_test('Object with null', {name: null});
    mirror_test('Object with undefined', {name: undefined});
    mirror_test('List of three nulls', [null, null, null]);
    mirror_test('1, undefined, 3', [1, undefined, 3]);

});

describe('Rehydrate nested plain objects ', ()=>{
    mirror_test('List of lists', [[1,2,3], ['zed', 'yaw', 'xxx']]);
    mirror_test('List of objects', [{x:0, y:3}, {x: 1, y:'potato'}]);
    mirror_test('List of...', [[[[[[[[[[[[1]]]]]]]]]]]]);
    mirror_test('Object of...', {a: { b: {c: { d: {}}}}});
    mirror_test('List of objects', [{x: 0, y: 3}, {x:1, y: 5}]);
    mirror_test('Stuff', {some_list: [1,2,3], mapping: {a: 1, b: 2, c: 3, nested: {falsey: false}}, primitive: 'potato'})
});

describe('Deserialize a non-nested (GuildMember)', ()=>{

    let gm;
    beforeAll(()=>{
        gm = Model.from_pojo(gm_pojo_scuffed);
    });
    test('Got something', ()=>{
        // expect(gm).toBeTruthy();
        expect(gm).not.toBeNull();
    });
    test('Is an instance of the GM class', ()=>{
        expect(gm).toBeInstanceOf(GuildMember);
    });
    test('Non-whitelisted password was ignored', ()=>{
        expect(gm._password).toBeNull();
    });
    test('Non-existent property was ignored', ()=>{
        expect(gm).not.toHaveProperty('dne');
    });            

    test('GM Looks like it should', ()=>{
        expect(gm).toEqual(gm_loaded);
    });     
    test('Serializes back to the same thing', ()=>{
        let pojo = gm.as_jsonable();
        expect(pojo).toEqual(gm_pojo_good);
    });

});



describe('Deserialize a nested model (Guild)', ()=>{
   let guild;
    beforeAll(()=>{
        guild = Model.from_pojo(guild_pojo);
    });
    test('Got something', ()=>{
        // expect(guild).toBeTruthy();
        expect(guild).not.toBeNull();
    });
    test('Is an instance of the guild class', ()=>{
        expect(guild).toBeInstanceOf(Guild);
    });
    test('Guild Looks like it should', ()=>{
        expect(guild).toEqual(guild_loaded);
    });     
    test('Serializes back to the same thing', ()=>{
        let pojo = guild.as_jsonable();
        expect(pojo).toEqual(guild_pojo);
    });
});

describe('Loads works', ()=>{
    let json = JSON.stringify(guild_pojo);
    test('Loads', ()=>{
        let guild = Model.loads(json);
        expect(guild).toBeInstanceOf(Guild);
        expect(guild).toEqual(guild_loaded);
    });
    test('Loads/dumps symmetry', ()=>{
        let guild = Model.loads(json);
        expect(guild).toBeInstanceOf(Guild);
        expect(guild).toEqual(guild_loaded);
        let new_json = guild.dumps();
        let new_pojo = JSON.parse(new_json);
        expect(new_pojo).toEqual(guild_pojo);

    });
    test('Do it 1000 times for timing', ()=>{
        for(let x = 0; x< 1000; x++) {
            let guild = Model.loads(json);
            // expect(guild).toBeInstanceOf(Guild);
            // expect(guild).toEqual(guild_loaded);
            let new_json = guild.dumps();
            let new_pojo = JSON.parse(new_json);
            // expect(new_pojo).toEqual(guild_pojo);
        }
    });
});

describe('Test observableMap', ()=>{
    let guild;
    beforeEach(()=>{
        guild = Model.from_pojo(guild_pojo);
    });
    test('Has both rooms', ()=>{
        expect(guild.hall.rooms.get('Restroom')).toBeInstanceOf(Room);
        expect(guild.hall.rooms.get('Sleepy Training').pk).toEqual(3);
        expect(guild.hall.rooms.get('Sleepy Training').functions).toHaveLength(2);
        expect(guild.hall.rooms.get('Restroom')).toBeInstanceOf(Room);
        expect(guild.hall.rooms.get('Restroom').pk).toEqual(4);
        expect(guild.hall.rooms.get('Restroom').functions).toHaveLength(1);
         
    });
    test('Does not have others', ()=>{
        expect(guild.hall.rooms.get('DNE')).toBeFalsy(); 
    });
    test('Accepts new items', ()=>{
        let new_room = new Room();
        new_room.name = 'Fresh';
        guild.hall.rooms.push(new_room);

        expect(guild.hall.rooms.get('Fresh')).toBe(new_room); 
    });
    test("List didn't append to original pojo", ()=>{
        expect(guild.hall.rooms).toHaveLength(2);
    });
    test('Loses objects on removal', ()=>{

        var to_remove = guild.hall.rooms.get('Restroom');

        // some extraneous stuff that tripped me up.
        expect(to_remove).toBeInstanceOf(Room);
        expect(guild.hall.rooms).toContain(to_remove)
        expect(guild.hall.obs.rooms().includes(to_remove)).toBeTruthy();


        guild.hall.rooms.remove(to_remove);
        expect(guild.hall.rooms).toHaveLength(1);
        expect(guild.hall.rooms.get('Restroom')).toBeUndefined();
    });
    test('Reassigns cleanly.', ()=>{
        let new_room = new Room();
        new_room.name = 'Fresh';
        guild.hall.rooms = [new_room];

        expect(guild.hall.rooms.get('Fresh')).toBe(new_room); 
        expect(guild.hall.rooms.get('Restroom')).toBeUndefined(); 

    });

});

describe('how do maps work here', ()=>{
    test('equal maps', ()=>{
        var left = new Map([['a',1], ['b',2]]);
        var right = new Map([['b',2], ['a',1]]);
        expect(left).toEqual(right);
    });
    test('subset maps', ()=>{
        var left = new Map([['a',1], ['b',2]]);
        var right = new Map([['a',1]]);
        expect(left).not.toEqual(right);
    });
    test('disjoint maps', ()=>{
        var left = new Map([['a',1], ['b',2]]);
        var right = new Map([['a',1], ['c', 3]]);
        expect(left).not.toEqual(right);
    });
});

describe('Testing simple object patch', ()=>{
    let gm;
    beforeEach(()=>{
        gm = Model.from_pojo(gm_pojo_good);
    });
    test('Simple patch of GuildMember.name', ()=>{
        var before_awards = gm.awards;
        var before_score = gm.score;
        gm.apply_patch({
            'name': 'Sam',
        });
        expect(gm.name).toEqual('Sam');
        expect(gm.score).toBe(before_score);

    });
    test('Patch disallowed score', ()=>{
        var before_awards = gm.awards;
        var before_score = gm.score;
        gm.apply_patch({
            'name': 'Sam',
            'score': 100,
        });
        expect(gm.name).toEqual('Sam');
        expect(gm.score).toBe(before_score);

    });
});

describe('Testing complex object patch', ()=>{
    let guild;
    let clean_guild;
    beforeEach(()=>{
        clean_guild = Model.from_pojo(guild_pojo);
        guild = Model.from_pojo(guild_pojo);
    });
    test('Patch submodel field', ()=>{
        var old_hall = guild.hall;
        var old_location = guild.hall.location;
        var old_rooms = guild.hall.rooms;

        guild.apply_patch({
            hall: {
                '__kls__': 'GuildHall',
                pk: 2,
                location: { x:0, y:0 },
            }
        });
        expect(guild.hall.location).toEqual({x:0, y:0});
        expect(guild.hall.location).not.toBe(old_location);
        expect(guild.hall).toBe(old_hall);
        expect(guild.hall.rooms).toBe(old_rooms);
        expect(guild.hall.rooms).toEqual(old_rooms);
    });
    test('Patch submodel field but without pk, makes new GuildHall', ()=>{
        var old_hall = guild.hall;
        var old_location = guild.hall.location;
        guild.apply_patch({
            hall: {
                '__kls__': 'GuildHall',
                location: { x:0, y:0 },
            }
        });
        expect(guild.hall).not.toBe(old_hall);
        expect(guild.hall).toBeInstanceOf(GuildHall);
        expect(guild.hall.location).toEqual({x:0, y:0});
        expect(guild.hall.location).not.toBe(old_location);
    });
    test('Patch submodel field but without kls, should error', ()=>{
        let old_hall = guild.hall;
        expect(()=>{
            guild.apply_patch({
                hall: {
                    // '__kls__': 'GuildHall',
                    location: { x:0, y:0 },
                }
            });
        }).toThrowError();
        
        expect(guild.hall).toBe(old_hall);
        
    });
    test('Patch submodel field, mismatched kls, should error', ()=>{
        let old_hall = guild.hall;
        expect(()=>{
            guild.apply_patch({
                hall: {
                    __kls__: 'Room',
                    pk: null,
                    name: 'Some Room',
                }
            });
        }).toThrowError();
        
        expect(guild.hall).toBe(old_hall);
        
    });
    test('No-effect hall.room patch', ()=>{
        let old_hall = guild.hall;
        let old_room_1 = guild.hall.rooms[0];
        let old_room_2 = guild.hall.rooms[1];

        guild.apply_patch({
            hall: {
                 '__kls__': 'GuildHall',
                 pk: 2,                
                 rooms: [
                    {
                        __kls__: 'Room',
                        pk:3,
                    },
                    {
                        __kls__: 'Room',
                        pk:4,
                    }
                 ]
            }
        });
        
        expect(guild.hall).toBe(old_hall);
        expect(guild.hall.rooms).toHaveLength(2);
        expect(guild.hall.rooms[0]).toBe(old_room_1);
        expect(guild.hall.rooms[1]).toBe(old_room_2);
    });
    test('Reordering hall.room patch', ()=>{
        let old_hall = guild.hall;
        let old_room_1 = guild.hall.rooms[0];
        let old_room_2 = guild.hall.rooms[1];

        guild.apply_patch({
            hall: {
                 '__kls__': 'GuildHall',
                 pk: 2,                
                 rooms: [
                    {
                        __kls__: 'Room',
                        pk:4,
                    },
                    {
                        __kls__: 'Room',
                        pk:3,
                    }
                 ]
            }
        });
        
        expect(guild.hall).toBe(old_hall);
        expect(guild.hall.rooms).toHaveLength(2);
        expect(guild.hall.rooms[0]).toBe(old_room_2);
        expect(guild.hall.rooms[1]).toBe(old_room_1);
    });
    test('Inserting hall.room patch', ()=>{
        let old_hall = guild.hall;
        let old_room_1 = guild.hall.rooms[0];
        let old_room_2 = guild.hall.rooms[1];

        guild.apply_patch({
            hall: {
                 '__kls__': 'GuildHall',
                 pk: 2,                
                 rooms: [
                    {
                        __kls__: 'Room',
                        pk:3,
                    },
                    {
                        __kls__: 'Room',
                        pk: null,
                        name: 'Hidden Cot',
                        functions: [
                            { __kls__: "RestFunction", pk: null, sleeping_hours: 1.5 }
                        ]
                    },
                    {
                        __kls__: 'Room',
                        pk:4,
                    }
                 ]
            }
        });
        
        expect(guild.hall).toBe(old_hall);
        expect(guild.hall.rooms).toHaveLength(3);
        expect(guild.hall.rooms[0]).toBe(old_room_1);
        expect(guild.hall.rooms[2]).toBe(old_room_2);

        // check the others weren't mutated a bit
        expect(guild.hall.rooms[0].name).toEqual('Sleepy Training');
        expect(guild.hall.rooms[2].functions[0].sleeping_hours).toEqual(6);


        var new_room = guild.hall.rooms[1];
        expect(new_room).toBeInstanceOf(Room);
        expect(new_room.pk).toEqual(null);
        expect(new_room.name).toEqual('Hidden Cot');
        expect(new_room.functions).toHaveLength(1);
        expect(new_room.functions[0]).toBeInstanceOf(RestFunction);
        expect(new_room.functions[0].sleeping_hours).toEqual(1.5);


    });
    test('Get a GM patch', ()=>{
        let patch = guild.roster[0].as_patch();
        expect(patch).not.toBeNull();
        expect(patch.__tpk__).toBeUndefined();
        expect(patch).toEqual({
            __kls__: 'GuildMember',
            pk: 5,
            name: 'Jamus',
            favorite_colors: ["Midnight Blue", "Slate"]
        })
    });
    test('Get a GM patch with a tpk', ()=>{
        guild.roster[0].pk = null;
        let patch = guild.roster[0].as_patch();
        expect(patch).not.toBeNull();
        expect(patch.__tpk__).toBeTruthy();
        var tpk = patch.__tpk__;
        delete patch.__tpk__;
        expect(patch).toEqual({
            __kls__: 'GuildMember',
            pk: null,
            name: 'Jamus',
            favorite_colors: ["Midnight Blue", "Slate"]
        })
    });
    test('Patch Guild GM with a tpk', ()=>{
        var old_gm = guild.roster[0];
        var old_hall = guild.hall;

        guild.roster[0].pk = null;
        let patch = guild.as_patch();
        expect(patch).not.toBeNull();
        expect(patch.roster[0].__tpk__).toBeTruthy();
        patch.roster[0].name = 'Jay2';
        guild.apply_patch(patch);
        expect(guild.roster[0]).toBe(old_gm);
        expect(guild.roster[0].name).toEqual('Jay2');
        expect(guild.roster[0].score).toEqual(0.99);
    });
    test('Patch Guild GMs with tpks (tiebreaker, reversed)', ()=>{
        var old_gm = guild.roster[0];
        var old_gm2 = guild.roster[1];

        var old_hall = guild.hall;

        // remove pks to force pks
        guild.roster[0].pk = null;
        guild.roster[1].pk = null;

        let patch = guild.as_patch();
        expect(patch).not.toBeNull();
        expect(patch.roster[0].__tpk__).toBeTruthy();
        expect(patch.roster[1].__tpk__).toBeTruthy();
        expect(patch.roster[0].__tpk__).not.toEqual(patch.roster[1].__tpk__);

        //rename and reverse; tpks should correctly associate.
        patch.roster[0].name = 'Alpha';
        patch.roster[1].name = 'Bravo';
        patch.roster.reverse();

        guild.apply_patch(patch);
        expect(guild.roster[1]).toBe(old_gm);
        expect(guild.roster[1].name).toEqual('Alpha');
        expect(guild.roster[1].score).toEqual(0.99);
        expect(guild.roster[0]).toBe(old_gm2);
        expect(guild.roster[0].name).toEqual('Bravo');
        expect(guild.roster[0].score).toEqual(0.01);

    });
    test('RoomFunction (polymorphic, forward-reference) no-op patch', ()=>{
        let room = guild.hall.rooms[0];
        let old_functions = room.functions;
        let old_function_0 = old_functions[0];
        let old_function_1 = old_functions[1];



        room.apply_patch({
            functions: [
                room.functions[0].as_patch(),
                room.functions[1].as_patch(),
            ]
        });
        expect(room).toEqual(clean_guild.hall.rooms[0]);
        expect(room.functions[0]).toBe(old_function_0);
        expect(room.functions[1]).toBe(old_function_1);
        // should have gotten reallocated as part of the map.
        expect(room.functions).not.toBe(old_functions);

    });

    test('RoomFunction (polymorphic, forward-reference) no-op patch', ()=>{
        let room = guild.hall.rooms[0];
        let old_functions = room.functions;
        let old_function_0 = old_functions[0];
        let old_function_1 = old_functions[1];



        room.apply_patch({
            functions: [
                room.functions[0].as_patch(),
                room.functions[1].as_patch(),
            ]
        });
        expect(room).toEqual(clean_guild.hall.rooms[0]);
        expect(room.functions[0]).toBe(old_function_0);
        expect(room.functions[1]).toBe(old_function_1);
        // should have gotten reallocated as part of the map.
        expect(room.functions).not.toBe(old_functions);

    });
    test('RoomFunction (polymorphic, forward-reference) insertion patch', ()=>{
        let room = guild.hall.rooms[0];
        let old_functions = room.functions;
        let old_function_0 = old_functions[0];
        let old_function_1 = old_functions[1];



        room.apply_patch({
            functions: [
                {
                    __kls__: 'RestFunction',
                    sleeping_hours: 33,
                },
                room.functions[0].as_patch(),
                room.functions[1].as_patch(),
                {
                    __kls__: 'TrainingFunction',
                    sleeping_hours: '33',
                    monster_types: ['Rat'],
                },
            ]
        });
        // expect(room).toEqual(clean_guild.hall.rooms[0]);
        expect(room.functions[1]).toBe(old_function_0);
        expect(room.functions[2]).toBe(old_function_1);
        // should have gotten reallocated as part of the map.
        expect(room.functions).not.toBe(old_functions);
        expect(room.functions[0]).toBeInstanceOf(RestFunction);
        expect(room.functions[0].sleeping_hours).toEqual(33);
        expect(room.functions[3]).toBeInstanceOf(TrainingFunction);
        expect(room.functions[3].monster_types).toEqual(['Rat']);

    });

    test('RoomFunction append wrong class', ()=>{
        let room = guild.hall.rooms[0];
        let old_functions = room.functions;
        let old_function_0 = old_functions[0];
        let old_function_1 = old_functions[1];



        expect(()=>{
            room.apply_patch({
                functions: [
                    room.functions[0].as_patch(),
                    room.functions[1].as_patch(),
                    {
                        __kls__: 'GuildMember',
                        name: 'Some Schmo',
                    }
                ]
            });
        }).toThrowError();

    });
    test('RoomFunction append number', ()=>{
        let room = guild.hall.rooms[0];
        let old_functions = room.functions;
        let old_function_0 = old_functions[0];
        let old_function_1 = old_functions[1];



        expect(()=>{
            room.apply_patch({
                functions: [
                    room.functions[0].as_patch(),
                    room.functions[1].as_patch(),
                    69420,
                ]
            });
        }).toThrowError();

    });


});


// describe('JSON serialization with Model.loads()', ()=>{
//     let guild;
//     let json = JSON.stringify(guild_pojo);
//     beforeAll(()=>{
//         guild = Model.loads(json);
//     });
//     test('Loads looks like it should', ()=>{
//         expect(guild).toEqual(guild_loaded);
//     });
//     test('as_jsonable yielded the correct thing', ()=>{
//         let 
//         expect(guild).toEqual(guild_loaded);
//     });
// });


/*
describe('Deserialize a rich object', () => {
    let guild;
    beforeAll(()=>{
        guild = Model.from_pojo(pojo_guild);
    }) 
    test('Instance has the correct type ', () => {
        // 1. CONSTRUCT: Build out our complex mock data graph inline
        expect(guild).toBeInstanceOf(Guild);
    }
};

*/