import util from "./utility";
import Role from "./role";
import Player from "./player";

export interface SalemRoleCommand{
    name: string;
    guide: string;
    description: string;
    priority: number;
    stocks: number;
    permission: string;
    queue: string;
    phase: string[];
    status: string;
    requiredTargets: number;

    act: any;
    performer: any;
    defaultTarget: any;
    visitsTarget: any;
    validTargets: any;
    actionResponse: any;
}

export interface Results{
    investigator: string;
    sheriff: string;
    consigliere: string;
}

export interface SalemRole{
    id: string;
    name: string;
    alignment: string;
    type: string;
    immunities: string[];
    attack: number;
    defense: number;
    unique: boolean;
    results: Results;
    abilities: string[];
    goals: string[];
    nightMessage: string;
    roleMessage: string;
    winBuddies: string[];
    commands: SalemRoleCommand[];

}

const roles = [
        {
            id:"001",
            name:"Jailor",
            alignment:"Town",
            type:"Killing",
            immunities:[],
            attack:3,
            defense:0,
            unique:true,
            results:{
                investigator:"Your target could be a Spy, Blackmailer, or Jailor.",
                sheriff:"Your target seems innocent.",
                consigliere:"Your target seems to be the Jailor."
            },
            abilities:[
                "You can jail 1 Person each night.",
                "You can talk to the jailed person."
            ],
            goals:[
                "Lynch/kill all of the evildoers."
            ],
            nightMessage:"You can talk to the detained person.",
            roleMessage:"",
            winBuddies:["Town","Survivor","Amnesiac","Jester","Executioner"],
            commands:[
                {   
                    name:"jail",
                    guide:"jail <player>",
                    description:"Jails a person for one night.",
                    priority:1,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    phase:["Discussion", "Voting", "Judgement", "Defense", "Final Words", "Execution"],
                    status:"Alive",
                    requiredTargets:1,
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return false;
                    },
                    validTargets:(user,town)=>{
                        let targetables =  town.getPlayers().filter(p=>p.getId()!=user.getId() && p.getStatus()=="Alive");
                        return targetables;
                    },
                    actionResponse:async (inputs)=>{
                        return `You have decided to jail **${inputs[0].getUsername()}**.`
                    },
                    act:(user,targets)=>{
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
                    name:"execute",
                    guide:"execute",
                    description:"Executes the currently jailed person.",
                    priority:1,
                    stocks:0,
                    permission:"Role Holder",
                    queue:"Normal",
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    requiredTargets:0,
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return false;
                    },
                    validTargets:()=>null,
                    defaultTarget:(town)=>{
                        if(town.getJailedPerson()){
                            return [town.getJailedPerson()];
                        }else{
                            return null
                        }
                    },
                    actionResponse:async (user,town)=>{
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
                    act:(user,performer,command,targets)=>{
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
            name:"Transporter",
            alignment:"Town",
            type:"Support",
            immunities:["Roleblock","Control"],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Escort, Transporter, or Consort.",
                sheriff:"Your target seems innocent.",
                consigliere:"Your target seems to be a Transporter."
            },
            abilities:[
                "You can swap 2 people's places each night."
            ],
            goals:[
                "Lynch all of the enemies of the Town."
            ],
            nightMessage:"You can use your ability now.",
            roleMessage:"Pick (2) people to swap. (letter)",
            winBuddies:["Town","Survivor","Amnesiac","Jester","Executioner"],
            commands:[
                {
                    name:"transport",
                    guide:"transport <player 1>, <player 2>",
                    description:"Swaps the two targets of their locations.",
                    priority:1,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:2,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(town)=>{
                        let targetables =  town.getPlayers().filter(p=>p.getStatus()=="Alive");
                        return targetables;
                    },
                    actionResponse:async (inputs)=>{
                        return `You have decided to swap **${inputs[0].getUsername()}** and **${inputs[1].getUsername()}**.`
                    },
                    act:(targets,town)=>{
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
            name:"Veteran",
            alignment:"Town",
            type:"Killing",
            immunities:["Roleblock","Control"],
            attack:2,
            defense:0,
            unique:true,
            results:{
                investigator:"Your target could be a Vigilante, Veteran, or Mafioso.",
                sheriff:"Your target seems innocent.",
                consigliere:"Your target seems to be a Veteran."
            },
            abilities:[
                "You can kill people who visit you. (3 uses)",
            ],
            goals:[
                "Lynch/kill all of the enemies of the Town."
            ],
            nightMessage:"Choose whether to alert or not.",
            roleMessage:"Click [o] to alert, [x] to cancel.",
            winBuddies:["Town","Survivor","Amnesiac","Jester","Executioner"],
            commands:[
                {
                    name:"alert",
                    guide:"alert",
                    description:"Kills anyone who visits you at night.",
                    priority:1,
                    stocks:4,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:0,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return false;
                    },
                    validTargets:()=>null,
                    defaultTarget:(user)=>{
                        return [user];
                    },
                    actionResponse:async ()=>{
                        return `You have decided to stay on alert for tonight.`
                    },
                    act:(performer,command)=>{
                        let stonks = command.getStocks();
                        command.setStocks(stonks-1);
                        performer.pushBuff("Alert");
                    },
                },
            ],
        },
        {
            id:"206",
            name:"Witch",
            alignment:"Neutral",
            type:"Evil",
            immunities:["Roleblock","Control"],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Lookout, Forger, or Witch.",
                sheriff:"Your target is suspicious!",
                consigliere:"Your target seems to be an Witch."
            },
            abilities:[
                "You can control 1 person each night."
            ],
            goals:[
                "Survive with Mafia/Arsonist/Werewolf/Serial Killer."
            ],
            nightMessage:"You can use your ability now",
            roleMessage:"Pick who to bewitch.",
            winBuddies:["Witch"],
            commands:[
                {
                    name:"witch",
                    guide:"witch <player 1>, <player 2>",
                    description:"Controls <player 1> into targeting <player 2>.",
                    priority:2,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Witch",
                    requiredTargets:2,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive");
                        return targetables;
                    },
                    actionResponse:async (inputs)=>{
                        return `You have decided to control **${inputs[0].getUsername()}** into targeting **${inputs[1].getUsername()}**.`
                    },
                    act:(targets,town)=>{
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
            name:"Escort",
            alignment:"Town",
            type:"Support",
            immunities:["Roleblock"],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Escort, Transporter, or Consort.",
                sheriff:"Your target seems innocent.",
                consigliere:"Your target seems to be a Lookout."
            },
            abilities:[
                "You can distract someone each night.",
            ],
            goals:[
                "Lynch all of the enemies of the Town."
            ],
            nightMessage:"You can use your ability now.",
            roleMessage:"Pick someone to roleblock. (letter)",
            winBuddies:["Town","Survivor","Amnesiac","Jester","Executioner"],
            commands:[
                {
                    name:"distract",
                    guide:"distract <player>",
                    description:"Prevents a person from using their role ability.",
                    priority:2,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p=>p.getStatus()=="Alive"&&p.getId()!=user.getId()&&p.getRole().getAlignment()!="Mafia");
                        return targetables;
                    },
                    actionResponse:async (inputs)=>{
                        return `You have decided to distract **${inputs[0].getUsername()}** tonight.`
                    },
                    act:(targets)=>{
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
            name:"Consort",
            alignment:"Mafia",
            type:"Support",
            immunities:["Roleblock"],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Escort, Transporter, or Consort.",
                sheriff:"Your target is suspicious!",
                consigliere:"Your target seems to be a Consort."
            },
            abilities:[
                "You can distract someone each night."
            ],
            goals:[
                "Make the mafia the last ones to survive."
            ],
            nightMessage:"You can use your ability now.",
            roleMessage:"Pick who to roleblock. (letter)",
            winBuddies:["Mafia","Witch","Survivor","Jester","Executioner","Amnesiac"],
            commands:[
                {
                    name:"distract",
                    guide:"distract <player>",
                    description:"Prevents a person from using their role ability.",
                    priority:2,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p=>p.getStatus()=="Alive"&&p.getId()!=user.getId()&&p.getRole().getAlignment()!="Mafia");
                        return targetables;
                    },
                    actionResponse:async (user,inputs,town)=>{
                        const msg = `${user.getUsername()} has decided to distract ${inputs[0].getUsername()}.`
                        await town.getFunctions().messageOtherMafias(msg,user);
                        return `You have decided to distract **${inputs[0].getUsername()}** tonight.`
                    },
                    act:(targets)=>{
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
            name:"Survivor",
            alignment:"Neutral",
            type:"Benign",
            immunities:[],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Survivor, Vampire Hunter, or Amnesiac.",
                sheriff:"Your target is suspicious!",
                consigliere:"Your target seems to be an Survivor."
            },
            abilities:[
                "You can win with any Alignment."
            ],
            goals:[
                "Survive until the end."
            ],
            nightMessage:"You can use your ability now.",
            roleMessage:"Choose whether to use your shield. (letter)",
            winBuddies:["Survivor"],
            commands:[
                {
                    name:"vest",
                    guide:"vest",
                    description:"Be immune to any attacks at night.",
                    priority:3,
                    stocks:4,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:0,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return false;
                    },
                    validTargets:()=>null,
                    defaultTarget:(user)=>{
                        return [user];
                    },
                    actionResponse:async ()=>{
                        return `You have decided to wear a vest tonight.`
                    },
                    act:(command,targets)=>{
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
        //     name:"Amnesiac",
        //     alignment:"Neutral",
        //     type:"Benign",
        //     immunities:[],
        //     attack:0,
        //     defense:0,
        //     unique:false,
        //     results:{
        //         investigator:"Your target could be a Survivor, Vampire Hunter, or Amnesiac.",
        //         sheriff:"Your target seems innocent.",
        //         consigliere:"Your target seems to be an Amnesiac."
        //     },
        //     abilities:[
        //         "You can select any roles in the graveyard."
        //     ],
        //     goals:[
        //         "Remember who you are."
        //     ],
        //     nightMessage:"You can use your ability now.",
        //     roleMessage:"Pick a persona to remember yourself as. (letter)",
        //     winBuddies:[],
        //     commands:[
        //         {
        //             name:"remember",
        //             guide:"remember <player>",
        //             description:"Copy a role from someone who is dead.",
        //             priority:6,
        //             stocks:1,
        //             permission:"Role Holder",
        //             queue:"Normal",
        //             requiredTargets:1,
        //             phase:["Night", "Night (Full Moon)"],
        //             status:"Alive",
        //             performer:(user,command,town)=>{
        //                 return user;
        //             },
        //             visitsTarget:(user,town)=>{
        //                 return false;
        //             },
        //             validTargets:(user,town)=>{
        //                 let targetables = town.getPlayers().filter(p=>p.getStatus()=="Dead" && p.getId()!=user.getId());
        //                 return targetables;
        //             },
        //             actionResponse:async (user,command,inputs,town)=>{
        //                 return `You have decided to attempt remembering your past.`
        //             },
        //             act:(user,performer,command,targets,town)=>{
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
            name:"Retributionist",
            alignment:"Town",
            type:"Support",
            immunities:["Roleblock"],
            attack:0,
            defense:0,
            unique:true,
            results:{
                investigator:"Your target could be a Medium, Janitor, or Retributionist.",
                sheriff:"Your target seems innocent.",
                consigliere:"Your target seems to be a Retributionist."
            },
            abilities:[
                "You can resurrect 1 dead person. (One time use)"
            ],
            goals:[
                "Lynch all of the enemies of the Town."
            ],
            nightMessage:"You can resurrect someone now.",
            roleMessage:"Pick who to resurrect. (letter)",
            winBuddies:["Town","Survivor","Jester","Executioner"],
            commands:[
                {
                    name:"resurrect",
                    guide:"resurrect <player>",
                    description:"Resurrects the target from the dead.",
                    priority:1,
                    stocks:1,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return false;
                    },
                    validTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Dead" && p.getMaskRole().getName() != "Cleaned" && p.getMaskRole().getAlignment()=="Town");
                        return targetables;
                    },
                    actionResponse:async (inputs)=>{
                        return `You have decided to resurrect **${inputs[0].getUsername()}**.`
                    },
                    act:(user,performer,command,targets,town)=>{
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
            name:"Framer",
            alignment:"Mafia",
            type:"Support",
            immunities:[],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Framer, Vampire, or Jester.",
                sheriff:"Your target is suspicious!",
                consigliere:"Your target seems to be a Framer."
            },
            abilities:[
                "You can frame 1 person each night."
            ],
            goals:[
                "Make the mafia the last ones to survive."
            ],
            nightMessage:"You can use your ability now.",
            roleMessage:"Pick who to frame. (letter)",
            winBuddies:["Mafia","Witch","Survivor","Executioner","Jester"],
            commands:[
                {
                    name:"frame",
                    guide:"frame <player>",
                    description:"Frames a person at night.",
                    priority:3,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getRole().getAlignment() != "Mafia");
                        return targetables;
                    },
                    actionResponse:async (user,inputs,town)=>{
                        const msg = `${user.getUsername()} has decided to frame ${inputs[0].getUsername()}.`
                        await town.getFunctions().messageOtherMafias(msg,user);
                        return `You have decided to frame **${inputs[0].getUsername()}**.`
                    },
                    act:(targets)=>{
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
            name:"Disguiser",
            alignment:"Mafia",
            type:"Support",
            immunities:[],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Doctor, Disguiser, or Serial Killer.",
                sheriff:"Your target is suspicious!",
                consigliere:"Your target seems to be a Disguiser."
            },
            abilities:[
                "You can disguise a person with another's to alter their identity."
            ],
            goals:[
                "Make the mafia the last ones to survive."
            ],
            nightMessage:"You can use your ability now.",
            roleMessage:"Pick (2) people to swap identity. (letter)",
            winBuddies:["Mafia","Witch","Survivor","Executioner","Jester"],
            commands:[
                {
                    name:"disguise",
                    guide:"disguise <player>",
                    description:"Steals the target's identity.",
                    priority:5,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:2,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive");
                        return targetables;
                    },
                    actionResponse:async (user,inputs,town)=>{
                        const msg = `${user.getUsername()} has decided to disguise themself as ${inputs[0].getUsername()}.`
                        await town.getFunctions().messageOtherMafias(msg,user);
                        return `You have decided to disguise yourself as **${inputs[0].getUsername()}**.`
                    },
                    act:(performer,targets,town)=>{

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
            name:"Consigliere",
            alignment:"Mafia",
            type:"Support",
            immunities:[],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Investigator, Consigliere, or Mayor.",
                sheriff:"Your target is suspicious!",
                consigliere:"Your target seems to be a Consigliere."
            },
            abilities:[
                "You can check one person for their exact role each night."
            ],
            goals:[
                "Make the mafia the last ones to survive."
            ],
            nightMessage:"You can use your ability now.",
            roleMessage:"Pick who to investigate. (letter)",
            winBuddies:["Mafia","Witch","Survivor","Executioner","Jester"],
            commands:[
                {
                    name:"tail",
                    guide:"tail <player>",
                    description:"Gives you the exact role of a person.",
                    priority:4,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getRole().getAlignment() != "Mafia");
                        return targetables;
                    },
                    actionResponse:async (user,inputs,town)=>{
                        const msg = `${user.getUsername()} has decided to investigate ${inputs[0].getUsername()}.`
                        await town.getFunctions().messageOtherMafias(msg,user);
                        return `You have decided to investigate **${inputs[0].getUsername()}**.`
                    },
                    act:(user,performer,command,targets)=>{
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
            name:"Investigator",
            alignment:"Town",
            type:"Investigative",
            immunities:[],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Investigator, Consigliere, or Mayor.",
                sheriff:"Your target seems innocent.",
                consigliere:"Your target seems to be an Investigator."
            },
            abilities:[
                "You can find clues about a person's role each night.",
            ],
            goals:[
                "Lynch/kill all of the enemies of the Town."
            ],
            nightMessage:"You can investigate someone now.",
            roleMessage:"Pick who to investigate. (letter)",
            winBuddies:["Town","Survivor","Executioner","Jester"],
            commands:[
                {
                    name:"tail",
                    guide:"tail <player>",
                    description:"Gives you clues about the target's role.",
                    priority:4,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getId() != user.getId());
                        return targetables;
                    },
                    actionResponse:async (inputs)=>{
                        return `You have decided to investigate **${inputs[0].getUsername()}**.`
                    },
                    act:(user,targets,)=>{
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
            name:"Sheriff",
            alignment:"Town",
            type:"Investigative",
            immunities:[],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Sheriff, Executioner, or Werewolf..",
                sheriff:"Your target seems innocent.",
                consigliere:"Your target seems to be a Sheriff."
            },
            abilities:[
                "You can check 1 person at night for suspicious activities.",
            ],
            goals:[
                "Lynch/kill all of the enemies of the Town."
            ],
            nightMessage:"You can interrogate someone now.",
            roleMessage:"Pick who to interrogate. (letter)",
            winBuddies:["Town","Survivor","Executioner","Jester"],
            commands:[
                {
                    name:"visit",
                    guide:"visit <player>",
                    description:"Lets you know whether someone is suspicious or not.",
                    priority:4,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getId() != user.getId());
                        return targetables;
                    },
                    actionResponse:async (inputs)=>{
                        return `You have decided to interrogate **${inputs[0].getUsername()}**.`
                    },
                    act:(user,targets)=>{
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
            name:"Blackmailer",
            alignment:"Mafia",
            type:"Support",
            immunities:[],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Spy, Blackmailer, or Jailor.",
                sheriff:"Your target is suspicious!",
                consigliere:"Your target seems to be a Blackmailer."
            },
            abilities:[
                "You can blackmail 1 person each night."
            ],
            goals:[
                "Make the mafia the last ones to survive."
            ],
            nightMessage:"You can use your ability now.",
            roleMessage:"Pick who to blackmail. (letter)",
            winBuddies:["Mafia","Witch","Survivor","Executioner","Jester"],
            commands:[
                {
                    name:"blackmail",
                    guide:"blackmail <player>",
                    description:"Prevent a person from talking during the day.",
                    priority:3,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getRole().getAlignment() != "Mafia");
                        return targetables;
                    },
                    actionResponse:async (user,inputs,town)=>{
                        const msg = `${user.getUsername()} has decided to blackmail ${inputs[0].getUsername()}.`
                        await town.getFunctions().messageOtherMafias(msg,user);
                        return `You have decided to blackmail **${inputs[0].getUsername()}**.`
                    },
                    act:(targets)=>{
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
            name:"Lookout",
            alignment:"Town",
            type:"Investigative",
            immunities:[],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Lookout, Forger, or Witch.",
                sheriff:"Your target seems innocent.",
                consigliere:"Your target seems to be a Lookout."
            },
            abilities:[
                "You can watch 1 person at night to see who visits them.",
            ],
            goals:[
                "Lynch all of the enemies of the Town."
            ],
            nightMessage:"You can stakeout someone now.",
            roleMessage:"Pick a house to set a stakeout. (letter)",
            winBuddies:["Town","Survivor","Executioner","Jester"],
            commands:[
                {
                    name:"watch",
                    guide:"watch <player>",
                    description:"Lets you know who visits your target.",
                    priority:4,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return false;
                    },
                    validTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getUsername() != user.getUsername());
                        return targetables;
                    },
                    actionResponse:async (inputs)=>{
                        return `You have decided to keep an eye on **${inputs[0].getUsername()}**'s house tonight.`
                    },
                    act:(user,targets,town)=>{
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
            name:"Godfather",
            alignment:"Mafia",
            type:"Leader",
            immunities:[],
            attack:1,
            defense:1,
            unique:true,
            results:{
                investigator:"Your target could be a Bodyguard, Godfather, or Arsonist.",
                sheriff:"Your target is suspicious!",
                consigliere:"Your target seems to be the Godfather."
            },
            abilities:[
                "You can order to kill 1 townie each night."
            ],
            goals:[
                "Make the mafia the last ones to survive."
            ],
            nightMessage:"You can use your ability now.",
            roleMessage:"Pick who to kill. (letter)",
            winBuddies:["Mafia","Witch","Survivor","Executioner","Jester"],
            commands:[
                {
                    name:"kill",
                    guide:"kill <player>",
                    description:"Orders the mafioso to kill your target.",
                    priority:5,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user,town)=>{
                        if(town.getFunctions().roleExists("Mafioso")){
                            return town.getPlayers().filter(p=>p.getRole().getName()=="Mafioso")[0];
                        }else{
                            return user;
                        }
                    },
                    visitsTarget:(town)=>{
                        if(town.getFunctions().roleExists("Mafioso")){
                            return false;
                        }else{
                            return true;
                        }
                    },
                    validTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getRole().getAlignment() != "Mafia");
                        return targetables;
                    },
                    actionResponse:async (user,inputs,town)=>{
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
                    act:(performer,targets)=>{
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
        //     name:"Vampire",
        //     alignment:"Neutral",
        //     type:"Chaos",
        //     immunities:[],
        //     attack:1,
        //     defense:0,
        //     unique:false,
        //     results:{
        //         investigator:"Your target could be a Framer, Vampire, or Jester.",
        //         sheriff:"Your target is suspicious!",
        //         consigliere:"Your target seems to be an Vampire."
        //     },
        //     abilities:[
        //         "You can convert 1 person into a vampire each night."
        //     ],
        //     goals:[
        //         "Make the vampires the last ones to survive."
        //     ],
        //     nightMessage:"You can use your ability now.",
        //     roleMessage:"Pick who to bite. (letter)",
        //     winBuddies:["Vampire","Witch","Survivor","Executioner","Jester"],
        //     commands:[
        //         {
        //             name:"bite",
        //             guide:"bite <player>",
        //             description:"Turns the target into a vampire.",
        //             priority:5,
        //             stocks:99,
        //             permission:"Role Holder",
        //             queue:"Normal",
        //             requiredTargets:1,
        //             phase:["Night", "Night (Full Moon)"],
        //             status:"Alive",
        //             performer:(user,command,town)=>{
        //                 return user;
        //             },
        //             visitsTarget:(user,town)=>{
        //                 return true;
        //             },
        //             validTargets:(user,town)=>{
        //                 let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getRole().getName() != "Vampire");
        //                 return targetables;
        //             },
        //             actionResponse:async (user,command,inputs,town)=>{
        //                 return `You have decided to bite **${inputs[0].getUsername()}**.`
        //             },
        //             act:(user,performer,command,targets,town)=>{
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
            name:"Mafioso",
            alignment:"Mafia",
            type:"Support",
            immunities:[],
            attack:1,
            defense:0,
            unique:true,
            results:{
                investigator:"Your target could be a Vigilante, Veteran, Mafioso.",
                sheriff:"Your target is suspicious!",
                consigliere:"Your target seems to be a Mafioso."
            },
            abilities:[
                "You carry out the Godfather's orders."
            ],
            goals:[
                "Make the mafia the last ones to survive."
            ],
            nightMessage:"You can use your ability now.",
            roleMessage:"Pick who to kill. (letter)",
            winBuddies:["Mafia","Witch","Survivor","Executioner","Jester"],
            commands:[
                {
                    name:"kill",
                    guide:"kill <player>",
                    description:"kills the target.",
                    priority:5,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getRole().getAlignment() != "Mafia"); 
                        return targetables;
                    },
                    actionResponse:async (user,inputs,town)=>{
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
                    act:(user,performer,targets,town)=>{
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
            name:"Vigilante",
            alignment:"Town",
            type:"Killing",
            immunities:[],
            attack:1,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Vigilante, Veteran, or Mafioso.",
                sheriff:"Your target seems innocent.",
                consigliere:"Your target seems to be a Vigilante."
            },
            abilities:[
                "You can take justice into your own hands and shoot someone each night.",
            ],
            goals:[
                "Lynch/kill all of the enemies of the Town."
            ],
            nightMessage:"You can take a shot or pass.",
            roleMessage:"Pick who to shoot. (letter)",
            winBuddies:["Town","Survivor","Executioner","Jester"],
            commands:[
                {
                    name:"shoot",
                    guide:"shoot <player>",
                    description:"Kills the target.",
                    priority:5,
                    stocks:3,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getUsername() != user.getUsername());
                        return targetables;
                    },
                    actionResponse:async (inputs)=>{
                        return `You have decided to shoot **${inputs[0].getUsername()}**.`
                    },
                    act:(user,performer,command,targets)=>{
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
            name:"Serial Killer",
            alignment:"Neutral",
            type:"Killing",
            immunities:[],
            attack:1,
            defense:1,
            unique:false,
            results:{
                investigator:"Your target could be a Doctor, Disguiser, or Serial Killer.",
                sheriff:"Your target is suspicious!",
                consigliere:"Your target seems to be a Serial Killer."
            },
            abilities:[
                "You can kill 1 person each night.",
                "You are immune to night attacks."
            ],
            goals:[
                "Be the last person alive."
            ],
            nightMessage:"You can use your ability now",
            roleMessage:"Pick who to kill.",
            winBuddies:["Serial Killer","Witch","Survivor","Executioner","Jester"],
            commands:[
                {
                    name:"stab",
                    guide:"stab <player>",
                    description:"Kills the target.",
                    priority:5,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getUsername() != user.getUsername());
                        return targetables;
                    },
                    actionResponse:async (inputs)=>{
                        return `You have decided to kill **${inputs[0].getUsername()}**.`
                    },
                    act:(performer,targets)=>{
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
            name:"Werewolf",
            alignment:"Neutral",
            type:"Killing",
            immunities:[],
            attack:2,
            defense:1,
            unique:true,
            results:{
                investigator:"Your target could be a Sheriff, Executioner, or Werewolf.",
                sheriff:["Your target is suspicious!","Your target seems innocent."],
                consigliere:"Your target seems to be a Werewolf!"
            },
            abilities:[
                "You can go on a rampage at someone's house during full moons.",
                "You are immune to night attacks."
            ],
            goals:[
                "Be the last person alive."
            ],
            nightMessage:"You can use your ability now",
            roleMessage:"Pick who to kill.",
            winBuddies:["Werewolf","Witch","Survivor","Executioner","Jester"],
            commands:[
                {
                    name:"maul",
                    guide:"maul <player>",
                    description:"Kills the target.",
                    priority:5,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getUsername() != user.getUsername());
                        return targetables;
                    },
                    actionResponse:async (inputs)=>{
                        return `You have decided to go on a rampage at **${inputs[0].getUsername()}**'s house.`
                    },
                    act:(performer,targets,town)=>{
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
        //     name:"Arsonist",
        //     alignment:"Neutral",
        //     type:"Killing",
        //     immunities:[],
        //     attack:3,
        //     defense:1,
        //     unique:false,
        //     results:{
        //         investigator:"Your target could be a Bodyguard, Godfather, or Arsonist.",
        //         sheriff:"Your target is suspicious!",
        //         consigliere:"Your target seems to be an Arsonist."
        //     },
        //     abilities:[
        //         "You can douse 1 person each night.",
        //         "You are immune to night attacks."
        //     ],
        //     goals:[
        //         "Be the last person alive."
        //     ],
        //     nightMessage:"You can use your ability now",
        //     roleMessage:"Pick who to douse or decide to light the fire.",
        //     winBuddies:["Arsonist","Witch","Survivor","Executioner","Jester"],
        //     commands:[
        //         {
        //             name:"douse",
        //             guide:"douse <player>",
        //             description:"Douses the target.",
        //             priority:3,
        //             stocks:99,
        //             permission:"Role Holder",
        //             queue:"Normal",
        //             requiredTargets:1,
        //             phase:["Night", "Night (Full Moon)"],
        //             status:"Alive",
        //             performer:(user,command,town)=>{
        //                 return user;
        //             },
        //             visitsTarget:(user,town)=>{
        //                 return true;
        //             },
        //             validTargets:(user,town)=>{
        //                 let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getUsername() != user.getUsername());
        //                 return targetables;
        //             },
        //             actionResponse:async (user,command,inputs,town)=>{
        //                 return `You have decided to douse **${inputs[0].getUsername()}**.`
        //             },
        //             act:(user,performer,command,targets,town)=>{
        //                 let target = targets[0];
        //                 target.setDouseStatus(true);
        //             },
        //         },
        //         {
        //             name:"light",
        //             guide:"light",
        //             description:"Sets all the doused houses on fire.",
        //             priority:5,
        //             stocks:99,
        //             permission:"Role Holder",
        //             queue:"Normal",
        //             requiredTargets:0,
        //             phase:["Night", "Night (Full Moon)"],
        //             status:"Alive",
        //             performer:(user,command,town)=>{
        //                 return user;
        //             },
        //             visitsTarget:(user,town)=>{
        //                 return false;
        //             },
        //             actionResponse:async (user,command,inputs,town)=>{
        //                 return `You have decided to light the doused houses.`
        //             },
        //             act:(user,performer,command,targets,town)=>{
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
            name:"Doctor",
            alignment:"Town",
            type:"Protective",
            immunities:[],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Doctor, Disguiser, or Serial Killer.",
                sheriff:"Your target seems innocent.",
                consigliere:"Your target seems to be a Doctor."
            },
            abilities:[
                "You can heal someone each night.",
                "You can heal yourself. (One time use)"
            ],
            goals:[
                "Lynch all of the enemies of the Town."
            ],
            nightMessage:"You can use your ability now.",
            roleMessage:"Pick someone to heal. (letter)",
            winBuddies:["Town","Survivor","Amnesiac","Jester","Executioner"],
            commands:[
                {
                    name:"heal",
                    guide:"heal <player>",
                    description:"Heals the target.",
                    priority:3,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getUsername() != user.getUsername() && p.getVoteCount()!=3);
                        return targetables;
                    },
                    actionResponse:async (inputs)=>{
                        return `You have decided to heal **${inputs[0].getUsername()}**.`
                    },
                    act:(targets)=>{
                        const  target = targets[0];
                        target.pushBuff("Heal");
                    },
                },
                {
                    name:"selfheal",
                    guide:"selfheal",
                    description:"Heals yourself.",
                    priority:3,
                    stocks:1,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:0,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return false;
                    },
                    validTargets:()=>null,
                    actionResponse:async ()=>{
                        return `You have decided to heal yourself.`
                    },
                    defaultTarget:(user)=>{
                        return [user];
                    },
                    act:(command,targets)=>{
                        const target = targets[0];
                        command.setStocks(command.getStocks()-1);
                        target.pushBuff("Heal");
                    },
                },
            ],
        },
        {
            id:"009",
            name:"Bodyguard",
            alignment:"Town",
            type:"Protective",
            immunities:[],
            attack:2,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Bodyguard, Godfather, or Arsonist.",
                sheriff:"Your target seems innocent.",
                consigliere:"Your target seems to be a Bodyguard."
            },
            abilities:[
                "You can protect someone each night.",
                "You can shield yourself for one night.",
            ],
            goals:[
                "Lynch/kill all of the enemies of the Town."
            ],
            nightMessage:"You can use your ability now.",
            roleMessage:"Pick someone to protect. (letter)",
            winBuddies:["Town","Survivor","Executioner","Jester"],
            commands:[
                {
                    name:"protect",
                    guide:"protect <player>",
                    description:"Protects the target.",
                    priority:3,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(user,town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getUsername() != user.getUsername());
                        return targetables;
                    },
                    actionResponse:async (inputs)=>{
                        return `You have decided to protect **${inputs[0].getUsername()}**.`
                    },
                    act:(targets)=>{
                        const target = targets[0];
                        target.pushBuff("Protect");
                    },
                },
                {
                    name:"vest",
                    guide:"vest",
                    description:"Be immune to any attacks at night.",
                    priority:3,
                    stocks:1,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:0,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return false;
                    },
                    validTargets:()=>null,
                    defaultTarget:(user)=>{
                        return [user];
                    },
                    actionResponse:async ()=>{
                        return `You have decided to wear a vest tonight.`
                    },
                    act:(command,targets)=>{
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
        //     name:"Mayor",
        //     alignment:"Town",
        //     type:"Support",
        //     immunities:[],
        //     attack:0,
        //     defense:0,
        //     unique:true,
        //     results:{
        //         investigator:"Your target could be a Investigator, Consigliere, or Mayor.",
        //         sheriff:"Your target seems innocent.",
        //         consigliere:"Your target seems to be the Mayor."
        //     },
        //     abilities:[
        //         "Gain 3 votes when you reveal yourself as Mayor."
        //     ],
        //     goals:[
        //         "Lynch all of the enemies of the Town."
        //     ],
        //     nightMessage:"Sleep tight..",
        //     roleMessage:"Choose whether to reveal or not.",
        //     winBuddies:["Town","Survivor","Executioner","Jester"],
        //     commands:[
        //         {
        //             name:"reveal",
        //             guide:"reveal",
        //             description:"Reveals to everyone that you are the mayor.",
        //             priority:1,
        //             stocks:1,
        //             permission:"Role Holder",
        //             queue:"Quick",
        //             requiredTargets:0,
        //             phase:["Discussion", "Voting", "Defense","Judgement"],
        //             status:"Alive",
        //             performer:(user,command,town)=>{
        //                 return user;
        //             },
        //             visitsTarget:(user,town)=>{
        //                 return false;
        //             },
        //             defaultTarget:(user,town)=>{
        //                 return [user];
        //             },
        //             actionResponse:async (user,command,inputs,town)=>{
        //                 command.setStocks(command.getStocks()-1);
        //                 user.setVoteCount(3);
        //                 let msg = `${user.getUsername()} has revealed to everyone that they are the Mayor!`;
        //                 town.getFunctions().messagePlayersWrapped(msg);
        //                 return `You have revealed to everyone that you are the **Mayor**!`
                       
        //             },
        //             act:(user,performer,command,targets,town)=>{
                        
        //             },
        //         }
        //     ],
        // },
        {
            id:"012",
            name:"Medium",
            alignment:"Town",
            type:"Support",
            immunities:[],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Medium, Janitor, or Retributionist.",
                sheriff:"Your target seems innocent.",
                consigliere:"Your target seems to be a Medium."
            },
            abilities:[
                "You can talk to ghosts every night."
            ],
            goals:[
                "Lynch all of the enemies of the Town."
            ],
            nightMessage:"You can talk to ghosts.",
            roleMessage:"You can talk to ghosts.",
            winBuddies:["Town","Survivor","Executioner","Jester"],
            commands:[
                {
                    name:"seance",
                    guide:"seance <player>",
                    description:"Lets you talk to the target.",
                    priority:1,
                    stocks:1,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Discussion","Voting","Judgement","Defense","Last Words","Execution"],
                    status:"Dead",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return false;
                    },
                    validTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive");
                        return targetables;
                    },
                    actionResponse:async (inputs)=>{
                        return `You have decided to seance **${inputs[0].getUsername()}**.`
                    },
                    act:(user,performer,command,targets)=>{
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
            name:"Spy",
            alignment:"Town",
            type:"Investigative",
            immunities:[],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Spy, Blackmailer, or Jailor.",
                sheriff:"Your target seems innocent.",
                consigliere:"Your target seems to be a Spy."
            },
            abilities:[
                "You can hear Mafia conversations at night.",
                "You can know who the mafia visits."
            ],
            goals:[
                "Lynch all of the enemies of the Town."
            ],
            nightMessage:"You can use your ability now.",
            roleMessage:"Pick who to spy on. (letter)",
            winBuddies:["Town","Survivor","Executioner","Jester"],
            commands:[
                {
                    name:"bug",
                    guide:"bug <player>",
                    description:"Bugs someone's house to see what happens to them at night.",
                    priority:6,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night","Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return false;
                    },
                    validTargets:(user,town)=>{
                         
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getId()!=user.getId());
                         
                        return targetables;
                    },
                    actionResponse:async (inputs)=>{
                        return `You have decided to bug **${inputs[0].getUsername()}**'s house.`
                    },
                    act:(user,targets)=>{
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
        //     name:"Executioner",
        //     alignment:"Neutral",
        //     type:"Evil",
        //     immunities:[],
        //     attack:0,
        //     defense:1,
        //     unique:false,
        //     results:{
        //         investigator:"Your target could be a Sheriff, Executioner, or Werewolf.",
        //         sheriff:"Your target is suspicious!",
        //         consigliere:"Your target seems to be an Executioner."
        //     },
        //     abilities:[
        //         "You are immune to night attacks."
        //     ],
        //     goals:[
        //         "Lynch your target."
        //     ],
        //     nightMessage:"Sleep tight...",
        //     roleMessage:"Convince everyone to lynch your target.",
        //     winBuddies:[],
        //     commands:[],
        // },
        {
            id:"205",
            name:"Jester",
            alignment:"Neutral",
            type:"Evil",
            immunities:[],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Framer, Vampire, or Jester.",
                sheriff:"Your target is suspicious!",
                consigliere:"Your target seems to be an Jester."
            },
            abilities:[
                "None."
            ],
            goals:[
                "Get yourself lynched."
            ],
            nightMessage:"Sleep tight...",
            roleMessage:"Convince everyone to lynch you.",
            winBuddies:[],
            commands:[
                {
                    name:"haunt",
                    guide:"haunt <player>",
                    description:"Kills the target.",
                    priority:1,
                    stocks:0,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Dead",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return false;
                    },
                    validTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p=>p.getJudgement()[p.getJudgement().length-1]=="Guilty" && p.getStatus()=="Alive");
                        return targetables;
                    },
                    actionResponse:async (inputs)=>{
                        return `You have decided to haunt **${inputs[0].getUsername()}**.`
                    },
                    act:(user,performer,command,targets,town)=>{
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
            name:"Janitor",
            alignment:"Mafia",
            type:"Support",
            immunities:[],
            attack:0,
            defense:0,
            unique:false,
            results:{
                investigator:"Your target could be a Medium, Janitor, or Retributionist.",
                sheriff:"Your target is suspicious!",
                consigliere:"Your target seems to be a Janitor."
            },
            abilities:[
                "You can erase the traces of each mafia kills."
            ],
            goals:[
                "Make the mafia the last ones to survive."
            ],
            nightMessage:"You can use your ability now.",
            roleMessage:"Pick who to clean. (letter)",
            winBuddies:["Mafia","Witch","Survivor","Executioner","Jester"],
            commands:[
                {
                    name:"clean",
                    guide:"clean <player>",
                    description:"Cleans the traces left behind by Mafia's murder victim.",
                    priority:3,
                    stocks:99,
                    permission:"Role Holder",
                    queue:"Normal",
                    requiredTargets:1,
                    phase:["Night", "Night (Full Moon)"],
                    status:"Alive",
                    performer:(user)=>{
                        return user;
                    },
                    visitsTarget:()=>{
                        return true;
                    },
                    validTargets:(town)=>{
                        let targetables = town.getPlayers().filter(p => p.getStatus() == "Alive" && p.getRole().getAlignment() != "Mafia");
                        return targetables;
                    },
                    actionResponse:async (user,inputs,town)=>{
                        const msg = `${user.getUsername()} has decided to clean ${inputs[0].getUsername()}.`
                        await town.getFunctions().messageOtherMafias(msg,user);
                        return `You have decided to clean **${inputs[0].getUsername()}**.`
                    },
                    act:(targets)=>{
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

export default roles