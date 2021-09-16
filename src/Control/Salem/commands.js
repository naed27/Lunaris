const roles = require("../../Salem/roles");
const guidebook = require("../../Salem/guide");
const { MessageEmbed } = require("discord.js");
// const Town = require("../Salem/town");
// const Host = require("../Salem/host");
const { uniqueFilter,sortAlphabetically } = require('../../Helpers/toolbox')
const command = exports;

command.salemRoles = (message) =>{
      
  // get role types
  let types = uniqueFilter(roles.list.map((role)=>role.Alignment));


  // get the roles under each types
  let roleGroups = types.map((type)=>{
    let r = roles.list.filter(r=>r.Alignment==type);
    let arr = r.map((e)=>e.Name);
    return {
      type:type,
      roles:sortAlphabetically(arr)
    };
  });


  // finalize the string
  let resultString = "";
  roleGroups.forEach(group => {
    resultString += `**(${group.type})**\n`;
    for (let i = 0; i < group.roles.length; i++) {
      resultString+=`${group.roles[i]}\n`;
      if(i==group.roles.length-1){
        resultString+=`\n`;
      }
    }
  });


  // send the result to discord
  const embed = new MessageEmbed()
  .setColor(`#000000`)
  .setTitle(`Roles in Salem`)
  .setDescription(`---------------\n${resultString}`)
  .setFooter('Type $role <rolename> for more info.');
  message.channel.send({embeds:[embed]});     
}


command.salemGuide =  async (message) => {

  let page = 1;
  let guide;
  let body = guidebook.pages[page-1];
  const embed = new MessageEmbed()
  .setColor(`#000000`)
  .setDescription(`${body}`)
  .setFooter(`Page ${page}/${guidebook.pages.length}`);
  guide = await message.channel.send({embeds:[embed]}); 
  
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
}