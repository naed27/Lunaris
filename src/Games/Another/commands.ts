import { jsonWrap } from '../../Helpers/toolbox';
import { AnotherCommand } from './roles';

const commands: AnotherCommand[] = [

    {
        name:'vote',
        type:'Player Command',
        cast:'Instant',
        guide:'vote <player>',
        description:'Votes the target.',
        priority:0,
        stocks:99,
        authorization:'Player',
        queue: 'Normal',
        phase:['Voting'],
        requiredStatus:['Alive'],
        targetCount:1,
        lethal:false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],
        targetables: ({user,game}) =>
            game.getPlayers().filter(player=>player.getId()!=user.getId() && player.isAlive()),
        callResponse: () => null,
        run: ({user,game,targetOne: target})=>{
            game.pushVote({voter: user, voted: target});      
            game.getFunctions().messagePlayers(`**${user.getUsername()}** has voted for **${target.getUsername()}**.`);
        },
    },
    {
        name:'unvote',
        type:'Player Command',
        cast:'Instant',
        guide:'unvote <Player>',
        description:'Cancels your vote.',
        priority:0,
        stocks:99,
        authorization:'Player',
        queue: 'Normal',
        phase:['Voting'],
        requiredStatus:['Alive'],
        targetCount:0,
        lethal:false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:({game, user}) => {
            const oldVote = game.getVotes().find(vote=>vote.voter.getId()===user.getId());
            if(oldVote) return [oldVote.voted];
            return [];
        },
        targetables: ({user,game})=>
            game.getPlayers().filter(player=>player.getId()!=user.getId() && player.getStatus()=='Alive'),
        callResponse: () => null,
        run:({user,game})=>{
            const response = game.removeVoteOf(user);
            game.getFunctions().messagePlayers(response);
        }
    },

    {
        name:'cancel',
        type:'Player Command',
        cast:'Instant',
        guide:'cancel',
        description:'Cancels your action.',
        priority:0,
        stocks:99,
        authorization:'Player',
        queue: 'Normal',
        phase:['Night','Night (Full Moon)','Voting'],
        requiredStatus:['Alive'],
        targetCount:0,
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
        type:'Player Command',
        cast:'Instant',
        guide:'start',
        description:'Starts the game. (Only for hosts)',
        priority:0,
        stocks:99,
        authorization:'Host',
        queue:'Normal',
        phase:['Lobby'],
        requiredStatus:['Alive','Dead'],
        targetCount:0,
        lethal:false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],
        targetables: () => [],
        callResponse: () => null,
        run:({user,game})=> game.isHost(user) && game.gameStart(),
    },

    {
        name:'quit',
        type:'Player Command',
        cast:'Instant',
        guide:'quit',
        description:'Quits the game. (Only for developers)',
        priority:0,
        stocks:99,
        authorization:'Admin',
        queue:'Normal',
        phase:['Discussion','Voting','Reporting','Defense','Judgement','Execution','Final Words','Night','Night (Full Moon)','In Lobby','Game Over'],
        requiredStatus:['Alive','Dead'],
        targetCount:0,
        lethal:false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],
        targetables: () => [],
        callResponse: () => null,
        run:({game})=>game.quit(),
    },

    {
        name:'skip',
        type:'Player Command',
        cast:'Instant',
        guide:'skip',
        description:'Skips the current game. (Only for developers)',
        priority:0,
        stocks:99,
        authorization:'Admin',
        queue:'Normal',
        phase:['Discussion','Voting','Reporting','Defense','Judgement','Execution','Final Words','Night','Night (Full Moon)','In Lobby','Game Over'],
        requiredStatus:['Alive','Dead'],
        lethal:false,
        targetCount:0,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],
        targetables: () => [],
        callResponse: () => null,
        run:({game})=>game.getClock().skipPhase()
    },

    {
        name:'players',
        type:'Player Command',
        cast:'Instant',
        guide:'players',
        description:'Shows a list of players.',
        priority:0,
        stocks:99,
        authorization:'Player',
        queue:'Normal',
        phase:['Discussion','Voting','Judgement','Night','Night (Full Moon)'],
        requiredStatus:['Alive'],
        targetCount:0,
        lethal:false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],
        targetables:() => [],
        callResponse:() => null,
        run:({user})=>user.getChannelManager().managerPlayerList().create()
    },

    {
        name:'role',
        type:'Player Command',
        cast:'Instant',
        guide:'role',
        description:"Shows the user's role.",
        priority:0,
        stocks:99,
        authorization:'Player',
        queue:'Normal',
        phase:['Discussion','Voting','Judgement','Night','Night (Full Moon)'],
        requiredStatus:['Alive'],
        targetCount:0,
        lethal:false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],
        targetables:() => [],
        callResponse:() => null,
        run:({user})=>user.getChannelManager().managePlayersRole().create()
    },

    {
        name:'help',
        type:'Player Command',
        cast:'Instant',
        guide:'help',
        description:'Shows a list of commands',
        priority:0,
        stocks:99,
        authorization:'Player',
        queue:'Normal',
        phase:['Discussion','Voting','Reporting','Defense','Judgement','Execution','Final Words','Night','Night (Full Moon)','In Lobby','Game Over'],
        requiredStatus:['Alive'],
        targetCount:0,
        lethal:false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],
        targetables:() => [],
        callResponse:() => null,
        run:({user})=>user.getChannelManager().manageAvailableCommands().create()
    },

    {
        name:'short guide',
        type:'Player Command',
        cast:'Instant',
        guide:'shortguide',
        description:'Shows a short guide.',
        priority:0,
        stocks:99,
        authorization:'Player',
        queue:'Normal',
        phase:['Discussion','Voting','Reporting','Defense','Judgement','Execution','Final Words','Night','Night (Full Moon)','In Lobby','Game Over'],
        requiredStatus:['Alive'],
        targetCount:0,
        lethal:false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],
        targetables:() => [],
        callResponse:() => null,
        run:({user})=>user.getChannelManager().manageGuide().create()
    },


    {
        name:'whisper',
        type:'Player Command',
        cast:'Instant',
        guide:'whisper <player> <message>',
        description:'Whispers to the target.',
        priority:0,
        stocks:99,
        authorization:'Player',
        queue:'Normal',
        phase:['Discussion','Voting','Judgement','In Lobby'],
        requiredStatus:['Alive'],
        targetCount:1,
        lethal:false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],
        targetables:({user,game})=>game.getAlivePlayers().filter(player=>player.getId()!==user.getId()),
        callResponse:() => null,
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
        type:'Player Command',
        cast:'Instant',
        guide:'changename <name>',
        description:'Changes your in-game nickname.',
        priority:0,
        stocks:99,
        authorization:'Player',
        queue:'Normal',
        phase:['In Lobby'],
        requiredStatus:['Alive'],
        targetCount:0,
        lethal:false,
        performer:({ user }) => user,
        visitsTarget:() => false,
        defaultTarget:() => [],
        targetables:() => [],
        callResponse:() => null,
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

export default commands;