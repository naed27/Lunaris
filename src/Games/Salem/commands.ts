import util from "./utility";

export interface Command{
    name: string,
    guide: string,
    description: string,
    priority: number,
    stocks: number,
    permission: string,
    queue: string,
    requiredTargets: number,
    phase: string [],
    status: string,
    process: any
}

export default [

    {
        name:"vote",
        guide:"vote <player>",
        description:"Votes the target.",
        priority:0,
        stocks:99,
        permission:"Player",
        queue:"Instant",
        requiredTargets:1,
        phase:["Voting"],
        status:"Alive",

        process: (user,town,inputs)=>{
            let body = "";
            let footer = "";
            let duration = 0;
            if(inputs.length>0){
                inputs = inputs.join("");
                inputs = util.splitComma(inputs);
                let targetables = town.getPlayers().filter(p=>p.getStatus()==="Alive" && p.getId()!=user.getId()); 
                if(inputs.length==1){
                  let res = town.getFunctions().areValidTargets(user,"vote",inputs,targetables,town.getPlayers());
                  if(res){
                    let voted = res[0];
                    body = town.pushVote(user,voted);
                    footer = `Type ${town.getPrefix()}cancel to cancel a vote`;
                  }
                }else{
                  body = `Please input 1 target:\n\n${town.getPrefix()}vote <player>`;
                  footer = `To see the player list, type ${town.getPrefix()}players`;
                }
            }else{
                body = `**${user.getUsername()}**, the command is:\n\n${town.getPrefix()}vote <player>.\n\nExamples:\n.vote julius caesar (full name)`;
                footer = `Type ${town.getPrefix()}players to see the player list`;
            }
            if(body){
                user.getHouse().updateHelper(body,footer,duration);
            }
        },
    },
    {
        name:"unvote",
        guide:"unvote <Player>",
        description:"Cancels your vote.",
        priority:0,
        stocks:99,
        permission:"Player",
        queue:"Instant",
        requiredTargets:0,
        phase:["Voting"],
        status:"Alive",
        
        process:(user,town)=>{
            let body = town.removeVote(user);
            let footer = "";
            let duration = 5000;
            if(body){
                user.getHouse().updateHelper(body,footer,duration);
            }
        }
    },

    {
        name:"cancel",
        guide:"cancel",
        description:"Cancels your action.",
        priority:0,
        stocks:99,
        permission:"Player",
        queue:"Instant",
        requiredTargets:0,
        phase:["Night","Night (Full Moon)","Voting"],
        status:"Alive",
        
        process:(user,town)=>{
            let phase = town.getClock().getPhase();
            let body="no message";
            let footer ="";
            let duration = 0;
            switch(phase){
                case "Night":
                case "Night(Full Moon)":
                    body = town.removeAction(user);
                    footer = "";
                    duration = 0;
                    if(body){
                        user.sendResponse(body,footer,duration);
                    }
                    break;
                case "Voting":
                    body = town.removeVote(user);
                    footer = "";
                    duration = 5000;
                    if(body){
                        user.getHouse().updateHelper(body,footer,duration);
                    }
                    break;
            }
        }
    },

    {
        name:"start",
        guide:"start",
        description:"Starts the game. (Only for hosts)",
        priority:0,
        stocks:99,
        permission:"Host",
        queue:"Instant",
        requiredTargets:0,
        phase:["In Lobby"],
        status:"Alive",
        
        process:(user,town)=>{
            if(town.getSetup().isHost(user.getId())){town.gameStart();}
        }
    },

    {
        name:"quit",
        guide:"quit",
        description:"Quits the game. (Only for developers)",
        priority:0,
        stocks:99,
        permission:"Admin",
        queue:"Instant",
        requiredTargets:0,
        phase:["Discussion","Voting","Reporting","Defense","Judgement","Execution","Final Words","Night","Night (Full Moon)","In Lobby","Game Over"],
        status:"Alive",
        
        process:(town)=>{
            town.quit();
        }
    },

    {
        name:"skip",
        guide:"skip",
        description:"Skips the current game. (Only for developers)",
        priority:0,
        stocks:99,
        permission:"Admin",
        queue:"Instant",
        requiredTargets:0,
        phase:["Discussion","Voting","Reporting","Defense","Judgement","Execution","Final Words","Night","Night (Full Moon)"],
        status:"Alive",
        
        process:(town)=>{
            town.getClock().skipPhase();
        }
    },

    {
        name:"players",
        guide:"players",
        description:"Shows a list of players.",
        priority:0,
        stocks:99,
        permission:"Player",
        queue:"Instant",
        requiredTargets:0,
        phase:["Discussion","Voting","Judgement","Night","Night (Full Moon)"],
        status:"Alive",
        
        process:(user)=>{
            user.getHouse().updatePlayerList();
        }
    },

    {
        name:"role",
        guide:"role",
        description:"Shows the user's role.",
        priority:0,
        stocks:99,
        permission:"Player",
        queue:"Instant",
        requiredTargets:0,
        phase:["Discussion","Voting","Judgement","Night","Night (Full Moon)"],
        status:"Alive",
        
        process:(user)=>{
            user.getHouse().updatePlayerCard();
        }
    },

    {
        name:"help",
        guide:"help",
        description:"Shows a list of commands",
        priority:0,
        stocks:99,
        permission:"Player",
        queue:"Instant",
        requiredTargets:0,
        phase:["Discussion","Voting","Judgement","Night","Night (Full Moon)","In Lobby"],
        status:"Alive",
        
        process:(user)=>{
            user.getHouse().updateCommandList();
        }
    },

    {
        name:"short guide",
        guide:"shortguide",
        description:"Shows a short guide.",
        priority:0,
        stocks:99,
        permission:"Player",
        queue:"Instant",
        requiredTargets:0,
        phase:["Discussion","Voting","Judgement","Night","Night (Full Moon)","In Lobby"],
        status:"Alive",
        
        process:(user)=>{
            user.getHouse().updateShortGuide();
        }
    },

    // {
    //     name:"vote start",
    //     guide:"shortguide",
    //     description:"Shows a short guide.",
    //     priority:0,
    //     stocks:99,
    //     permission:"Player",
    //     queue:"Instant",
    //     requiredTargets:0,
    //     phase:["In Lobby"],
    //     status:"Alive",
        
    //     process:(user,town,inputs)=>{
    //         user.getHouse().updateVoteStart();
    //     }
    // },

    {
        name:"whisper",
        guide:"whisper <player>",
        description:"Whispers to the target.",
        priority:0,
        stocks:99,
        permission:"Player",
        queue:"Instant",
        requiredTargets:1,
        phase:["Discussion","Voting","Judgement"],
        status:"Alive",
        
        process:(user,town,inputs)=>{
            let body = "";
            let footer = "";
            let duration = 0;
            if(inputs.length>0){
                let whisper_target = inputs[0];
                inputs.shift();
                let whisper_message = inputs.join(" ");

                let Lwrap = `‎\n\`\`\`json\n`;
                let Rwrap = `\`\`\``;

                let targetables = town.getPlayers().filter(p=>p.getStatus()==="Alive" && p.getId()!=user.getId());//
                let res = town.getFunctions().areValidTargets(user,"whisper to",[whisper_target],targetables,town.getPlayers());
                if(res){
                    let target = res[0];
                    let target_message = `‎\n**${user.getUsername()} (Whisper):** ${whisper_message}`;
                    target.getHouse().getChannel().send(target_message);
                    user.getHouse().getChannel().send(target_message);

                    let others = town.getPlayers().filter(p=>p.getId()!=user.getId() && p.getId()!=target.getId());
                    let others_message = `${Lwrap}${user.getUsername()} is whispering to ${target.getUsername()}${Rwrap}`;

                    if(others.length>0){
                        others.forEach(p => {
                            p.getHouse().getChannel().send(others_message);
                        });
                    }
                }
                
            }else{
                body = `**${user.getUsername()}**, the command is:\n\n${town.getPrefix()}whisper <player> <message>.\n\nExamples:\n${town.getPrefix()}whisper julius hello!`;
                footer = `Type ${town.getPrefix()}players to see the player list`;
            }
            if(body){
                user.getHouse().updateHelper(body,footer,duration);
            }
        }
    },

    {
        name:"change name",
        guide:"changename <name>",
        description:"Changes your in-game nickname.",
        priority:0,
        stocks:99,
        permission:"Player",
        queue:"Instant",
        requiredTargets:1,
        phase:["In Lobby"],
        status:"Alive",
        
        process:(user,town,inputs)=>{
            let body = "";
            let footer = "";
            let duration = 0;
            if(inputs.length>0){
                inputs = inputs.join(" ");
                user.setUsername(inputs);
                body=`You have set your nickname to **${inputs}**!`;
            }else{
                body = `**${user.getUsername()}**, the command is:\n\n${town.getPrefix()}changename <name>\n\nExamples:\n${town.getPrefix()}cn julius`;
            }
            if(body){
                user.sendResponse(body,footer,duration);
            }
        }
    },
    
  
    

];