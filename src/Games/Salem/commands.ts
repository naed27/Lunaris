import { jsonWrap, splitStringByComma } from '../../Helpers/toolbox';
import { SalemCommand } from './roles';


const commands: SalemCommand[] =  [

    {
        name:'vote',
        guide:'vote <player>',
        description:'Votes the target.',
        priority:0,
        stocks:99,
        permission:'Player',
        queue:'Instant',
        targetCount:1,
        phase:['Voting'],
        requiredStatus:['Alive'],
        lethal: false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],        
        targetables: () => [],
        callResponse: () => null,
        run: ({user,game,targetOne: target})=>{
            game.pushVote({voter: user, voted: target});      
            game.getFunctions().messagePlayers(`**${user.getUsername()}** has voted for **${target.getUsername()}**.`);
        },
    },
    {
        name:'unvote',
        guide:'unvote <Player>',
        description:'Cancels your vote.',
        priority:0,
        stocks:99,
        permission:'Player',
        queue:'Instant',
        targetCount:0,
        phase:['Voting'],
        requiredStatus:['Alive'],
        lethal: false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],        
        targetables: () => [],
        callResponse: () => null,
        run:({user,game})=>{
            const response = game.removeVoteOf(user);
            game.getFunctions().messagePlayers(response);
        }
    },

    {
        name:'cancel',
        guide:'cancel',
        description:'Cancels your action.',
        priority:0,
        stocks:99,
        permission:'Player',
        queue:'Instant',
        targetCount:0,
        phase:['Night','Night (Full Moon)','Voting'],
        requiredStatus:['Alive','Dead'],
        lethal: false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],        
        targetables: () => [],
        callResponse: () => null,
        run:({user,game})=>{
            const phase = game.getClock().getPhase().name;
            if(phase !=='Night' && phase !=='Voting') return
            if(phase === 'Night') return game.getFunctions().messagePlayers(game.removeActionOf(user));
            if(phase === 'Voting') return game.getFunctions().messagePlayers(game.removeVoteOf(user));
        }
    },

    {
        name:'start',
        guide:'start',
        description:'Starts the game. (Only for hosts)',
        priority:0,
        stocks:99,
        permission:'Host',
        queue:'Instant',
        targetCount:0,
        phase:['In Lobby'],
        requiredStatus:['Alive'],
        lethal: false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],        
        targetables: () => [],
        callResponse: () => null,
        run:({user,game})=> game.isHost(user) && game.gameStart(),
    },

    {
        name:'quit',
        guide:'quit',
        description:'Quits the game. (Only for developers)',
        priority:0,
        stocks:99,
        permission:'Admin',
        queue:'Instant',
        targetCount:0,
        phase:['Discussion','Voting','Reporting','Defense','Judgement','Execution','Final Words','Night','Night (Full Moon)','In Lobby','Game Over'],
        requiredStatus:['Alive','Dead'],
        lethal: false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],        
        targetables: () => [],
        callResponse: () => null,
        run:({game}) => game.quit()
    },

    {
        name:'skip',
        guide:'skip',
        description:'Skips the current game. (Only for developers)',
        priority:0,
        stocks:99,
        permission:'Admin',
        queue:'Instant',
        targetCount:0,
        phase:['Discussion','Voting','Reporting','Defense','Judgement','Execution','Final Words','Night','Night (Full Moon)'],
        requiredStatus:['Alive','Dead'],
        lethal: false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],        
        targetables: () => [],
        callResponse: () => null,
        run:({game}) => game.getClock().skipPhase()
    },

    {
        name:'players',
        guide:'players',
        description:'Shows a list of players.',
        priority:0,
        stocks:99,
        permission:'Player',
        queue:'Instant',
        targetCount:0,
        phase:['Discussion','Voting','Judgement','Night','Night (Full Moon)'],
        requiredStatus:['Alive','Dead'],
        lethal: false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],        
        targetables: () => [],
        callResponse: () => null,
        run:({user})=>user.getChannelManager().managerPlayerList().create()
    },

    {
        name:'role',
        guide:'role',
        description:"Shows the user's role.",
        priority:0,
        stocks:99,
        permission:'Player',
        queue:'Instant',
        targetCount:0,
        phase:['Discussion','Voting','Judgement','Night','Night (Full Moon)'],
        requiredStatus:['Alive','Dead'],
        lethal: false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],        
        targetables: () => [],
        callResponse: () => null,
        run:({user})=>user.getChannelManager().managePlayersRole().create()
    },

    {
        name:'help',
        guide:'help',
        description:'Shows a list of commands',
        priority:0,
        stocks:99,
        permission:'Player',
        queue:'Instant',
        targetCount:0,
        phase:['Discussion','Voting','Judgement','Night','Night (Full Moon)','In Lobby'],
        requiredStatus:['Alive','Dead'],
        lethal: false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],        
        targetables: () => [],
        callResponse: () => null,
        run:({user})=>user.getChannelManager().manageAvailableCommands().create()
    },

    {
        name:'short guide',
        guide:'shortguide',
        description:'Shows a short guide.',
        priority:0,
        stocks:99,
        permission:'Player',
        queue:'Instant',
        targetCount:0,
        phase:['Discussion','Voting','Judgement','Night','Night (Full Moon)','In Lobby'],
        requiredStatus:['Alive','Dead'],
        lethal: false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],        
        targetables: () => [],
        callResponse: () => null,
        run:({user})=>user.getChannelManager().manageGuide().create()
    },

    {
        name:'whisper',
        guide:'whisper <player>',
        description:'Whispers to the target.',
        priority:0,
        stocks:99,
        permission:'Player',
        queue:'Instant',
        targetCount:1,
        phase:['Discussion','Voting','Judgement'],
        requiredStatus:['Alive'],
        lethal: false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],        
        targetables: () => [],
        callResponse: () => null,
        run:({user,game,targetOne: target,args})=>{
            const parseArgs = args.join(' ');
            const whisperMessage = jsonWrap(`**${user.getUsername()} (Whisper):** ${parseArgs}`);
            user.getChannelManager().send(whisperMessage);
            target.getChannelManager().send(whisperMessage);

            const others = game.getPlayers().filter(player=>player.getId()!=user.getId() && player.getId()!=target.getId());
            const observation = jsonWrap(`${user.getUsername()} is whispering to ${target.getUsername()}`);
            others.forEach(p => p.getChannelManager().send(observation));
        }
    },

    {
        name:'change name',
        guide:'changename <name>',
        description:'Changes your in-game nickname.',
        priority:0,
        stocks:99,
        permission:'Player',
        queue:'Instant',
        targetCount:1,
        phase:['In Lobby'],
        requiredStatus:['Alive'],
        lethal: false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],        
        targetables: () => [],
        callResponse: () => null,
        run:({user,args})=>{
            const message = args.join(' ');
            if(args.length>0){
                user.setUsername(message);
                const response = jsonWrap(`Your name has been changed to ${message}`)
                user.getChannelManager().send(response);
            }else{
                const response = jsonWrap(`Please enter a name.`)
                user.getChannelManager().send(response);
            }   
        }
    },
    
];

export default commands