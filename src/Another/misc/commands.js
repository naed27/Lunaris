const {splitComma} = require('../../Helpers/toolbox')
const {wrap} = require('../utility/utility')
const  res = require('./responses')


module.exports = [

    {
        Name:'vote',
        Type:'Player Command',
        Cast:'Instant',
        Guide:'vote <player>',
        Description:'Votes the target.',
        Priority:0,
        Stocks:99,
        Authorization:'Player',
        RequiredNumberOfTargets:1,
        Phase:['Voting'],
        RequiredStatus:['Alive'],

        Targetables: ({user,game})=>{
            return  game.getPlayers().filter(player=>player.getId()!=user.getId() && player.getStatus()=='Alive');
        },

        Response: ()=>{
            return null
        },

        Run: ({user,game,target})=>{
            let body = '';
            let footer = '';
            let duration = 0;
            if(target.length>0){
                target = target.join('');
                target = splitComma(target);
                let targetables = game.getPlayers().filter(p=>p.getStatus()==='Alive' && p.getId()!=user.getId()); 
                if(target.length==1){
                  let res = game.getFunctions().areValidTargets(user,'vote',target,targetables,game.getPlayers());
                  if(res){
                    let voted = res[0];
                    body = game.pushVote(user,voted);
                    footer = `Type ${game.getPrefix()}cancel to cancel a vote`;
                  }
                }else{
                  body = `Please input 1 target:\n\n${game.getPrefix()}vote <player>`;
                  footer = `To see the player list, type ${game.getPrefix()}players`;
                }
            }else{
                body = `**${user.getUsername()}**, the command is:\n\n${game.getPrefix()}vote <player>.\n\nExamples:\n.vote julius caesar (full name)`;
                footer = `Type ${game.getPrefix()}players to see the player list`;
            }
            if(body){
                user.getPersonalChannel().updateHelper(body,footer,duration);
            }
        },
    },
    {
        Name:'unvote',
        Type:'Player Command',
        Cast:'Instant',
        Guide:'unvote <Player>',
        Description:'Cancels your vote.',
        Priority:0,
        Stocks:99,
        Authorization:'Player',
        RequiredNumberOfTargets:0,
        Phase:['Voting'],
        RequiredStatus:['Alive'],

        Targetables: ({user,game})=>{
            return  game.getPlayers().filter(player=>player.getId()!=user.getId() && player.getStatus()=='Alive');
        },
        
        Response: ()=>{
            return null
        },
        
        Run:({user,game})=>{
            let body = game.removeVote(user);
            let footer = '';
            let duration = 5000;
            if(body){
                user.getPersonalChannel().updateHelper(body,footer,duration);
            }
        }
    },

    {
        Name:'cancel',
        Type:'Player Command',
        Cast:'Instant',
        Guide:'cancel',
        Description:'Cancels your action.',
        Priority:0,
        Stocks:99,
        Authorization:'Player',
        RequiredNumberOfTargets:0,
        Phase:['Night','Night (Full Moon)','Voting'],
        RequiredStatus:['Alive'],
        
        Run:({user,game})=>{
            let phase = game.getClock().getPhase();
            let body='no message';
            let footer ='';
            let duration = 0;
            switch(phase){
                case 'Night':
                case 'Night(Full Moon)':
                    body = game.removeAction(user);
                    footer = '';
                    duration = 0;
                    if(body){
                        user.sendResponse(body,footer,duration);
                    }
                    break;
                case 'Voting':
                    body = game.removeVote(user);
                    footer = '';
                    duration = 5000;
                    if(body){
                        user.getPersonalChannel().updateHelper(body,footer,duration);
                    }
                    break;
            }
        }
    },

    {
        Name:'start',
        Type:'Player Command',
        Cast:'Instant',
        Guide:'start',
        Description:'Starts the game. (Only for hosts)',
        Priority:0,
        Stocks:99,
        Authorization:'Host',
        RequiredNumberOfTargets:0,
        Phase:['In Lobby'],
        RequiredStatus:['Alive','Dead'],
        
        Run:({user,game})=>{
            if(game.getSetup().isHost(user.getId())){game.gameStart();}
        }
    },

    {
        Name:'quit',
        Type:'Player Command',
        Cast:'Instant',
        Guide:'quit',
        Description:'Quits the game. (Only for developers)',
        Priority:0,
        Stocks:99,
        Authorization:'Admin',
        RequiredNumberOfTargets:0,
        Phase:['Discussion','Voting','Reporting','Defense','Judgement','Execution','Final Words','Night','Night (Full Moon)','In Lobby','Game Over'],
        RequiredStatus:['Alive','Dead'],
        
        Run:({game})=>{
            game.quit();
        }
    },

    {
        Name:'skip',
        Type:'Player Command',
        Cast:'Instant',
        Guide:'skip',
        Description:'Skips the current game. (Only for developers)',
        Priority:0,
        Stocks:99,
        Authorization:'Admin',
        RequiredNumberOfTargets:0,
        Phase:['Discussion','Voting','Reporting','Defense','Judgement','Execution','Final Words','Night','Night (Full Moon)','In Lobby','Game Over'],
        RequiredStatus:['Alive','Dead'],
        
        Run:({game})=>{
            game.getClock().skipPhase();
        }
    },

    {
        Name:'players',
        Type:'Player Command',
        Cast:'Instant',
        Guide:'players',
        Description:'Shows a list of players.',
        Priority:0,
        Stocks:99,
        Authorization:'Player',
        RequiredNumberOfTargets:0,
        Phase:['Discussion','Voting','Judgement','Night','Night (Full Moon)'],
        RequiredStatus:['Alive'],
        
        Run:({user})=>{
            user.getPersonalChannel().updatePlayerList();
        }
    },

    {
        Name:'role',
        Type:'Player Command',
        Cast:'Instant',
        Guide:'role',
        Description:"Shows the user's role.",
        Priority:0,
        Stocks:99,
        Authorization:'Player',
        RequiredNumberOfTargets:0,
        Phase:['Discussion','Voting','Judgement','Night','Night (Full Moon)'],
        RequiredStatus:['Alive'],
        
        Run:({user})=>{
            user.getPersonalChannel().updatePlayerCard();
        }
    },

    {
        Name:'help',
        Type:'Player Command',
        Cast:'Instant',
        Guide:'help',
        Description:'Shows a list of commands',
        Priority:0,
        Stocks:99,
        Authorization:'Player',
        RequiredNumberOfTargets:0,
        Phase:['Discussion','Voting','Reporting','Defense','Judgement','Execution','Final Words','Night','Night (Full Moon)','In Lobby','Game Over'],
        RequiredStatus:['Alive'],
        
        Run:({user})=>{
            user.getPersonalChannel().showCommandList();
        }
    },

    {
        Name:'short guide',
        Type:'Player Command',
        Cast:'Instant',
        Guide:'shortguide',
        Description:'Shows a short guide.',
        Priority:0,
        Stocks:99,
        Authorization:'Player',
        RequiredNumberOfTargets:0,
        Phase:['Discussion','Voting','Reporting','Defense','Judgement','Execution','Final Words','Night','Night (Full Moon)','In Lobby','Game Over'],
        RequiredStatus:['Alive'],
        
        Run:({user})=>{
            user.getPersonalChannel().updateShortGuide();
        }
    },


    {
        Name:'whisper',
        Type:'Player Command',
        Cast:'Instant',
        Guide:'whisper <player>',
        Description:'Whispers to the target.',
        Priority:0,
        Stocks:99,
        Authorization:'Player',
        RequiredNumberOfTargets:1,
        Phase:['Discussion','Voting','Judgement','In Lobby'],
        RequiredStatus:['Alive'],

        Targetables:({user,game})=>{
            return  game.getPlayers().filter(player=>player.getId()!=user.getId() && player.getStatus()=='Alive');
        },
        
        Run:({user,game,target,args})=>{
      
            const whisper = `‎\n**${user.getUsername()} (Whisper):** ${args}`;
            target.getPersonalChannel().getDiscordConnection().send(whisper);
            user.getPersonalChannel().getDiscordConnection().send(whisper);

            const others = game.getPlayers().filter(player=>player.getId()!=user.getId() && player.getId()!=target.getId());
            const observation = `${user.getUsername()} is whispering to ${target.getUsername()}`;

            others.forEach(p => {
                p.getPersonalChannel().getDiscordConnection().send(wrap(observation));
            });
        }
    },

    {
        Name:'change name',
        Type:'Player Command',
        Cast:'Instant',
        Guide:'changename <name>',
        Description:'Changes your in-game nickname.',
        Priority:0,
        Stocks:99,
        Authorization:'Player',
        RequiredNumberOfTargets:0,
        Phase:['In Lobby'],
        RequiredStatus:['Alive'],
        
        Run:({user,command,args})=>{
            args = args.join( ' ' );
            if(args.length>0){
                user.setUsername( args );
                user.getPersonalChannel().messageChannel( res.nicknameChanged(args) );
            }else{
                user.getPersonalChannel().messageChannel( res.pleaseProvideAnArgument(command) );
            }   
        }
    },
    
  
    

];