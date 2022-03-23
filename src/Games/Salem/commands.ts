import { jsonWrap } from '../../Helpers/toolbox';
import { SalemCommand } from './roles';


const commands: SalemCommand[] =  [

  {
    name:'vote',
    guide:'vote <player>',
    description:'Votes the target.',
    priority:0,
    stocks:99,
    type:'Action Command',
    queue:'Instant',
    targetCount:1,
    phase:['Voting'],
    requiredStatus:['Alive'],
    lethal: false,
    hasMenu: true,
    hasArguments: false,
    inputSeparator:' ',
    performer:({ user: user }) => user,
    visitsTarget:() => false,
    defaultTarget:() => [],        
    targetables: ({game,user: user}) => {
      return game.getPlayers().filter(player => player.isAlive() && player.getId() !== user.getId())
    },
    callResponse: () => null,
    run: ({performer,game,firstTarget: target}) => {
      if(target==='None') return game.removeVoteOf(performer);
      game.pushVote({voter: performer, voted: target})
    },
  },
  {
    name:'unvote',
    guide:'unvote <Player>',
    description:'Cancels your vote.',
    priority:0,
    stocks:99,
    type:'Action Command',
    queue:'Instant',
    targetCount:0,
    phase:['Voting'],
    requiredStatus:['Alive'],
    lethal: false,
    hasMenu: false,
    hasArguments: false,
    inputSeparator:' ',
    performer:({ user: user }) => user,
    visitsTarget:() => false,
    defaultTarget:() => [],        
    targetables: () => [],
    callResponse: () => null,
    run:({user,game}) => game.removeVoteOf(user) ? user.alert('Your vote has been removed.') : user.alert('You have not voted yet.'),
  },

  {
    name:'cancel',
    guide:'cancel',
    description:'Cancels your action.',
    priority:0,
    stocks:99,
    type:'Universal Command',
    queue:'Instant',
    targetCount:0,
    phase:['Night','Voting', 'Discussion', 'Judgement'],
    requiredStatus:['Alive','Dead'],
    lethal: false,
    hasMenu: false,
    hasArguments: false,
    inputSeparator:' ',
    performer:({ user: user }) => user,
    visitsTarget:() => false,
    defaultTarget:() => [],        
    targetables: () => [],
    callResponse: () => null,
    run: async ({user,game})=>{
      const phase = game.getClock().getPhase().name;
      if(phase !=='Night' && phase !=='Voting') return
      phase !== 'Voting' && game.removeActionOf(user) ? user.alert('Your action has been cancelled.') : user.alert('You have not made any actions yet.')
      phase === 'Voting' && game.removeVoteOf(user) ? user.alert('Your vote has been cancelled.') : user.alert('You have not voted yet.')
    }
  },

  {
    name:'start',
    guide:'start',
    description:'Starts the game. (Only for hosts)',
    priority:0,
    stocks:99,
    type:'Host Command',
    queue:'Instant',
    targetCount:0,
    phase:['Lobby'],
    requiredStatus:['Alive'],
    lethal: false,
    hasMenu: false,
    hasArguments: false,
    inputSeparator:' ',
    performer:({ user: user }) => user,
    visitsTarget:() => false,
    defaultTarget:() => [],        
    targetables: () => [],
    callResponse: () => null,
    run: async ({user,game}) => game.isHost(user) && await game.gameStart(),
  },

  {
    name:'quit',
    guide:'quit',
    description:'Quits the game. (Only for developers)',
    priority:0,
    stocks:99,
    type:'Admin Command',
    queue:'Instant',
    targetCount:0,
    phase:['Discussion','Voting','Reporting','Defense','Judgement','Execution','Final Words','Night','Lobby','Game Over'],
    requiredStatus:['Alive','Dead'],
    lethal: false,
    hasMenu: false,
    hasArguments: false,
    inputSeparator:' ',
    performer:({ user: user }) => user,
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
    type:'Admin Command',
    queue:'Instant',
    targetCount:0,
    phase:['Discussion','Voting','Reporting','Defense','Judgement','Execution','Final Words','Night'],
    requiredStatus:['Alive','Dead'],
    lethal: false,
    hasMenu: false,
    hasArguments: false,
    inputSeparator:' ',
    performer:({ user: user }) => user,
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
    type:'Universal Command',
    queue:'Instant',
    targetCount:0,
    phase:['Discussion','Voting','Judgement','Night'],
    requiredStatus:['Alive','Dead'],
    lethal: false,
    hasMenu: false,
    hasArguments: false,
    inputSeparator:' ',
    performer:({ user: user }) => user,
    visitsTarget:() => false,
    defaultTarget:() => [],        
    targetables: () => [],
    callResponse: () => null,
    run:({user}) => user.getChannelManager().managePlayerList().create()
  },

  {
    name:'role',
    guide:'role',
    description:"Shows the user's role.",
    priority:0,
    stocks:99,
    type:'Universal Command',
    queue:'Instant',
    targetCount:0,
    phase:['Discussion','Voting','Judgement','Night'],
    requiredStatus:['Alive','Dead'],
    lethal: false,
    hasMenu: false,
    hasArguments: false,
    inputSeparator:' ',
    performer:({ user: user }) => user,
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
    type:'Universal Command',
    queue:'Instant',
    targetCount:0,
    phase:['Discussion','Voting','Judgement','Night','Lobby'],
    requiredStatus:['Alive','Dead'],
    lethal: false,
    hasMenu: false,
    hasArguments: false,
    inputSeparator:' ',
    performer:({ user: user }) => user,
    visitsTarget:() => false,
    defaultTarget:() => [],        
    targetables: () => [],
    callResponse: () => null,
    run:({user})=>user.getChannelManager().manageAvailableCommands().create()
  },

  // {
  //   name:'shortguide',
  //   guide:'shortguide',
  //   description:'Shows a short guide.',
  //   priority:0,
  //   stocks:99,
  //   permission:'Player',
  //   queue:'Instant',
  //   targetCount:0,
  //   phase:['Discussion','Voting','Judgement','Night','Lobby'],
  //   requiredStatus:['Alive','Dead'],
  //   lethal: false,
  //   hasMenu: false,
  //   hasArguments: false,
  //   inputSeparator:' ',
  //   performer:({ user: user }) => user,
  //   visitsTarget:() => false,
  //   defaultTarget:() => [],        
  //   targetables: () => [],
  //   callResponse: () => null,
  //   run:({user})=>user.getChannelManager().manageWelcomeGuide().create()
  // },

  {
    name:'whisper',
    guide:'whisper <player>',
    description:'Whispers to the target.',
    priority:0,
    stocks:99,
    type:'Universal Command',
    queue:'Instant',
    targetCount:1,
    phase:['Discussion','Voting','Judgement'],
    requiredStatus:['Alive'],
    lethal: false,
    hasMenu: false,
    hasArguments: true,
    inputSeparator:' ',
    performer:({ user: user }) => user,
    visitsTarget:() => false,
    defaultTarget:() => [],        
    targetables: ({ game, user: user }) => {
      return  game.getPlayers().filter(p => p.getStatus() === 'Alive' && p.getId() !== user.getId())
    },
    callResponse: () => null,
    run:({user,game,firstTarget: target,args})=>{
      if(target === 'None') return
      const parseArgs = args.join(' ');
      const whisperMessage = `**${user.getUsername()} (Whisper):** ${parseArgs}`;
      user.getChannelManager().sendString(whisperMessage);
      target.getChannelManager().sendString(whisperMessage);

      const others = game.getPlayers().filter(player=>player.getId()!=user.getId() && player.getId()!=target.getId());
      const observation = jsonWrap(`${user.getUsername()} is whispering to ${target.getUsername()}`);
      others.forEach(p => p.getChannelManager().sendString(observation));
    }
  },

  {
    name:'changename',
    guide:'changename <name>',
    description:'Changes your in-game nickname.',
    priority:0,
    stocks:99,
    type:'Universal Command',
    queue:'Instant',
    targetCount:0,
    phase:['Lobby'],
    requiredStatus:['Alive'],
    lethal: false,
    hasMenu: false,
    hasArguments: true,
    inputSeparator:' ',
    performer:({ user: user }) => user,
    visitsTarget:() => false,
    defaultTarget:() => [],        
    targetables: () => [],
    callResponse: () => null,
    run:({user,args})=>{
      const message = args.join(' ');
      if(args.length>0){
        user.setUsername(message);
        const response = jsonWrap(`Your name has been changed to ${message}`)
        user.getChannelManager().sendString(response);
      }else{
        const response = jsonWrap(`Please enter a name.`)
        user.getChannelManager().sendString(response);
      }   
    }
  },
    
];

export default commands