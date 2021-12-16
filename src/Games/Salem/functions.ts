import roles, { SalemRole } from "./roles";
import Role from "./role";
import { MessageReaction, User } from "discord.js";
import Game from './game';
import { createMarkDown, delay } from "../../Helpers/toolbox";
import Player from "./player";
import Action from "./action";
import { String } from "lodash";

export default class Functions{

  game: Game;
  Lwrap = `‎\n\`\`\`json\n`;
  Rwrap = `\`\`\``;

  constructor(game: Game){
    this.game = game;
  }

  sendMarkDownToPlayers = async (message: string, secondsDelay: number = 1000) =>{
    this.messagePlayers(createMarkDown(message));
    return await delay(secondsDelay);
  }

  async gameOverMessage(message: string){
    this.game.getPlayers().map(async (player)=>{
      const address = await player.getHouse().getChannel().send(message);
      address.react('🚪');
      const filter = (reaction:MessageReaction, user:User) => !user.bot;
      const collector = address.createReactionCollector({filter});
      collector.on('collect', async (reaction: MessageReaction) => {
        const react = reaction.emoji.name;
        if(react!== '🚪')return
        const discord = this.game.getGuild().members.cache.find(m => m.id === player.getId());
        discord.roles.remove(this.game.getGameKey());
        player.getHouse().hideAndClose();
        player.getNotepad().hideAndClose();
      });
    });
  }

  messagePlayers = async (message:string) => {
    this.game.getPlayers().map((p)=>p.getHouse().getChannel().send(message))
  }

  messageGhosts = async (message: string) => {
    this.game.getPlayers().map((p)=>p.getStatus()=="Dead" && p.getHouse().getChannel().send(message))
  }

  messagePlayersWrapped = async (message: string) => {
    const content = createMarkDown(message);
    this.game.getPlayers().map((p)=>p.getHouse().getChannel().send(content));
  }


  stringifyWinners = () => {
    const string = "End Results:\n\n";
    const results = this.game.getPlayers().map(player => {
      const discord = player.getDiscord().username;
      const username = player.getUsername();
      const role = player.getRole().getName();
      const isWinner = player.getWinStatus() ? ` (Victorious)` : ``;
      return `${username} - ${discord} - ${role} ${isWinner}`;
    }).join("\n");
    return string+results;
  }

  async messageMafias(message: string){
    const mafias = this.game.getPlayers().filter(p=>p.getRole().getAlignment()=="Mafia");
    mafias.map((mafia)=>mafia.getHouse().getChannel().send(message))
  }

  async messageOtherMafias(message: string, sender: Player){
    const content = createMarkDown(message);
    const mafias = this.game.getPlayers().filter(p=>p.getRole().getAlignment()=="Mafia" && p.getUsername()!=sender.getUsername());
    mafias.map((mafia)=>mafia.getHouse().getChannel().send(content))
  }

  playerWithRoleIsAlive(role: SalemRole){
    if(this.game.getPlayers().filter(p=>p.getRole().getName()==role && p.getStatus()=="Alive").length>0)
      return true;
    return false;
  }

  roleExistsInActions(roleName: string){
    if(this.game.getActions().filter(a=>a.getUser().getRole().getName()==roleName).length>0)
      return true;
    return false;
  }

  getActionOfTheRole = (roleName: string) => {
    return this.game.getActions().find(a=>a.getUser().getRole().getName()==roleName);
  }

  witchFlag(action: Action){

    // get witch's command
    let witchAction = this.getActionOfTheRole('Witch');

    if(!witchAction) return false;
  
    // if there is a witch command
    if(witchAction.length>0){ 

      witchAction = witchAction[0];

      // if this is the witch's action
      if(witchAction==action){
        return true;
      }

      //if u are not the witch's pawn
      if(action.getPerformer().getId()!=witchAction.getPerformer().getId()){
        return true;
      }

      if(action.getUser().getId()!=witchAction.getPerformer().getId()){
        return true;
      }

    }else{
      return true;
    }

    return false;
  }

  killFlagMafioso(user,performer){

    switch(user.getRole().getName()){
      case "Witch": return true;
        break;
      case "Godfather":
        if(!this.roleExistsInActions("Witch")){
          return true;
        }
       break;
      case "Mafioso":
        if(!this.roleExistsInActions("Godfather")){
          return true;
        }
        break;
    }
   
  }

  async promoteMafia(){
    let mafias = this.game.getPlayers().filter(p=>p.getRole().getAlignment()=="Mafia" && p.getStatus()=="Alive");
    let gf = mafias.filter(p=>p.getRole().getName()=="Godfather");
    if(gf.length==0&&mafias.length>0){
      let gf_role = roles.list.filter(r=>r.Name=="Godfather");
      gf_role = gf_role[0];
      let luckyGuy;
      if(mafias.length>1){
        luckyGuy = mafias.filter(maf=> maf.getRole().getName()!="Mafioso")[0];
      }else{
        luckyGuy = mafias[0];
      }
      if(luckyGuy){
        luckyGuy.setRole(new Role(gf_role));
        await util.delay(1000);
        let content = `${luckyGuy.getUsername()} has been promoted to Godfather!`;
        let msg = `${this.Lwrap}${content}${this.Rwrap}`;
        await this.messageMafias(msg);
      }
    }

    mafias = this.game.getPlayers().filter(p=>p.getRole().getAlignment()=="Mafia" && p.getStatus()=="Alive");
    gf = mafias.filter(p=>p.getRole().getName()=="Godfather");
    let mafioso = mafias.filter(p=>p.getRole().getName()=="Mafioso");

    if(gf.length==1 && mafioso.length==0 && mafias.length>1){
      let luckyGuy;
      let mafioso_role = roles.list.filter(r=>r.Name=="Mafioso")[0];
      luckyGuy = mafias.filter(maf=>maf.getRole().getName()!="Godfather")[0];
      if(luckyGuy){
        luckyGuy.setRole(new Role(mafioso_role));
        await util.delay(1000);
        let content = `${luckyGuy.getUsername()} has been promoted to Mafioso!`;
        let msg = `${this.Lwrap}${content}${this.Rwrap}`;
        await this.messageMafias(msg);
      }
    }
  }

  getVisitors(player){
    let visitors_actions = this.game.getActions().filter(a=>a.getFirstTarget().getId()==player.getId() && a.getCommand().VisitsTarget());
    let visitors=[];
    visitors_actions.forEach(va => {
      visitors.push(va.getPerformer());
    });
    return visitors;
  }


  areValidTargets(user,command_name,inputs,targetables,players){
    let valids=[];
    let dead = [];
    let multiple = [];
    let notFound=[];
    let redundants=[];
    let unable = [];
    let yourself = [];

    inputs.forEach(input => {
      let result = this.findName(targetables,input);
        if(result.length==1 && result){
            let redundancyChecker=valids.filter(v=>v.getId()==result[0].getId());
            // if(redundancyChecker.length==0){
                valids.push(result[0]);
            // }else{
            //     redundants.push(input);
            // }
        }else{
            let found = this.findName(players,input);
            if(found.length==1){
              found = found[0];
              if(found.getId()==user.getId()){
                  yourself.push(user);
              }else{
                  if(found.getStatus()=="Alive"){
                      unable.push(found.getUsername());
                  }else{
                      dead.push(found);
                  }
              }           
            }else if(result.length>1){
                multiple.push(input);
            }else{
              notFound.push(input);
            }
        }
    });

    let body="";
    let footer="";
    let duration = 0;

    if(notFound.length>0){
        notFound= util.stringTheNames(notFound);
        body = `Can't find "**${notFound}**".`;
    }else if(redundants.length>0){
        redundants = util.stringTheNames(redundants);
        body = `You can't target ${redundants} more than once.`;
    }else if(dead.length>0){
        body = `${dead[0].getUsername()} is already dead.`;
        footer = `type .players to see who are alive`;
    }else if(multiple.length>0){
        multiple = util.stringTheNames(multiple);
        let mgrammar;
        if(multiple.length==1){
          mgrammar = "keyword";
        }else{
          mgrammar = "keywords";
        }
        body = `There are multiple players with the ${mgrammar} "${multiple}".`;
        footer = `Please be more specific`;
    }else if(unable.length>0){
        unable = util.stringTheNames(unable);
        body = `"${unable}" cannot be targeted.`;
    }else if(yourself.length>0){
        body = `You can't ${command_name} yourself!`;
    }else{
        return valids;
    }   

    user.sendResponse(body,footer,duration);
  }
  
}

