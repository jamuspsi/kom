import moment from 'moment';
import { Guild, GuildHall, Room, RestFunction, TrainingFunction, GuildMember } from './test_models';

export const gm_pojo_good =  {
    __kls__: 'GuildMember',
    pk: 3,
    name: "Jamus",
    score: {__kls__: 'Decimal', 'str': '0.99'},
    awards: [
        { name: "Framework Architect", awarded: { __kls__: "datetime", d: "2026-06-26T03:45:00.000Z" } }
    ],
    favorite_colors: ["Midnight Blue", "Slate"],
}
export const gm_pojo_scuffed = {...gm_pojo_good, 
    _password: 'hunter22',
    dne: 'some_value',
};

export var gm_loaded = new GuildMember();
gm_loaded.pk = 3;
gm_loaded.name = 'Jamus';
gm_loaded.score = 0.99;
gm_loaded.awards.push( { name: "Framework Architect", awarded: new moment("2026-06-26T03:45:00.000Z") });
gm_loaded.favorite_colors = ["Midnight Blue", "Slate"];


export const guild_pojo = {
    __kls__: 'Guild',
    pk: 1,
    name: "The Iron Vanguard",
    established: { __kls__: "datetime", d: "2026-06-26T00:00:00.000Z" },
    hall: {
        __kls__: "GuildHall",
        pk:2,
        location: { x: 42, y: -12 },
        rooms: [
            {
                __kls__: 'Room',
                name: "Sleepy Training",
                pk: 3,
                functions: [
                    { __kls__: "RestFunction", pk: null, sleeping_hours: 6 },
                    { __kls__: "TrainingFunction", pk: null, monster_types: ["Goblin", "Orc"] }
                ]
            },
            {
                __kls__: 'Room',
                name: "Restroom",
                pk: 4,
                functions: [
                    { __kls__: "RestFunction", pk: null, sleeping_hours: 6 }
                ]
            }
        ]
    },
    roster: [
        {
            __kls__: 'GuildMember',
            pk: 5,
            name: "Jamus",
            score: {__kls__: 'Decimal', 'str': '0.99'},
            awards: [
                { name: "Framework Architect", awarded: { __kls__: "datetime", d: "2026-06-26T03:45:00.000Z" } }
            ],
            favorite_colors: ["Midnight Blue", "Slate"]
        }
    ]
};

export const guild_loaded = {
    pk: 1,
    name: "The Iron Vanguard",
    established: new moment("2026-06-26T00:00:00.000Z"),
    hall: {
        pk:2,
        location: { x: 42, y: -12 },
        rooms: [
            {
                name: "Sleepy Training",
                pk: 3,
                functions: [
                    { pk: null, function_type: 'rest', sleeping_hours: 6 },
                    { pk: null, function_type: 'training', monster_types: ["Goblin", "Orc"] }
                ]
            },
            {
                name: "Restroom",
                pk: 4,
                functions: [
                    { pk: null, function_type: 'rest', sleeping_hours: 6 }
                ]
            }
        ]
    },
    roster: [
        {
            pk: 5,
            name: "Jamus",
            score: 0.99,
            awards: [
                { name: "Framework Architect", awarded: new moment("2026-06-26T03:45:00.000Z") }
            ],
            favorite_colors: ["Midnight Blue", "Slate"],
            _password: null,
        }
    ]
}
