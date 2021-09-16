const util = require("./utility");
const Role = require("./role");

module.exports.list = [
        {
            id:"001",
            Name:"Jailor",
            Alignment:"Town",
            Type:"Killing",
            Immunities:[],
            Attack:3,
            Defense:0,
            Unique:true,
            Results:{
                Investigator:"Your target could be a Spy, Blackmailer, or Jailor.",
                Sheriff:"Your target seems innocent.",
                Consigliere:"Your target seems to be the Jailor."
            },
            Abilities:[
                "You can jail 1 Person each night.",
                "You can talk to the jailed person."
            ],
            Goals:[
                "Lynch/kill all of the evildoers."
            ],
            NightMessage:"You can talk to the detained person.",
            RoleMessage:"",
            Friendlies:["Town","Survivor","Amnesiac","Jester","Executioner"],
            Commands:[
                {   
                    Name:"jail",
                    Guide:"jail <player>",
                    Description:"Jails a person for one night.",
                    Priority:1,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    Phase:["Discussion", "Voting", "Judgement", "Defense", "Final Words", "Execution"],
                    Status:"Alive",
                    RequiredTargets:1,
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return false;
                    },
                    ValidTargets:(user,town)=>{
                        let targetables =  town.getPlayers().filter(p=>p.getId()!=user.getId() && p.getStatus()=="Alive");
                        return targetables;
                    },
                    ActionResponse:async (inputs)=>{
                        return `You have decided to jail **${inputs[0].getUsername()}**.`
                    },
                    Act:(user,targets)=>{
                        const target = targets[0];
                        target.setJailStatus(true);
                        let notif1 = {
                            player: "You have been hauled off to jail!\nYou are now alone with the jailor.",
                            spy: null
                        }
                        target.pushNotif(notif1);

                        let exe = user.getRole().getCommands().filter(c=>c.getName()=="execute")[0];
                        exe.setStocks(exe.setStocks(1));
                    },
                },
                {
                    Name:"execute",
                    Guide:"execute",
                    Description:"Executes the currently jailed person.",
                    Priority:1,
                    Stocks:0,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    RequiredTargets:0,
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return false;
                    },
                    AutoTargets:(town)=>{
                        if(town.getJailedPerson()){
                            return [town.getJailedPerson()];
                        }else{
                            return null
                        }
                    },
                    ActionResponse:async (user,town)=>{
                        if(town.getJailedPerson()){
                            let channel = town.getJailedPerson().getHouse().getChannel();
                            let body = `The jailor has decided to execute you.`;
                            let footer = "";
                            let duration = 0
                            user.sendResponse(body,footer,duration,channel);
                            return `You have decided to execute **${town.getJailedPerson().getUsername()}**.`
                        }else{
                            return `No one is jailed. You can't execute anyone.`
                        }
                    },
                    Act:(user,performer,command,targets)=>{
                        command.setStocks(command.setStocks(0));
                        if(targets){
                            let target = targets[0];
                            if(target.getJailStatus()==true){
                                target.kill();
                                target.pushCauseOfDeath(`executed by the Jailor.`);
                                let notif1 = {
                                    player: "You have been executed by the Jailor!",
                                    spy: "Your target was in jail."
                                }
                                target.pushNotif(notif1);
                            }
                        }
                    },
                },
            ],
        },
        {
            id:"013",
            Name:"Transporter",
            Alignment:"Town",
            Type:"Support",
            Immunities:["Roleblock","Control"],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Escort, Transporter, or Consort.",
                Sheriff:"Your target seems innocent.",
                Consigliere:"Your target seems to be a Transporter."
            },
            Abilities:[
                "You can swap 2 people's places each night."
            ],
            Goals:[
                "Lynch all of the enemies of the Town."
            ],
            NightMessage:"You can use your ability now.",
            RoleMessage:"Pick (2) people to swap. (letter)",
            Friendlies:["Town","Survivor","Amnesiac","Jester","Executioner"],
            Commands:[
                {
                    Name:"transport",
                    Guide:"transport <player 1>, <player 2>",
                    Description:"Swaps the two targets of their locations.",
                    Priority:1,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:2,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(town)=>{
                        let targetables =  town.getPlayers().filter(p=>p.getStatus()=="Alive");
                        return targetables;
                    },
                    ActionResponse:async (inputs)=>{
                        return `You have decided to swap **${inputs[0].getUsername()}** and **${inputs[1].getUsername()}**.`
                    },
                    Act:(targets,town)=>{
                        let p1 = targets[0];
                        let p2 = targets[1];
                        town.getActions().forEach(a => {
                            if(a.getCommand().getName()!="tranport"){
                                switch(a.getFirstTarget().getId()){
                                    case p1.getId():
                                        a.setFirstTarget(p2);
                                        break;
                                    case p2.getId():
                                        a.setFirstTarget(p1);
                                        break;
                                       
                                }
                            }
                        });
                        let notif1 = {
                            player: "You have been transported!",
                            spy: "Your target was transported!"
                        }
                        p1.pushNotif(notif1);
                        p2.pushNotif(notif1);
                    },
                },
            ],
        },
        {
            id:"005",
            Name:"Veteran",
            Alignment:"Town",
            Type:"Killing",
            Immunities:["Roleblock","Control"],
            Attack:2,
            Defense:0,
            Unique:true,
            Results:{
                Investigator:"Your target could be a Vigilante, Veteran, or Mafioso.",
                Sheriff:"Your target seems innocent.",
                Consigliere:"Your target seems to be a Veteran."
            },
            Abilities:[
                "You can kill people who visit you. (3 uses)",
            ],
            Goals:[
                "Lynch/kill all of the enemies of the Town."
            ],
            NightMessage:"Choose whether to alert or not.",
            RoleMessage:"Click [o] to alert, [x] to cancel.",
            Friendlies:["Town","Survivor","Amnesiac","Jester","Executioner"],
            Commands:[
                {
                    Name:"alert",
                    Guide:"alert",
                    Description:"Kills anyone who visits you at night.",
                    Priority:1,
                    Stocks:4,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:0,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return false;
                    },
                    AutoTargets:(user)=>{
                        return [user];
                    },
                    ActionResponse:async ()=>{
                        return `You have decided to stay on alert for tonight.`
                    },
                    Act:(performer,command)=>{
                        let stonks = command.getStocks();
                        command.setStocks(stonks-1);
                        performer.pushBuff("Alert");
                    },
                },
            ],
        },
        {
            id:"206",
            Name:"Witch",
            Alignment:"Neutral",
            Type:"Evil",
            Immunities:["Roleblock","Control"],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Lookout, Forger, or Witch.",
                Sheriff:"Your target is suspicious!",
                Consigliere:"Your target seems to be an Witch."
            },
            Abilities:[
                "You can control 1 person each night."
            ],
            Goals:[
                "Survive with Mafia/Arsonist/Werewolf/Serial Killer."
            ],
            NightMessage:"You can use your ability now",
            RoleMessage:"Pick who to bewitch.",
            Friendlies:["Witch"],
            Commands:[
                {
                    Name:"witch",
                    Guide:"witch <player 1>, <player 2>",
                    Description:"Controls <player 1> into targeting <player 2>.",
                    Priority:2,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Witch",
                    RequiredTargets:2,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive");
                        return targetables;
                    },
                    ActionResponse:async (inputs)=>{
                        return `You have decided to control **${inputs[0].getUsername()}** into targeting **${inputs[1].getUsername()}**.`
                    },
                    Act:(targets,town)=>{
                        let p1 = targets[0];
                        let p2 = targets[1];
                        let p1_action = town.getActions().filter(a=>a.getPerformer().getId()==p1.getId());
                        p1_action = p1_action[0];
                        let p1_immunities = p1.getRole().getImmunities();
                        if(!util.containsElement(p1_immunities,"Control")){
                            if(p1_action.getCommand().getRequiredTargets()==1){
                                p1_action.setFirstTarget(p2);
                            }
                            let notif1 = {
                                player: "Someone is controlling you..\nYou have been witched!",
                                spy: "Your target was witched!"
                            }
                            p1.pushNotif(notif1);
                        }else{
                            let notif1 = {
                                player: "Someone tried to control you, but you were immune.",
                                spy: "Your target was witched!"
                            }
                            p1.pushNotif(notif1);
                        }
                        
                    },
                },
            ],
        },
        {
            id:"008",
            Name:"Escort",
            Alignment:"Town",
            Type:"Support",
            Immunities:["Roleblock"],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Escort, Transporter, or Consort.",
                Sheriff:"Your target seems innocent.",
                Consigliere:"Your target seems to be a Lookout."
            },
            Abilities:[
                "You can distract someone each night.",
            ],
            Goals:[
                "Lynch all of the enemies of the Town."
            ],
            NightMessage:"You can use your ability now.",
            RoleMessage:"Pick someone to roleblock. (letter)",
            Friendlies:["Town","Survivor","Amnesiac","Jester","Executioner"],
            Commands:[
                {
                    Name:"distract",
                    Guide:"distract <player>",
                    Description:"Prevents a person from using their role ability.",
                    Priority:2,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p=>p.getStatus()=="Alive"&&p.getId()!=user.getId()&&p.getRole().getAlignment()!="Mafia");
                        return targetables;
                    },
                    ActionResponse:async (inputs)=>{
                        return `You have decided to distract **${inputs[0].getUsername()}** tonight.`
                    },
                    Act:(targets)=>{
                        let target = targets[0];
                        let immunities = target.getRole().getImmunities();
                        if(!util.containsElement(immunities,"Roleblock")){
                            target.setRoleBlockStatus(true);
                            let notif1 = {
                                player: "Someone distracted you last night!",
                                spy: "Your target was distracted by someone!"
                            }
                            target.pushNotif(notif1);
                        }else{
                            let notif1 = {
                                player: "Someone tried to distract you last night, but you were immune.",
                                spy: "Your target was distracted by someone!"
                            }
                            target.pushNotif(notif1);
                        }
                    },
                },
            ],
        },
        {
            id:"110",
            Name:"Consort",
            Alignment:"Mafia",
            Type:"Support",
            Immunities:["Roleblock"],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Escort, Transporter, or Consort.",
                Sheriff:"Your target is suspicious!",
                Consigliere:"Your target seems to be a Consort."
            },
            Abilities:[
                "You can distract someone each night."
            ],
            Goals:[
                "Make the mafia the last ones to survive."
            ],
            NightMessage:"You can use your ability now.",
            RoleMessage:"Pick who to roleblock. (letter)",
            Friendlies:["Mafia","Witch","Survivor","Jester","Executioner","Amnesiac"],
            Commands:[
                {
                    Name:"distract",
                    Guide:"distract <player>",
                    Description:"Prevents a person from using their role ability.",
                    Priority:2,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p=>p.getStatus()=="Alive"&&p.getId()!=user.getId()&&p.getRole().getAlignment()!="Mafia");
                        return targetables;
                    },
                    ActionResponse:async (user,inputs,town)=>{
                        const msg = `${user.getUsername()} has decided to distract ${inputs[0].getUsername()}.`
                        await town.getFunctions().messageOtherMafias(msg,user);
                        return `You have decided to distract **${inputs[0].getUsername()}** tonight.`
                    },
                    Act:(targets)=>{
                        let target = targets[0];
                        let immunities = target.getRole().getImmunities();
                        if(!util.containsElement(immunities,"Roleblock")){
                            target.setRoleBlockStatus(true);
                            let notif1 = {
                                player: "Someone distracted you last night!",
                                spy: "Your target was distracted by someone!"
                            }
                            target.pushNotif(notif1);
                        }else{
                            let notif1 = {
                                player: "Someone tried to distract you last night, but you were immune.",
                                spy: "Your target was distracted by someone!"
                            }
                            target.pushNotif(notif1);
                        }
                    },
                },
            ],
        },
        {
            id:"202",
            Name:"Survivor",
            Alignment:"Neutral",
            Type:"Benign",
            Immunities:[],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Survivor, Vampire Hunter, or Amnesiac.",
                Sheriff:"Your target is suspicious!",
                Consigliere:"Your target seems to be an Survivor."
            },
            Abilities:[
                "You can win with any Alignment."
            ],
            Goals:[
                "Survive until the end."
            ],
            NightMessage:"You can use your ability now.",
            RoleMessage:"Choose whether to use your shield. (letter)",
            Friendlies:["Survivor"],
            Commands:[
                {
                    Name:"vest",
                    Guide:"vest",
                    Description:"Be immune to any attacks at night.",
                    Priority:3,
                    Stocks:4,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:0,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return false;
                    },
                    AutoTargets:(user)=>{
                        return [user];
                    },
                    ActionResponse:async ()=>{
                        return `You have decided to wear a vest tonight.`
                    },
                    Act:(command,targets)=>{
                        let vests = command.getStocks();
                        command.setStocks(command.setStocks(vests-1));
                        let target = targets[0];
                        if(target.getRole().getName()=="Survivor"){
                            target.pushBuff("Vest");
                        }
                    },
                },
            ],
        },
        // {
        //     id:"201",
        //     Name:"Amnesiac",
        //     Alignment:"Neutral",
        //     Type:"Benign",
        //     Immunities:[],
        //     Attack:0,
        //     Defense:0,
        //     Unique:false,
        //     Results:{
        //         Investigator:"Your target could be a Survivor, Vampire Hunter, or Amnesiac.",
        //         Sheriff:"Your target seems innocent.",
        //         Consigliere:"Your target seems to be an Amnesiac."
        //     },
        //     Abilities:[
        //         "You can select any roles in the graveyard."
        //     ],
        //     Goals:[
        //         "Remember who you are."
        //     ],
        //     NightMessage:"You can use your ability now.",
        //     RoleMessage:"Pick a persona to remember yourself as. (letter)",
        //     Friendlies:[],
        //     Commands:[
        //         {
        //             Name:"remember",
        //             Guide:"remember <player>",
        //             Description:"Copy a role from someone who is dead.",
        //             Priority:6,
        //             Stocks:1,
        //             Permission:"Role Holder",
        //             Queue:"Normal",
        //             RequiredTargets:1,
        //             Phase:["Night", "Night (Full Moon)"],
        //             Status:"Alive",
        //             Performer:(user,command,town)=>{
        //                 return user;
        //             },
        //             VisitsTarget:(user,town)=>{
        //                 return false;
        //             },
        //             ValidTargets:(user,town)=>{
        //                 let targetables = town.getPlayers().filter(p=>p.getStatus()=="Dead" && p.getId()!=user.getId());
        //                 return targetables;
        //             },
        //             ActionResponse:async (user,command,inputs,town)=>{
        //                 return `You have decided to attempt remembering your past.`
        //             },
        //             Act:(user,performer,command,targets,town)=>{
        //                 let n1 = {
        //                     player:null,
        //                     spy:null
        //                 }
        //                 command.setStocks(command.setStocks(0));
        //                 let target = targets[0];
        //                 if(target.getStatus()=="Dead" && target.getMaskRole().getName()!="Cleaned" && target.getMaskRole().getUnique()!=true){
        //                     let past = module.exports.list.filter(r=>r.Name==target.getRole().getName());
        //                     user.setRole(new Role(past));
        //                     n1.player=`You remembered that you are a ${user.getMaskRole().getName()}!`;
        //                 }else{
        //                     n1.player="You failed to remember who you are...";
                            
        //                 }
        //                 performer.pushNotif(n1);
        //             },
        //         },
        //     ],
        // },
        {
            id:"002",
            Name:"Retributionist",
            Alignment:"Town",
            Type:"Support",
            Immunities:["Roleblock"],
            Attack:0,
            Defense:0,
            Unique:true,
            Results:{
                Investigator:"Your target could be a Medium, Janitor, or Retributionist.",
                Sheriff:"Your target seems innocent.",
                Consigliere:"Your target seems to be a Retributionist."
            },
            Abilities:[
                "You can resurrect 1 dead person. (One time use)"
            ],
            Goals:[
                "Lynch all of the enemies of the Town."
            ],
            NightMessage:"You can resurrect someone now.",
            RoleMessage:"Pick who to resurrect. (letter)",
            Friendlies:["Town","Survivor","Jester","Executioner"],
            Commands:[
                {
                    Name:"resurrect",
                    Guide:"resurrect <player>",
                    Description:"Resurrects the target from the dead.",
                    Priority:1,
                    Stocks:1,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return false;
                    },
                    ValidTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Dead" && p.getMaskRole().getName() != "Cleaned" && p.getMaskRole().getAlignment()=="Town");
                        return targetables;
                    },
                    ActionResponse:async (inputs)=>{
                        return `You have decided to resurrect **${inputs[0].getUsername()}**.`
                    },
                    Act:(user,performer,command,targets,town)=>{
                        if(command.getStocks()>0){
                            command.setStocks(command.getStocks()-1);
                            let target = targets[0];
                            target.resurrect();
                            target.getNotepad().showAndOpen();
                            town.pushFreshReborn(target);
                        }else{
                            let body = `You can't use this skill anymore.`;
                            let footer = "";
                            let duration = 7000;
                            user.sendResponse(body,footer,duration,performer.getHouse().getChannel());
                        } 
                    },
                },
            ],
        },
        {
            id:"104",
            Name:"Framer",
            Alignment:"Mafia",
            Type:"Support",
            Immunities:[],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Framer, Vampire, or Jester.",
                Sheriff:"Your target is suspicious!",
                Consigliere:"Your target seems to be a Framer."
            },
            Abilities:[
                "You can frame 1 person each night."
            ],
            Goals:[
                "Make the mafia the last ones to survive."
            ],
            NightMessage:"You can use your ability now.",
            RoleMessage:"Pick who to frame. (letter)",
            Friendlies:["Mafia","Witch","Survivor","Executioner","Jester"],
            Commands:[
                {
                    Name:"frame",
                    Guide:"frame <player>",
                    Description:"Frames a person at night.",
                    Priority:3,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getRole().getAlignment() != "Mafia");
                        return targetables;
                    },
                    ActionResponse:async (user,inputs,town)=>{
                        const msg = `${user.getUsername()} has decided to frame ${inputs[0].getUsername()}.`
                        await town.getFunctions().messageOtherMafias(msg,user);
                        return `You have decided to frame **${inputs[0].getUsername()}**.`
                    },
                    Act:(targets)=>{
                        let target = targets[0];
                        let frame = module.exports.list.filter(r=>r.Name=="Mafioso");
                        frame=frame[0];
                        target.setMaskRole(new Role(frame));
                    },
                },
            ],
        },
        {
            id:"106",
            Name:"Disguiser",
            Alignment:"Mafia",
            Type:"Support",
            Immunities:[],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Doctor, Disguiser, or Serial Killer.",
                Sheriff:"Your target is suspicious!",
                Consigliere:"Your target seems to be a Disguiser."
            },
            Abilities:[
                "You can disguise a person with another's to alter their identity."
            ],
            Goals:[
                "Make the mafia the last ones to survive."
            ],
            NightMessage:"You can use your ability now.",
            RoleMessage:"Pick (2) people to swap identity. (letter)",
            Friendlies:["Mafia","Witch","Survivor","Executioner","Jester"],
            Commands:[
                {
                    Name:"disguise",
                    Guide:"disguise <player>",
                    Description:"Steals the target's identity.",
                    Priority:5,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:2,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive");
                        return targetables;
                    },
                    ActionResponse:async (user,inputs,town)=>{
                        const msg = `${user.getUsername()} has decided to disguise themself as ${inputs[0].getUsername()}.`
                        await town.getFunctions().messageOtherMafias(msg,user);
                        return `You have decided to disguise yourself as **${inputs[0].getUsername()}**.`
                    },
                    Act:(performer,targets,town)=>{

                        let oldDisguisedPlayer = town.getPlayers().filter(p=>p.getDisguiseStatus());
                        if(oldDisguisedPlayer.length>0){
                            oldDisguisedPlayer = oldDisguisedPlayer[0];
                            oldDisguisedPlayer.setDisguiseStatus(false);
                            oldDisguisedPlayer.resetMask();
                        }
                        
                        let target1 = targets[0];

                        let mask = module.exports.list.filter(r=>r.Name==target1.getRole().getName());
                        mask = mask[0];

                        performer.setMaskRole(new Role(mask));
                        performer.setDisguiseStatus(true);
                        performer.setMaskName(target1.getUsername());

                    },
                },
            ],
        },
        {
            id:"109",
            Name:"Consigliere",
            Alignment:"Mafia",
            Type:"Support",
            Immunities:[],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Investigator, Consigliere, or Mayor.",
                Sheriff:"Your target is suspicious!",
                Consigliere:"Your target seems to be a Consigliere."
            },
            Abilities:[
                "You can check one person for their exact role each night."
            ],
            Goals:[
                "Make the mafia the last ones to survive."
            ],
            NightMessage:"You can use your ability now.",
            RoleMessage:"Pick who to investigate. (letter)",
            Friendlies:["Mafia","Witch","Survivor","Executioner","Jester"],
            Commands:[
                {
                    Name:"tail",
                    Guide:"tail <player>",
                    Description:"Gives you the exact role of a person.",
                    Priority:4,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getRole().getAlignment() != "Mafia");
                        return targetables;
                    },
                    ActionResponse:async (user,inputs,town)=>{
                        const msg = `${user.getUsername()} has decided to investigate ${inputs[0].getUsername()}.`
                        await town.getFunctions().messageOtherMafias(msg,user);
                        return `You have decided to investigate **${inputs[0].getUsername()}**.`
                    },
                    Act:(user,performer,command,targets)=>{
                        let target = targets[0];
                        let notif1 = {
                            player: target.getRole().getResults().getConsigliere(),
                            spy: null
                        }
                        user.pushNotif(notif1);
                    },
                },
            ],
        },
        {
            id:"006",
            Name:"Investigator",
            Alignment:"Town",
            Type:"Investigative",
            Immunities:[],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Investigator, Consigliere, or Mayor.",
                Sheriff:"Your target seems innocent.",
                Consigliere:"Your target seems to be an Investigator."
            },
            Abilities:[
                "You can find clues about a person's role each night.",
            ],
            Goals:[
                "Lynch/kill all of the enemies of the Town."
            ],
            NightMessage:"You can investigate someone now.",
            RoleMessage:"Pick who to investigate. (letter)",
            Friendlies:["Town","Survivor","Executioner","Jester"],
            Commands:[
                {
                    Name:"tail",
                    Guide:"tail <player>",
                    Description:"Gives you clues about the target's role.",
                    Priority:4,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getId() != user.getId());
                        return targetables;
                    },
                    ActionResponse:async (inputs)=>{
                        return `You have decided to investigate **${inputs[0].getUsername()}**.`
                    },
                    Act:(user,targets,)=>{
                        let target = targets[0];
                        let notif1 = {
                            player: target.getMaskRole().getResults().getInvestigator(),
                            spy: null
                        }
                        user.pushNotif(notif1);
                    },
                },
            ],
        },
        {
            id:"003",
            Name:"Sheriff",
            Alignment:"Town",
            Type:"Investigative",
            Immunities:[],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Sheriff, Executioner, or Werewolf..",
                Sheriff:"Your target seems innocent.",
                Consigliere:"Your target seems to be a Sheriff."
            },
            Abilities:[
                "You can check 1 person at night for suspicious activities.",
            ],
            Goals:[
                "Lynch/kill all of the enemies of the Town."
            ],
            NightMessage:"You can interrogate someone now.",
            RoleMessage:"Pick who to interrogate. (letter)",
            Friendlies:["Town","Survivor","Executioner","Jester"],
            Commands:[
                {
                    Name:"visit",
                    Guide:"visit <player>",
                    Description:"Lets you know whether someone is suspicious or not.",
                    Priority:4,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getId() != user.getId());
                        return targetables;
                    },
                    ActionResponse:async (inputs)=>{
                        return `You have decided to interrogate **${inputs[0].getUsername()}**.`
                    },
                    Act:(user,targets)=>{
                        let target = targets[0];
                        let notif1 = {
                            player: target.getMaskRole().getResults().getSheriff(),
                            spy: null
                        }
                        user.pushNotif(notif1);
                    },
                },
            ],
        },
        {
            id:"108",
            Name:"Blackmailer",
            Alignment:"Mafia",
            Type:"Support",
            Immunities:[],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Spy, Blackmailer, or Jailor.",
                Sheriff:"Your target is suspicious!",
                Consigliere:"Your target seems to be a Blackmailer."
            },
            Abilities:[
                "You can blackmail 1 person each night."
            ],
            Goals:[
                "Make the mafia the last ones to survive."
            ],
            NightMessage:"You can use your ability now.",
            RoleMessage:"Pick who to blackmail. (letter)",
            Friendlies:["Mafia","Witch","Survivor","Executioner","Jester"],
            Commands:[
                {
                    Name:"blackmail",
                    Guide:"blackmail <player>",
                    Description:"Prevent a person from talking during the day.",
                    Priority:3,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getRole().getAlignment() != "Mafia");
                        return targetables;
                    },
                    ActionResponse:async (user,inputs,town)=>{
                        const msg = `${user.getUsername()} has decided to blackmail ${inputs[0].getUsername()}.`
                        await town.getFunctions().messageOtherMafias(msg,user);
                        return `You have decided to blackmail **${inputs[0].getUsername()}**.`
                    },
                    Act:(targets)=>{
                        let target = targets[0];
                        target.setMuteStatus(true);
                        let notif1 = {
                            player: "You have been blackmailed!",
                            spy: "Your target was blackmailed!"
                        }
                        target.pushNotif(notif1);
                    },
                },
            ],
        },
        {
            id:"0087",
            Name:"Lookout",
            Alignment:"Town",
            Type:"Investigative",
            Immunities:[],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Lookout, Forger, or Witch.",
                Sheriff:"Your target seems innocent.",
                Consigliere:"Your target seems to be a Lookout."
            },
            Abilities:[
                "You can watch 1 person at night to see who visits them.",
            ],
            Goals:[
                "Lynch all of the enemies of the Town."
            ],
            NightMessage:"You can stakeout someone now.",
            RoleMessage:"Pick a house to set a stakeout. (letter)",
            Friendlies:["Town","Survivor","Executioner","Jester"],
            Commands:[
                {
                    Name:"watch",
                    Guide:"watch <player>",
                    Description:"Lets you know who visits your target.",
                    Priority:4,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return false;
                    },
                    ValidTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getUsername() != user.getUsername());
                        return targetables;
                    },
                    ActionResponse:async (inputs)=>{
                        return `You have decided to keep an eye on **${inputs[0].getUsername()}**'s house tonight.`
                    },
                    Act:(user,targets,town)=>{
                        let target = targets[0];
                        let visitors = []
                        let actions = town.getActions().filter(a=>a.getFirstTarget().getId()==target.getId());
                        actions.forEach(a => {
                            if(a.getCommand().VisitsTarget(a.getUser(),town)){
                                visitors.push(a.getPerformer().getMaskName());
                            }
                        });
                        visitors = util.shuffleArray(visitors);
                        visitors = util.stringTheNamesClean(visitors);
                        let notif1 = {
                            player: `${visitors} visited your target.`,
                            spy: null
                        }
                        user.pushNotif(notif1);
                    },
                },
            ],
        },
        {
            id:"101",
            Name:"Godfather",
            Alignment:"Mafia",
            Type:"Leader",
            Immunities:[],
            Attack:1,
            Defense:1,
            Unique:true,
            Results:{
                Investigator:"Your target could be a Bodyguard, Godfather, or Arsonist.",
                Sheriff:"Your target is suspicious!",
                Consigliere:"Your target seems to be the Godfather."
            },
            Abilities:[
                "You can order to kill 1 townie each night."
            ],
            Goals:[
                "Make the mafia the last ones to survive."
            ],
            NightMessage:"You can use your ability now.",
            RoleMessage:"Pick who to kill. (letter)",
            Friendlies:["Mafia","Witch","Survivor","Executioner","Jester"],
            Commands:[
                {
                    Name:"kill",
                    Guide:"kill <player>",
                    Description:"Orders the mafioso to kill your target.",
                    Priority:5,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user,town)=>{
                        if(town.getFunctions().roleExists("Mafioso")){
                            return town.getPlayers().filter(p=>p.getRole().getName()=="Mafioso")[0];
                        }else{
                            return user;
                        }
                    },
                    VisitsTarget:(town)=>{
                        if(town.getFunctions().roleExists("Mafioso")){
                            return false;
                        }else{
                            return true;
                        }
                    },
                    ValidTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getRole().getAlignment() != "Mafia");
                        return targetables;
                    },
                    ActionResponse:async (user,inputs,town)=>{
                        if(town.getFunctions().roleExists("Mafioso")){
                            const msg = `${user.getUsername()} has ordered the mafioso to kill ${inputs[0].getUsername()}.`
                            await town.getFunctions().messageOtherMafias(msg,user);
                            return `You have ordered the Mafioso to kill **${inputs[0].getUsername()}**.`
                        }else{
                            const msg = `${user.getUsername()} has decided to kill ${inputs[0].getUsername()}.`
                            await town.getFunctions().messageOtherMafias(msg,user);
                            return `You have decided to kill **${inputs[0].getUsername()}**.`
                        }
                    },
                    Act:(performer,targets)=>{
                        let target = targets[0];
                        let n1 = {
                            player:null,
                            spy: `Your target was attacked by the mafia!`
                        }
                        let n2 = {
                            player: `Your target's defense was too strong! You failed to kill your target.`,
                            spy: null
                        }
                        if(target.getBuffs().length==0){
                            if(target.getRole().getDefense()<performer.getRole().getAttack()){
                                target.kill();
                                target.pushCauseOfDeath(`attacked by a member of the Mafia.`);
                                n1.player = `You were attacked by the mafia!`;
                            }else{
                                n1.player = `Someone attacked you last night but you were immune!`;
                                n2.player = `Your target's defense was too strong! You failed to kill your target.`,
                                performer.pushNotif(n2);
                            }
                            target.pushNotif(n1);
                        }else{
                            target.calcBuff(target,performer,n1,n2);
                        }
                        
                    },
                },
            ],
        },
        // {
        //     id:"203",
        //     Name:"Vampire",
        //     Alignment:"Neutral",
        //     Type:"Chaos",
        //     Immunities:[],
        //     Attack:1,
        //     Defense:0,
        //     Unique:false,
        //     Results:{
        //         Investigator:"Your target could be a Framer, Vampire, or Jester.",
        //         Sheriff:"Your target is suspicious!",
        //         Consigliere:"Your target seems to be an Vampire."
        //     },
        //     Abilities:[
        //         "You can convert 1 person into a vampire each night."
        //     ],
        //     Goals:[
        //         "Make the vampires the last ones to survive."
        //     ],
        //     NightMessage:"You can use your ability now.",
        //     RoleMessage:"Pick who to bite. (letter)",
        //     Friendlies:["Vampire","Witch","Survivor","Executioner","Jester"],
        //     Commands:[
        //         {
        //             Name:"bite",
        //             Guide:"bite <player>",
        //             Description:"Turns the target into a vampire.",
        //             Priority:5,
        //             Stocks:99,
        //             Permission:"Role Holder",
        //             Queue:"Normal",
        //             RequiredTargets:1,
        //             Phase:["Night", "Night (Full Moon)"],
        //             Status:"Alive",
        //             Performer:(user,command,town)=>{
        //                 return user;
        //             },
        //             VisitsTarget:(user,town)=>{
        //                 return true;
        //             },
        //             ValidTargets:(user,town)=>{
        //                 let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getRole().getName() != "Vampire");
        //                 return targetables;
        //             },
        //             ActionResponse:async (user,command,inputs,town)=>{
        //                 return `You have decided to bite **${inputs[0].getUsername()}**.`
        //             },
        //             Act:(user,performer,command,targets,town)=>{
        //                 let n1 = {
        //                     player: null,
        //                     spy: `Your target was bitten by a vampire!`
        //                 }
        //                 let n2 = {
        //                     player: null,
        //                     spy: null
        //                 }
        //                 let target = targets[0];
        //                 let targetBuffs = target.getRole().getBuffs();
        //                 if(target.getRole().getDefense()==0){
        //                     if(targetBuffs.length==0){
        //                         if(target.getRole().getAlignment()!="Mafia"){
        //                             if(target.getRole().getName()!="Vampire"){
        //                                 let vamp = module.exports.list.filter(r=>r.Name=="Vampire");
        //                                 target.setRole(new Role(vamp));
        //                                 let n1 = {
        //                                 player: `You were bitten by a vampire! You are now a servant of evil!`,
        //                                 spy: `Your target was bitten by a vampire!`
        //                                 }
        //                                 target.pushNotif(n1);
        //                             }
        //                         }else{
        //                             target.kill();
        //                             target.pushCauseOfDeath(`forced to commit suicide.`);
        //                             n1.player= `You were bitten by a vampire!\nYour loyalty to the mafia made you kill yourself!`
        //                             target.pushNotif(n1);
        //                         }
        //                     }else{
        //                         target.calcBuff(target,performer,n1,n2)
        //                     }
        //                 }else{
        //                     n1.player=`A vampire tried to bite you but you were immune.`;
        //                     target.pushNotif(n1);
        //                     n2.player=`Your target's defense was too strong!`;
        //                     performer.pushNotif(n2);
        //                 }
        //             },
        //         },
        //     ],
        // },
        {
            id:"107",
            Name:"Mafioso",
            Alignment:"Mafia",
            Type:"Support",
            Immunities:[],
            Attack:1,
            Defense:0,
            Unique:true,
            Results:{
                Investigator:"Your target could be a Vigilante, Veteran, Mafioso.",
                Sheriff:"Your target is suspicious!",
                Consigliere:"Your target seems to be a Mafioso."
            },
            Abilities:[
                "You carry out the Godfather's orders."
            ],
            Goals:[
                "Make the mafia the last ones to survive."
            ],
            NightMessage:"You can use your ability now.",
            RoleMessage:"Pick who to kill. (letter)",
            Friendlies:["Mafia","Witch","Survivor","Executioner","Jester"],
            Commands:[
                {
                    Name:"kill",
                    Guide:"kill <player>",
                    Description:"kills the target.",
                    Priority:5,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getRole().getAlignment() != "Mafia"); 
                        return targetables;
                    },
                    ActionResponse:async (user,inputs,town)=>{
                        let msg;
                        if(town.getFunctions().roleExists("Godfather")){
                            msg = `${user.getUsername()} has voted to kill ${inputs[0].getUsername()}.`
                            await town.getFunctions().messageOtherMafias(msg,user);
                            return `You have voted to kill **${inputs[0].getUsername()}**.`
                        }else{
                            msg = `${user.getUsername()} has decided to kill ${inputs[0].getUsername()}.`
                            await town.getFunctions().messageOtherMafias(msg,user);
                            return `You have decided to kill **${inputs[0].getUsername()}**.`
                        }
                    },
                    Act:(user,performer,targets,town)=>{
                        if(town.getFunctions().killFlagMafioso(user,performer)){
                            let target = targets[0];
                            let n1 = {
                                player:null,
                                spy: `Your target was attacked by the mafia!`
                            }
                            let n2 = {
                                player: `Your target's defense was too strong! You failed to kill your target.`,
                                spy: null
                            }
                            if(target.getBuffs().length==0){
                                if(target.getRole().getDefense()<performer.getRole().getAttack()){
                                    target.kill();
                                    target.pushCauseOfDeath(`attacked by a member of the Mafia.`);
                                    n1.player = `You were attacked by the mafia!`;
                                }else{
                                    n1.player = `Someone attacked you last night but you were immune!`;
                                    n2.player = `Your target's defense was too strong! You failed to kill your target.`,
                                    performer.pushNotif(n2);
                                }
                                target.pushNotif(n1);
                            }else{
                                target.calcBuff(target,performer,n1,n2);
                            }
                        }
                    },
                },
            ],
        },
        {
            id:"004",
            Name:"Vigilante",
            Alignment:"Town",
            Type:"Killing",
            Immunities:[],
            Attack:1,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Vigilante, Veteran, or Mafioso.",
                Sheriff:"Your target seems innocent.",
                Consigliere:"Your target seems to be a Vigilante."
            },
            Abilities:[
                "You can take justice into your own hands and shoot someone each night.",
            ],
            Goals:[
                "Lynch/kill all of the enemies of the Town."
            ],
            NightMessage:"You can take a shot or pass.",
            RoleMessage:"Pick who to shoot. (letter)",
            Friendlies:["Town","Survivor","Executioner","Jester"],
            Commands:[
                {
                    Name:"shoot",
                    Guide:"shoot <player>",
                    Description:"Kills the target.",
                    Priority:5,
                    Stocks:3,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getUsername() != user.getUsername());
                        return targetables;
                    },
                    ActionResponse:async (inputs)=>{
                        return `You have decided to shoot **${inputs[0].getUsername()}**.`
                    },
                    Act:(user,performer,command,targets)=>{
                        let target = targets[0];
                        command.setStocks(command.getStocks()-1);
                        let n1 = {
                            player: null,
                            spy: `Your target was attacked by a Vigilante!`
                        }
                        let n2 = {
                            player: `Your target's defense was too strong! You failed to kill your target.`,
                            spy: null
                        }
                        if(target.getBuffs().length==0){
                            if(target.getRole().getDefense()<performer.getRole().getAttack()){
                                target.kill();
                                target.pushCauseOfDeath(`shot by a Vigilante.`);
                                n1.player =  `You were shot by a Vigilante!`;  
                            }else{
                                n1.player = `Someone attacked you last night but you were immune!`;
                                n2.player = `Your target's defense was too strong! You failed to kill your target.`,
                                performer.pushNotif(n2);
                            }
                            target.pushNotif(n1);
                        }else{
                            target.calcBuff(target,performer,n1,n2);
                        }   
                          
                    },
                },
            ],
        },
        {
            id:"208",
            Name:"Serial Killer",
            Alignment:"Neutral",
            Type:"Killing",
            Immunities:[],
            Attack:1,
            Defense:1,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Doctor, Disguiser, or Serial Killer.",
                Sheriff:"Your target is suspicious!",
                Consigliere:"Your target seems to be a Serial Killer."
            },
            Abilities:[
                "You can kill 1 person each night.",
                "You are immune to night attacks."
            ],
            Goals:[
                "Be the last person alive."
            ],
            NightMessage:"You can use your ability now",
            RoleMessage:"Pick who to kill.",
            Friendlies:["Serial Killer","Witch","Survivor","Executioner","Jester"],
            Commands:[
                {
                    Name:"stab",
                    Guide:"stab <player>",
                    Description:"Kills the target.",
                    Priority:5,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getUsername() != user.getUsername());
                        return targetables;
                    },
                    ActionResponse:async (inputs)=>{
                        return `You have decided to kill **${inputs[0].getUsername()}**.`
                    },
                    Act:(performer,targets)=>{
                        let target = targets[0];
                        let n1 = {
                            player: null,
                            spy: `Your target was attacked by a Serial Killer!`
                        }
                        let n2 = {
                            player: `Your target's defense was too strong! You failed to kill your target.`,
                            spy: null
                        }
                        if(target.getBuffs().length==0){
                            if(target.getRole().getDefense()<performer.getRole().getAttack()){
                                target.kill();
                                target.pushCauseOfDeath(`stabbed by a Serial Killer.`);
                                n1.player = `You were attacked by a Serial Killer!`;
                            }else{
                                n1.player = `Someone attacked you last night but you were immune!`
                                n2.player = `Your target's defense was too strong! You failed to kill your target.`,
                                performer.pushNotif(n2);
                            }
                            target.pushNotif(n1);
                        }else{
                            target.calcBuff(target,performer,n1,n2);
                        }
                        
                    },
                },
            ],
        },
        {
            id:"209",
            Name:"Werewolf",
            Alignment:"Neutral",
            Type:"Killing",
            Immunities:[],
            Attack:2,
            Defense:1,
            Unique:true,
            Results:{
                Investigator:"Your target could be a Sheriff, Executioner, or Werewolf.",
                Sheriff:["Your target is suspicious!","Your target seems innocent."],
                Consigliere:"Your target seems to be a Werewolf!"
            },
            Abilities:[
                "You can go on a rampage at someone's house during full moons.",
                "You are immune to night attacks."
            ],
            Goals:[
                "Be the last person alive."
            ],
            NightMessage:"You can use your ability now",
            RoleMessage:"Pick who to kill.",
            Friendlies:["Werewolf","Witch","Survivor","Executioner","Jester"],
            Commands:[
                {
                    Name:"maul",
                    Guide:"maul <player>",
                    Description:"Kills the target.",
                    Priority:5,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getUsername() != user.getUsername());
                        return targetables;
                    },
                    ActionResponse:async (inputs)=>{
                        return `You have decided to go on a rampage at **${inputs[0].getUsername()}**'s house.`
                    },
                    Act:(performer,targets,town)=>{
                        let target = targets[0];
                        let n1 = {
                            player: null,
                            spy: `Your target was attacked by a Werewolf!`
                        }
                        let n2 = {
                            player: `Your target's defense was too strong! You failed to kill your target.`,
                            spy: null
                        }
                        if(target.getBuffs().length==0){
                            if(target.getRole().getDefense()<performer.getRole().getAttack()){
                                target.kill();
                                target.pushCauseOfDeath(`mauled by a Werewolf.`);
                                n1.player = `A werewolf went on a rampage at your house!`;

                                let n3 = {player: null,spy:null}
                                n3.player = `A werewolf went on a rampage at your target's house!`
                                n3.spy=`Your target was attacked by a Werewolf!`

                                let visitors = town.getFunctions().getVisitors(target);
                                
                                visitors.forEach(v => {
                                    if(v.getId()!=performer.getId()){
                                        v.kill();
                                        v.pushNotif(n3);
                                    }
                                });
                            }else{
                                n1.player = `Someone attacked you last night but you were immune!`;
                                n2.player = `Your target's defense was too strong! You failed to kill your target.`,
                                performer.pushNotif(n2);
                            }
                            target.pushNotif(n1);
                        }else{
                            target.calcBuff(target,performer,n1,n2);
                        }
                        
                    },
                },
            ],
        },
        // {
        //     id:"207",
        //     Name:"Arsonist",
        //     Alignment:"Neutral",
        //     Type:"Killing",
        //     Immunities:[],
        //     Attack:3,
        //     Defense:1,
        //     Unique:false,
        //     Results:{
        //         Investigator:"Your target could be a Bodyguard, Godfather, or Arsonist.",
        //         Sheriff:"Your target is suspicious!",
        //         Consigliere:"Your target seems to be an Arsonist."
        //     },
        //     Abilities:[
        //         "You can douse 1 person each night.",
        //         "You are immune to night attacks."
        //     ],
        //     Goals:[
        //         "Be the last person alive."
        //     ],
        //     NightMessage:"You can use your ability now",
        //     RoleMessage:"Pick who to douse or decide to light the fire.",
        //     Friendlies:["Arsonist","Witch","Survivor","Executioner","Jester"],
        //     Commands:[
        //         {
        //             Name:"douse",
        //             Guide:"douse <player>",
        //             Description:"Douses the target.",
        //             Priority:3,
        //             Stocks:99,
        //             Permission:"Role Holder",
        //             Queue:"Normal",
        //             RequiredTargets:1,
        //             Phase:["Night", "Night (Full Moon)"],
        //             Status:"Alive",
        //             Performer:(user,command,town)=>{
        //                 return user;
        //             },
        //             VisitsTarget:(user,town)=>{
        //                 return true;
        //             },
        //             ValidTargets:(user,town)=>{
        //                 let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getUsername() != user.getUsername());
        //                 return targetables;
        //             },
        //             ActionResponse:async (user,command,inputs,town)=>{
        //                 return `You have decided to douse **${inputs[0].getUsername()}**.`
        //             },
        //             Act:(user,performer,command,targets,town)=>{
        //                 let target = targets[0];
        //                 target.setDouseStatus(true);
        //             },
        //         },
        //         {
        //             Name:"light",
        //             Guide:"light",
        //             Description:"Sets all the doused houses on fire.",
        //             Priority:5,
        //             Stocks:99,
        //             Permission:"Role Holder",
        //             Queue:"Normal",
        //             RequiredTargets:0,
        //             Phase:["Night", "Night (Full Moon)"],
        //             Status:"Alive",
        //             Performer:(user,command,town)=>{
        //                 return user;
        //             },
        //             VisitsTarget:(user,town)=>{
        //                 return false;
        //             },
        //             ActionResponse:async (user,command,inputs,town)=>{
        //                 return `You have decided to light the doused houses.`
        //             },
        //             Act:(user,performer,command,targets,town)=>{
        //                 let doused = town.getPlayers().filter(p=>p.getDouseStatus()==true && p.getStatus()=="Alive");
        //                 doused.forEach(d => {
        //                     d.kill();
        //                     d.pushCauseOfDeath(`incenerated by an Arsonist.`);
        //                     let notif1 = {
        //                         player: `You were set on fire!`,
        //                         spy: `Your target was set on fire!`
        //                     }
        //                     d.pushNotif(notif1);
        //                 });
        //             },
        //         },
        //     ],
        // },
        {
            id:"010",
            Name:"Doctor",
            Alignment:"Town",
            Type:"Protective",
            Immunities:[],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Doctor, Disguiser, or Serial Killer.",
                Sheriff:"Your target seems innocent.",
                Consigliere:"Your target seems to be a Doctor."
            },
            Abilities:[
                "You can heal someone each night.",
                "You can heal yourself. (One time use)"
            ],
            Goals:[
                "Lynch all of the enemies of the Town."
            ],
            NightMessage:"You can use your ability now.",
            RoleMessage:"Pick someone to heal. (letter)",
            Friendlies:["Town","Survivor","Amnesiac","Jester","Executioner"],
            Commands:[
                {
                    Name:"heal",
                    Guide:"heal <player>",
                    Description:"Heals the target.",
                    Priority:3,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getUsername() != user.getUsername() && p.getVoteCount()!=3);
                        return targetables;
                    },
                    ActionResponse:async (inputs)=>{
                        return `You have decided to heal **${inputs[0].getUsername()}**.`
                    },
                    Act:(targets)=>{
                        const  target = targets[0];
                        target.pushBuff("Heal");
                    },
                },
                {
                    Name:"selfheal",
                    Guide:"selfheal",
                    Description:"Heals yourself.",
                    Priority:3,
                    Stocks:1,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:0,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return false;
                    },
                    ActionResponse:async ()=>{
                        return `You have decided to heal yourself.`
                    },
                    AutoTargets:(user)=>{
                        return [user];
                    },
                    Act:(command,targets)=>{
                        const target = targets[0];
                        command.setStocks(command.getStocks()-1);
                        target.pushBuff("Heal");
                    },
                },
            ],
        },
        {
            id:"009",
            Name:"Bodyguard",
            Alignment:"Town",
            Type:"Protective",
            Immunities:[],
            Attack:2,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Bodyguard, Godfather, or Arsonist.",
                Sheriff:"Your target seems innocent.",
                Consigliere:"Your target seems to be a Bodyguard."
            },
            Abilities:[
                "You can protect someone each night.",
                "You can shield yourself for one night.",
            ],
            Goals:[
                "Lynch/kill all of the enemies of the Town."
            ],
            NightMessage:"You can use your ability now.",
            RoleMessage:"Pick someone to protect. (letter)",
            Friendlies:["Town","Survivor","Executioner","Jester"],
            Commands:[
                {
                    Name:"protect",
                    Guide:"protect <player>",
                    Description:"Protects the target.",
                    Priority:3,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getUsername() != user.getUsername());
                        return targetables;
                    },
                    ActionResponse:async (inputs)=>{
                        return `You have decided to protect **${inputs[0].getUsername()}**.`
                    },
                    Act:(targets)=>{
                        const target = targets[0];
                        target.pushBuff("Protect");
                    },
                },
                {
                    Name:"vest",
                    Guide:"vest",
                    Description:"Be immune to any attacks at night.",
                    Priority:3,
                    Stocks:1,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:0,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return false;
                    },
                    AutoTargets:(user)=>{
                        return [user];
                    },
                    ActionResponse:async ()=>{
                        return `You have decided to wear a vest tonight.`
                    },
                    Act:(command,targets)=>{
                        let vests = command.getStocks();
                        command.setStocks(command.setStocks(vests-1));
                        let target = targets[0];
                        target.pushBuff("Vest");
                    },
                },
            ],
        },
        // {
        //     id:"011",
        //     Name:"Mayor",
        //     Alignment:"Town",
        //     Type:"Support",
        //     Immunities:[],
        //     Attack:0,
        //     Defense:0,
        //     Unique:true,
        //     Results:{
        //         Investigator:"Your target could be a Investigator, Consigliere, or Mayor.",
        //         Sheriff:"Your target seems innocent.",
        //         Consigliere:"Your target seems to be the Mayor."
        //     },
        //     Abilities:[
        //         "Gain 3 votes when you reveal yourself as Mayor."
        //     ],
        //     Goals:[
        //         "Lynch all of the enemies of the Town."
        //     ],
        //     NightMessage:"Sleep tight..",
        //     RoleMessage:"Choose whether to reveal or not.",
        //     Friendlies:["Town","Survivor","Executioner","Jester"],
        //     Commands:[
        //         {
        //             Name:"reveal",
        //             Guide:"reveal",
        //             Description:"Reveals to everyone that you are the mayor.",
        //             Priority:1,
        //             Stocks:1,
        //             Permission:"Role Holder",
        //             Queue:"Quick",
        //             RequiredTargets:0,
        //             Phase:["Discussion", "Voting", "Defense","Judgement"],
        //             Status:"Alive",
        //             Performer:(user,command,town)=>{
        //                 return user;
        //             },
        //             VisitsTarget:(user,town)=>{
        //                 return false;
        //             },
        //             AutoTargets:(user,town)=>{
        //                 return [user];
        //             },
        //             ActionResponse:async (user,command,inputs,town)=>{
        //                 command.setStocks(command.getStocks()-1);
        //                 user.setVoteCount(3);
        //                 let msg = `${user.getUsername()} has revealed to everyone that they are the Mayor!`;
        //                 town.getFunctions().messagePlayersWrapped(msg);
        //                 return `You have revealed to everyone that you are the **Mayor**!`
                       
        //             },
        //             Act:(user,performer,command,targets,town)=>{
                        
        //             },
        //         }
        //     ],
        // },
        {
            id:"012",
            Name:"Medium",
            Alignment:"Town",
            Type:"Support",
            Immunities:[],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Medium, Janitor, or Retributionist.",
                Sheriff:"Your target seems innocent.",
                Consigliere:"Your target seems to be a Medium."
            },
            Abilities:[
                "You can talk to ghosts every night."
            ],
            Goals:[
                "Lynch all of the enemies of the Town."
            ],
            NightMessage:"You can talk to ghosts.",
            RoleMessage:"You can talk to ghosts.",
            Friendlies:["Town","Survivor","Executioner","Jester"],
            Commands:[
                {
                    Name:"seance",
                    Guide:"seance <player>",
                    Description:"Lets you talk to the target.",
                    Priority:1,
                    Stocks:1,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Discussion","Voting","Judgement","Defense","Last Words","Execution"],
                    Status:"Dead",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return false;
                    },
                    ValidTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive");
                        return targetables;
                    },
                    ActionResponse:async (inputs)=>{
                        return `You have decided to seance **${inputs[0].getUsername()}**.`
                    },
                    Act:(user,performer,command,targets)=>{
                        command.setStocks(command.setStocks(0));
                        const target = targets[0];
                        target.setSeanceStatus(true);
                        performer.setSeanceStatus(true);
                    },
                }
            ],
        },
        {
            id:"014",
            Name:"Spy",
            Alignment:"Town",
            Type:"Investigative",
            Immunities:[],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Spy, Blackmailer, or Jailor.",
                Sheriff:"Your target seems innocent.",
                Consigliere:"Your target seems to be a Spy."
            },
            Abilities:[
                "You can hear Mafia conversations at night.",
                "You can know who the mafia visits."
            ],
            Goals:[
                "Lynch all of the enemies of the Town."
            ],
            NightMessage:"You can use your ability now.",
            RoleMessage:"Pick who to spy on. (letter)",
            Friendlies:["Town","Survivor","Executioner","Jester"],
            Commands:[
                {
                    Name:"bug",
                    Guide:"bug <player>",
                    Description:"Bugs someone's house to see what happens to them at night.",
                    Priority:6,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night","Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return false;
                    },
                    ValidTargets:(user,town)=>{
                         
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getId()!=user.getId());
                         
                        return targetables;
                    },
                    ActionResponse:async (inputs)=>{
                        return `You have decided to bug **${inputs[0].getUsername()}**'s house.`
                    },
                    Act:(user,targets)=>{
                        let target = targets[0];
                        target.getNotifs().forEach(n => {
                            let notif1 = {
                                player: n.Spy,
                                spy: null
                            }
                            user.pushNotif(notif1);
                        });
                    },
                },
            ],
        },
        // {
        //     id:"204",
        //     Name:"Executioner",
        //     Alignment:"Neutral",
        //     Type:"Evil",
        //     Immunities:[],
        //     Attack:0,
        //     Defense:1,
        //     Unique:false,
        //     Results:{
        //         Investigator:"Your target could be a Sheriff, Executioner, or Werewolf.",
        //         Sheriff:"Your target is suspicious!",
        //         Consigliere:"Your target seems to be an Executioner."
        //     },
        //     Abilities:[
        //         "You are immune to night attacks."
        //     ],
        //     Goals:[
        //         "Lynch your target."
        //     ],
        //     NightMessage:"Sleep tight...",
        //     RoleMessage:"Convince everyone to lynch your target.",
        //     Friendlies:[],
        //     Commands:[],
        // },
        {
            id:"205",
            Name:"Jester",
            Alignment:"Neutral",
            Type:"Evil",
            Immunities:[],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Framer, Vampire, or Jester.",
                Sheriff:"Your target is suspicious!",
                Consigliere:"Your target seems to be an Jester."
            },
            Abilities:[
                "None."
            ],
            Goals:[
                "Get yourself lynched."
            ],
            NightMessage:"Sleep tight...",
            RoleMessage:"Convince everyone to lynch you.",
            Friendlies:[],
            Commands:[
                {
                    Name:"haunt",
                    Guide:"haunt <player>",
                    Description:"Kills the target.",
                    Priority:1,
                    Stocks:0,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Dead",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return false;
                    },
                    ValidTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p=>p.getJudgement()[p.getJudgement().length-1]=="Guilty" && p.getStatus()=="Alive");
                        return targetables;
                    },
                    ActionResponse:async (inputs)=>{
                        return `You have decided to haunt **${inputs[0].getUsername()}**.`
                    },
                    Act:(user,performer,command,targets,town)=>{
                        command.setStocks(command.setStocks(0));
                        let target = targets[0];
                        target.kill();
                        target.pushCauseOfDeath(`haunted by the Jester's ghost.`);
                        let index = town.getActions().findIndex(a=>a.getFirstTarget()==target && a.getPerformer().getRole().getName()=="Doctor");
                        if(index>=0){
                            town.getActions().splice(index, 1);
                        }

                        let index2 = town.getActions().findIndex(a=>a.getFirstTarget()==target && a.getPerformer().getRole().getName()=="Bodyguard");
                        if(index>=0){
                            town.getActions().splice(index2, 1);
                        }

                        let notif1 = {
                            player: "You were haunted by the jester!",
                            spy: null
                        }
                        user.pushNotif(notif1);
                    },
                }
            ],
        },
        {
            id:"103",
            Name:"Janitor",
            Alignment:"Mafia",
            Type:"Support",
            Immunities:[],
            Attack:0,
            Defense:0,
            Unique:false,
            Results:{
                Investigator:"Your target could be a Medium, Janitor, or Retributionist.",
                Sheriff:"Your target is suspicious!",
                Consigliere:"Your target seems to be a Janitor."
            },
            Abilities:[
                "You can erase the traces of each mafia kills."
            ],
            Goals:[
                "Make the mafia the last ones to survive."
            ],
            NightMessage:"You can use your ability now.",
            RoleMessage:"Pick who to clean. (letter)",
            Friendlies:["Mafia","Witch","Survivor","Executioner","Jester"],
            Commands:[
                {
                    Name:"clean",
                    Guide:"clean <player>",
                    Description:"Cleans the traces left behind by Mafia's murder victim.",
                    Priority:3,
                    Stocks:99,
                    Permission:"Role Holder",
                    Queue:"Normal",
                    RequiredTargets:1,
                    Phase:["Night", "Night (Full Moon)"],
                    Status:"Alive",
                    Performer:(user)=>{
                        return user;
                    },
                    VisitsTarget:()=>{
                        return true;
                    },
                    ValidTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getRole().getAlignment() != "Mafia");
                        return targetables;
                    },
                    ActionResponse:async (user,inputs,town)=>{
                        const msg = `${user.getUsername()} has decided to clean ${inputs[0].getUsername()}.`
                        await town.getFunctions().messageOtherMafias(msg,user);
                        return `You have decided to clean **${inputs[0].getUsername()}**.`
                    },
                    Act:(targets)=>{
                        let target = targets[0];
                        target.setCleandName(target.getMaskRole().getName());
                        target.setCleanedNotes(target.getNotes());
                        target.getMaskRole().setName("Cleaned");
                        target.setNotes("");
                    },
                },
            ],
        },
            
];
