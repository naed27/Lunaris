const util = require("../Salem/utility");
const roles = require("../Salem/roles");
const guidebook = require("../Salem/guide");
const { MessageEmbed } = require("discord.js");
const Town = require("../Salem/town");
const Host = require("../Salem/host");


module.exports = {
  //COMMAND FUNCTIONS
   
    role: (message,args) =>{

      let prefix = ".";

      let embed = new MessageEmbed()
      .setColor(`#000000`)
      .setFooter('Type $roles to see all the roles.');
      if(args.length>0){
        let keyword = args.join(" ");
        let role = util.findWord(roles.list.map(r=>r.Name),keyword);
        if(role){
          if(role.length==1){
            role = role[0];
            role = roles.list.filter(r=>r.Name==role);
            let abilities = role[0].Abilities;
            let ability_list="";
            for(let i=0;i<abilities.length;i++){
              ability_list+=`- ${abilities[i]}`;
              if(i<abilities.length){
                ability_list+=`\n`;
              }
            }
            let agrammar;
            if(abilities.length>1){
              agrammar = "Abilities";
            }else{
              agrammar = "Ability";
            }
  
            let goals = role[0].Goals;
            let goals_list="";
            for(let i=0;i<goals.length;i++){
              goals_list+=`- ${goals[i]}`;
              if(i<goals.length){
                goals_list+=`\n`;
              }
            }
  
            let ggrammar;
            if(goals.length>1){
              ggrammar = "Goals";
            }else{
              ggrammar = "Goal";
            }
  
            let commands = role[0].Commands;
            let commands_list="";
            for(let i=0;i<commands.length;i++){
              commands_list+=`${prefix}${commands[i].Guide}`;
              if(i<commands.length){
                commands_list+=`\n`;
              }
            }
  
            let grammar;
            if(commands.length>1){
              grammar = "Commands";
            }else{
              grammar = "Command";
            }
  
            let stringy  = `**Alignment:** ${role[0].Alignment}\n**Type:** ${role[0].Type}\n\n**${ggrammar}:**\n${goals_list}\n**${agrammar}:**\n${ability_list}\n**Skill ${grammar}:**\n${commands_list}`;
            embed
            .setTitle(`${role[0].Name}`)
            .setDescription(`${stringy}`);
  
          }else{
            embed
            .setDescription(`
              <@${message.author.id}>, there are multiple roles with that keyword.
            `);
          }
        }else{
          embed
            .setDescription(`
              <@${message.author.id}>, that role does not exist.
            `);
        }
        
      }else{
        embed
          .setDescription(`
            <@${message.author.id}>, the command is $role <rolename>.
          `);
      }
      message.channel.send(embed);   
    },

    test: async () =>{

      console.log("test")
    },

  salem: async (m,inventory) => {
    if (m.channel.type != "dm") {
      let temp = new Town(inventory,m.guild,m.author);
      temp.setHost(new Host(m,temp));
      let town = inventory.fetchTown(temp,m.guild);
      
      if(inventory.pushPortal(m.guild))
        town.getHost().sendTicket(m.channel,m.author);
      
    }
  },

  sg: async (m) => {

    let page = 1;
    let guide;
    let body = guidebook.pages[page-1];
    let embed = new MessageEmbed()
    .setColor(`#000000`)
    .setTitle(``)
    .setDescription(`${body}`)
    .setFooter(`Page ${page}/${guidebook.pages.length}`);
    guide = await m.channel.send(embed); 
    const filter = () => {return true;};
    let collector = guide.createReactionCollector(filter,{dispose:true});
    collector.on('collect', async (reaction, user) => {
      if(!user.bot){
        switch(reaction.emoji.name){
          case "⬅️":
            if(page>1){page--;}else{page=guidebook.pages.length;}
            break;
          case "➡️":
            if(page<guidebook.pages.length){page++;}else{page=1;}
            break;
        }
        pageUpdater(page,embed,guide);
      }
    });

    collector.on('remove', async (reaction, user) => {
      if(!user.bot){
        switch(reaction.emoji.name){
          case "⬅️":
            if(page>1){page--;}else{page=guidebook.pages.length;}
            break;
          case "➡️":
            if(page<guidebook.pages.length){page++;}else{page=1;}
            break;
        }
        pageUpdater(page,embed,guide);
      }
    });

    await guide.react("⬅️");
    guide.react("➡️");

    function pageUpdater(page,embed,address){
      body = guidebook.pages[page-1];
      embed
      .setDescription(`${body}`)  
      .setFooter(`Page ${page}/${guidebook.pages.length}`);
      address.edit(embed);
    }
  },


};


 

