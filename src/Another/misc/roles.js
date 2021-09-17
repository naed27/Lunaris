module.exports.rolesList = [
    {
        id:'001',
        Name:'Ghost',
        Alignment:'Evil',
        Type:'Killing',
        Immunities:[],
        Attack:1,
        Defense:0,
        Unique:true,
        Abilities:[
            'You can stalk (1) student each night.',
            'You can kill (1) student if certain conditions are met.'
        ],
        Goals:[
            'Lynch an innocent student.',
            'Or kill all students.'
        ],
        NightMessage:'You can talk to the detained person.',
        RoleMessage:'',
        Commands:[
            {   
                Name:'stalk',
                Type:'Role Command',
                Cast:'Normal',
                Guide:'stalk <player>',
                Example:'stalk John',
                Description:'Stalks a person for one night.',
                Priority:1,
                Stocks:99,
                Authorization:'Role Holder',
                Phase:['Night', 'Night (Full Moon)'],
                RequiredStatus:['Alive'],
                RequiredNumberOfTargets:1,
                VisitsTarget:true,
                Targetables:({user,game})=>{
                    return  game.getPlayers().filter(player=>player.getId()!=user.getId() && player.getStatus()=='Alive');
                },
                Response:({target})=>{
                    return `You have decided to stalk **${target.getUsername()}** tonight.`
                },
                Run:()=>{
                    return null
                },
            },
            {
                Name:'kill',
                Type:'Role Command',
                Cast:'Normal',
                Guide:'kill <player>',
                Example:'kill John',
                Description:'Kills the target.',
                Priority:1,
                Stocks:99,
                Authorization:'Role Holder',
                Phase:['Night', 'Night (Full Moon)'],
                RequiredStatus:['Alive'],
                RequiredNumberOfTargets:1,
                VisitsTarget:false,
                Targetables:({user,game})=>{
                    return  game.getPlayers().filter(player=>player.getId()!=user.getId() && player.getStatus()=='Alive');
                },
                Response:async ({target})=>{
                    return `You have decided to kill **${target.getUsername()}** tonight.`
                },
                Run:({target})=>{
                    target.kill();
                    target.pushCauseOfDeath(`died to an accident.`);
                    target.pushNotif({
                        player: 'You have been killed by the Ghost!'
                    });
                },
            },
        ],
    },
    {
        id:'002',
        Name:'Student',
        Type:'Normal',
        Alignment:'Good',
        Immunities:[],
        Attack:0,
        Defense:0,
        Unique:false,
        Abilities:[
            "You can check (1) person's house at night."
        ],
        Goals:[
            'Find and lynch the ghost.'
        ],
        NightMessage:'You can use your ability now.',
        RoleMessage:'Pick (1) people to check.',
        Commands:[
            {
                Name:'check',
                Type:'Role Command',
                Cast:'Normal',
                Guide:'check <student>',
                Example:'check John',
                Description:"Checks the student's house.",
                Priority:1,
                Stocks:99,
                Authorization:'Role Holder',
                Phase:['Night', 'Night (Full Moon)'],
                RequiredStatus:['Alive'],
                RequiredNumberOfTargets:2,
                VisitsTarget:true,
                Targetables:({user,game})=>{
                    return  game.getPlayers().filter(player=>player.getId()!=user.getId() && player.getStatus()=='Alive');
                },
                Response: ({target})=>{
                    return `You have decided to check **${target.getUsername()}**'s house.`
                },
                Run:()=>{
                    return null
                },
            },
        ],
    },
            
];
