import { Message, MessageEmbed, MessageReaction, User } from 'discord.js';
import { createEmbed, getStringSearchResults, sortWordsAlphabetically, removeDuplicates } from "../Helpers/toolbox";
import roles, { SalemRoleCommand } from "../Salem/roles";
import guidebook from '../Salem/guide';
import SalemServer from '../Servers/SalemServer';
import Town from "../Salem/town";
import Host from "../Salem/host";

export const getSalemRoles = (message:Message) =>{

  const title = 'Salem Roles';
  const footer = 'Type $role <rolename> for more info.'

  // get role types
  const roleTypes = removeDuplicates(roles.map((role)=>role.Alignment));

  // get the roles under each types
  const roleGroups = roleTypes.map((type)=>{
    const result = roles
    .filter(role=>role.Alignment==type)
    .map(role=>role.Name);
    return {
      type:type,
      roles:sortWordsAlphabetically(result)
    };
  });

  // finalize the string
  const resultString = roleGroups.map( ({ type,roles }) =>{
    const rolesUnderType = roles.join('\n');
    return `**(${type})**\n${rolesUnderType}`;
  }).join('\n\n');

  const embed = createEmbed({title,description:resultString,footer});
  message.channel.send({embeds:[embed]});     
}


export const getSalemRole = (message:Message,args:string[])=>{

  if(args.length === 0)return

  const salemPrefix = ".";
  const color = `#000000`;
  const footer = "Type $roles to see all the roles."

  const keyword = args.join(" ");
  const roleNames = roles.map(r=>r.Name);
  const searchResults = getStringSearchResults(roleNames,keyword);

  if(searchResults.length < 1){
    let response = '';
    if(searchResults.length===0)response = `No roles found for ${keyword}`
    if(searchResults.length>1)response = `Multiple roles found for ${keyword}`
    return message.channel.send({embeds:[createEmbed({color,description:response,footer})]});   
  }

  const role = roles.filter(r=>r.Name==searchResults[0])[0];
  
  const abilitiesString = role.Abilities.map(ability=>`- ${ability}`).join("\n");
  const abilityHeader = (role.Abilities.length>1) ? "Abilities" : "Ability";

  const goalsString = role.Goals.map(goal=>`- ${goal}`).join("\n");
  const goalsHeader = (role.Goals.length>1) ? "Goals" : "Goal";

  const commandsString = role.Commands.map((roleCommand:SalemRoleCommand)=>`${salemPrefix}${roleCommand.Guide}`).join("\n");
  const commandsHeader = (role.Commands.length>1) ? "Commands" : "Command";

  const result  = `**[${role.Name}]**\n\n**Alignment:** ${role.Alignment}\n**Type:** ${role.Type}\n\n**${goalsHeader}:**\n${goalsString}\n**${abilityHeader}:**\n${abilitiesString}\n**${commandsHeader}:**\n${commandsString}`;

  return message.channel.send({embeds:[createEmbed({color,description:result,footer})]});   
}


export const initializeSalem = (message:Message,server:SalemServer)=>{
  if (message.channel.type != 'DM') {
    const town = new Town(server,message.guild,message.author);
    town.setHost(new Host(message,town));
    server.pushTown(town);
    
    if(server.pushPortal(message.guild))
      town.getHost().sendTicket(message.channel,message.author);
  }
}


export const salemGuide = async (message:Message) =>{

  const color = `#000000`;

  const initialPage = 1;
  const initialBody = guidebook.pages[initialPage-1];
  const initialFooter = `Page ${initialPage} of ${guidebook.pages.length}`;

  let page = initialPage;
  let footer = initialFooter;
  const embed = createEmbed({color,description:initialBody,footer});

  const guide = await message.channel.send({embeds:[embed]}); 
  const filter = (reaction:MessageReaction,user:User) => !user.bot;
  const collector = guide.createReactionCollector({filter,dispose:true});

  const updatePageNumber = (reaction:MessageReaction)=>{
    const pageStart = 1;
    const pageEnd = guidebook.pages.length;
    if( reaction.emoji.name == '⬅️' && page > pageStart ) return pageUpdater(page--,embed,guide);
    if( reaction.emoji.name == '➡️' && page < pageEnd ) return pageUpdater(page++,embed,guide);
    return
  }
  
  collector.on('collect', async (reaction) => updatePageNumber(reaction));
  collector.on('remove', async (reaction) => updatePageNumber(reaction));

  await guide.react('⬅️');
  await guide.react('➡️');

  const pageUpdater = (page:number,embed:MessageEmbed,address:Message) =>{
    embed
    .setDescription(`${guidebook.pages[page-1]}`)  
    .setFooter(`Page ${page}/${guidebook.pages.length}`);
    address.edit({embeds:[embed]});
  }
}