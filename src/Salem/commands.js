const util = require("./utility");

module.exports.list = [

    {
        Name:"vote",
        Guide:"vote <player>",
        Description:"Votes the target.",
        Priority:0,
        Stocks:99,
        Permission:"Player",
        Queue:"Instant",
        RequiredTargets:1,
        Phase:["Voting"],
        Status:"Alive",

        bruh:()=>{
            console.log("hello world!");
        },

        Process: (user,town,inputs)=>{
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
        Name:"unvote",
        Guide:"unvote <Player>",
        Description:"Cancels your vote.",
        Priority:0,
        Stocks:99,
        Permission:"Player",
        Queue:"Instant",
        RequiredTargets:0,
        Phase:["Voting"],
        Status:"Alive",
        
        Process:(user,town)=>{
            let body = town.removeVote(user);
            let footer = "";
            let duration = 5000;
            if(body){
                user.getHouse().updateHelper(body,footer,duration);
            }
        }
    },

    {
        Name:"cancel",
        Guide:"cancel",
        Description:"Cancels your action.",
        Priority:0,
        Stocks:99,
        Permission:"Player",
        Queue:"Instant",
        RequiredTargets:0,
        Phase:["Night","Night (Full Moon)","Voting"],
        Status:"Alive",
        
        Process:(user,town)=>{
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
        Name:"start",
        Guide:"start",
        Description:"Starts the game. (Only for hosts)",
        Priority:0,
        Stocks:99,
        Permission:"Host",
        Queue:"Instant",
        RequiredTargets:0,
        Phase:["In Lobby"],
        Status:"Alive",
        
        Process:(user,town)=>{
            if(town.getSetup().isHost(user.getId())){town.gameStart();}
        }
    },

    {
        Name:"quit",
        Guide:"quit",
        Description:"Quits the game. (Only for developers)",
        Priority:0,
        Stocks:99,
        Permission:"Admin",
        Queue:"Instant",
        RequiredTargets:0,
        Phase:["Discussion","Voting","Reporting","Defense","Judgement","Execution","Final Words","Night","Night (Full Moon)","In Lobby","Game Over"],
        Status:"Alive",
        
        Process:(town)=>{
            town.quit();
        }
    },

    {
        Name:"skip",
        Guide:"skip",
        Description:"Skips the current game. (Only for developers)",
        Priority:0,
        Stocks:99,
        Permission:"Admin",
        Queue:"Instant",
        RequiredTargets:0,
        Phase:["Discussion","Voting","Reporting","Defense","Judgement","Execution","Final Words","Night","Night (Full Moon)"],
        Status:"Alive",
        
        Process:(town)=>{
            town.getClock().skipPhase();
        }
    },

    {
        Name:"players",
        Guide:"players",
        Description:"Shows a list of players.",
        Priority:0,
        Stocks:99,
        Permission:"Player",
        Queue:"Instant",
        RequiredTargets:0,
        Phase:["Discussion","Voting","Judgement","Night","Night (Full Moon)"],
        Status:"Alive",
        
        Process:(user)=>{
            user.getHouse().updatePlayerList();
        }
    },

    {
        Name:"role",
        Guide:"role",
        Description:"Shows the user's role.",
        Priority:0,
        Stocks:99,
        Permission:"Player",
        Queue:"Instant",
        RequiredTargets:0,
        Phase:["Discussion","Voting","Judgement","Night","Night (Full Moon)"],
        Status:"Alive",
        
        Process:(user)=>{
            user.getHouse().updatePlayerCard();
        }
    },

    {
        Name:"help",
        Guide:"help",
        Description:"Shows a list of commands",
        Priority:0,
        Stocks:99,
        Permission:"Player",
        Queue:"Instant",
        RequiredTargets:0,
        Phase:["Discussion","Voting","Judgement","Night","Night (Full Moon)","In Lobby"],
        Status:"Alive",
        
        Process:(user)=>{
            user.getHouse().updateCommandList();
        }
    },

    {
        Name:"short guide",
        Guide:"shortguide",
        Description:"Shows a short guide.",
        Priority:0,
        Stocks:99,
        Permission:"Player",
        Queue:"Instant",
        RequiredTargets:0,
        Phase:["Discussion","Voting","Judgement","Night","Night (Full Moon)","In Lobby"],
        Status:"Alive",
        
        Process:(user)=>{
            user.getHouse().updateShortGuide();
        }
    },

    // {
    //     Name:"vote start",
    //     Guide:"shortguide",
    //     Description:"Shows a short guide.",
    //     Priority:0,
    //     Stocks:99,
    //     Permission:"Player",
    //     Queue:"Instant",
    //     RequiredTargets:0,
    //     Phase:["In Lobby"],
    //     Status:"Alive",
        
    //     Process:(user,town,inputs)=>{
    //         user.getHouse().updateVoteStart();
    //     }
    // },

    {
        Name:"whisper",
        Guide:"whisper <player>",
        Description:"Whispers to the target.",
        Priority:0,
        Stocks:99,
        Permission:"Player",
        Queue:"Instant",
        RequiredTargets:1,
        Phase:["Discussion","Voting","Judgement"],
        Status:"Alive",
        
        Process:(user,town,inputs)=>{
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
        Name:"change name",
        Guide:"changename <name>",
        Description:"Changes your in-game nickname.",
        Priority:0,
        Stocks:99,
        Permission:"Player",
        Queue:"Instant",
        RequiredTargets:1,
        Phase:["In Lobby"],
        Status:"Alive",
        
        Process:(user,town,inputs)=>{
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