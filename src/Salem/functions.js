const util = require("./utility");
const modes = require("./modes");
const dummy_names = require("./dummy_names");
const roles = require("./roles");
const Role = require("./role");
const {MessageEmbed, Guild} = require('discord.js');


class Functions{

  town;
  Lwrap = `‎\n\`\`\`json\n`;
  Rwrap = `\`\`\``;

  constructor(town){
    this.town = town;
  }

  findRoleLine(inputs){

    let line_index = inputs[0];
    let pool = [];

    if(line_index>=0||line_index<this.town.getHost().getPlayers().length){
      line_index--;
      inputs.shift();
      pool = roles.list;

      for (let i = 0; i < inputs.length; i++) {
        
        pool = pool.filter(r=>util.containsKeyword(r.Alignment,inputs[0])||util.containsKeyword(r.Type,inputs[0])||util.containsKeyword(r.Name,inputs[0])||util.containsInitials(r.Name,inputs[0]));
      }

      const als = [...new Set(pool.map(r=>r.Alignment))];
      const types = [...new Set(pool.map(r=>r.Type))];
      const names = [...new Set(pool.map(r=>r.Name))];

      let lineUp = [als.join("")];
        
      if(types.length>1){
        lineUp.push("Random");
      }else{
        lineUp.push(types.join(""));
      }

      if(names.length>1){
        lineUp.push("Random");
      }else{
        lineUp.push(names.join(""));
      }

      return [line_index,lineUp];
    }
    
    return false;
  }

  findCommand(commands,keyword){
    let filtered = [];
    let startWiths = commands.filter(c=>c.getName().toLowerCase().startsWith(keyword.toLowerCase()));
    let keysFound = commands.filter(c=>util.containsKeyword(c.getName().toLowerCase(),keyword.toLowerCase()));
    let initialsFound = commands.filter(c=>util.containsInitials(c.getName().toLowerCase(),keyword.toLowerCase()));
    if(startWiths.length==1 || startWiths.filter(c=>c.getName().toLowerCase() == keyword.toLowerCase()).length==1){
      if(startWiths.length==1){
        filtered.push(startWiths[0])
      }else{
        let c = startWiths.filter(c=>c.getName().toLowerCase() === keyword.toLowerCase());
        filtered.push(c[0])
      }
      return filtered;
    }else if(startWiths.length>1){
      startWiths.forEach(c => {
        filtered.push(c);
      });
      return filtered;
    }else{
      if(keysFound.length==1){
        filtered.push(keysFound[0])
        return filtered;
      }else if(keysFound.length>1){
        keysFound.forEach(c => {
          filtered.push(c)
        });
        return filtered;
      }else{
        if(initialsFound.length==1){
          filtered.push(initialsFound[0])
          return filtered;
        }else if(initialsFound.length>1){
          initialsFound.forEach(c => {
            filtered.push(c)
          });
          return filtered;
        }
      }
    }
    return false;
  }

  findName(players,keyword){
    let filtered = [];

    let idsFound = players.filter(p=>p.getListNumber()===keyword);
    let startWiths = players.filter(p=>p.getUsername().toLowerCase().startsWith(keyword.toLowerCase()));
    let keysFound = players.filter(p=>util.containsKeyword(p.getUsername().toLowerCase(),keyword.toLowerCase()));
    let initialsFound = players.filter(p=>util.containsInitials(p.getUsername().toLowerCase(),keyword.toLowerCase()));
    
    if(idsFound.length==1){
      filtered.push(idsFound[0])
      return filtered;
    }else if(idsFound.length>1){
      idsFound.forEach(c => {
        filtered.push(c)
      });
      return filtered;
    }else{
      if(startWiths.length==1 || startWiths.filter(p=>p.getUsername().toLowerCase() == keyword.toLowerCase()).length==1){
        if(startWiths.length==1){
          filtered.push(startWiths[0])
        }else{
          let c = startWiths.filter(p=>p.getUsername().toLowerCase() === keyword.toLowerCase());
          filtered.push(c[0])
        }
        return filtered;
      }else if(startWiths.length>1){
        startWiths.forEach(c => {
          filtered.push(c)
        });
        return filtered;
      }else{
        if(keysFound.length==1){
          filtered.push(keysFound[0])
          return filtered;
        }else if(keysFound.length>1){
          keysFound.forEach(c => {
            filtered.push(c)
          });
          return filtered;
        }else{
          if(initialsFound.length==1){
            filtered.push(initialsFound[0])
            return filtered;
          }else if(initialsFound.length>1){
            initialsFound.forEach(c => {
              filtered.push(c)
            });
            return filtered;
          }
        }
      }
    }
    return false;
  }

  async farewellMessage(msg){
    for (const p of this.town.getPlayers()) {
      let gbye = await p.getHouse().getChannel().send(msg);
      gbye.react('🚪');
      const filter = () => {return true;};
      let collector = gbye.createReactionCollector(filter,{dispose:true});
      collector.on('collect', async (reaction, user) => {
          if(!user.bot){
            switch(reaction.emoji.name){
            case "🚪": 
              let d_user = this.town.getGuild().members.cache.find(m => m.id === p.getId());
              d_user.roles.remove(this.town.getDiscordRole());
              p.getHouse().hideAndClose();
              p.getNotepad().hideAndClose();
            break;
            }
          }
      });
    }
  }

  async messagePlayers(message){
    for await (const p of this.town.getPlayers()) {
      p.getHouse().getChannel().send(message).catch(error => {});
    }
  }

  async messageGhosts(message){
    for await (const p of this.town.getPlayers()) {
      if(p.getStatus()=="Dead"){
        p.getHouse().getChannel().send(message).catch(error => {});
      }
    }
  }

  async messagePlayersWrapped(message){
    message = `${this.Lwrap}${message}${this.Rwrap}`;
    for await (const p of this.town.getPlayers()) {
      p.getHouse().getChannel().send(message).catch(error => {});
    }
  }


  stringifyWinners(winners){
    let string = "End Results:\n";
    this.town.getPlayers().forEach(p => {
        let user = p.getGuild().members.cache.get(p.getId());
        let real_name = user.user.username;
        if(p.getWinStatus()){
          string+=`-----\n${real_name} (${p.getUsername()}) (Victorious)\nRole: ${p.getRole().getName()}\nServer: ${p.getGuild().name}\n`;
        }else{
            string+=`-----\n${real_name} (${p.getUsername()})\nRole: ${p.getRole().getName()}\nServer: ${p.getGuild().name}\n`;
        }
    });
    return string;
  }

  async messageMafias(message){
    let mafias = this.town.getPlayers().filter(p=>p.getRole().getAlignment()=="Mafia");
    for (const m of mafias) {
      m.getHouse().getChannel().send(message);
    }
  }

  async messageOtherMafias(message,sender){
    message = `${this.Lwrap}${message}${this.Rwrap}`;
    let mafias = this.town.getPlayers().filter(p=>p.getRole().getAlignment()=="Mafia" && p.getUsername()!=sender.getUsername());
    for await (const m of mafias) {
      m.getHouse().getChannel().send(message);
    }
  }

  roleExists(role){
    if(this.town.getPlayers().filter(p=>p.getRole().getName()==role && p.getStatus()=="Alive").length>0){
        return true;
    }else{
        return false;
    }
  }

  commandExists(role){
    if(this.town.getActions().filter(a=>a.getUser().getRole().getName()==role).length>0){
        return true;
    }else{
        return false;
    }
  }

  witchFlag(action){

    // get witch's command
    let witch_action = this.town.getActions().filter(a=>a.getUser().getRole().getName()=="Witch");
  
    // if there is a witch command
    if(witch_action.length>0){ 

      witch_action = witch_action[0];

      // if this is the witch's action
      if(witch_action==action){
        return true;
      }

      //if u are not the witch's pawn
      if(action.getPerformer().getId()!=witch_action.getPerformer().getId()){
        return true;
      }

      if(action.getUser().getId()!=witch_action.getPerformer().getId()){
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
        if(!this.commandExists("Witch")){
          return true;
        }
       break;
      case "Mafioso":
        if(!this.commandExists("Godfather")){
          return true;
        }
        break;
    }
   
  }

  async promoteMafia(){
    let mafias = this.town.getPlayers().filter(p=>p.getRole().getAlignment()=="Mafia" && p.getStatus()=="Alive");
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

    mafias = this.town.getPlayers().filter(p=>p.getRole().getAlignment()=="Mafia" && p.getStatus()=="Alive");
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
    let visitors_actions = this.town.getActions().filter(a=>a.getFirstTarget().getId()==player.getId() && a.getCommand().VisitsTarget());
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


module.exports = Functions;