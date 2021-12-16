import { Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';
import { createEmbed, getStringSearchResults, sortWordsAlphabetically, removeDuplicates } from "../Helpers/toolbox";
import roles, { SalemRoleCommand } from "../Games/Salem/roles";
import guidebook from '../Games/Salem/archive/guide';
import SalemServer from '../Servers/SalemServer';
import Game from "../Games/Salem/game";
import Host from "../Games/Salem/host";

export const getSalemRoles = (message:Message) =>{

  const title = 'Salem Roles';
  const footer = 'Type $role <rolename> for more info.'

  const roleTypes = removeDuplicates(roles.map((role)=>role.alignment));

  const roleGroups = roleTypes.map((type)=>{
    const result = roles
    .filter(role=>role.alignment==type)
    .map(role=>role.name);
    return {
      type:type,
      roles:sortWordsAlphabetically(result)
    };
  });

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
  const roleNames = roles.map(r=>r.name);
  const searchResults = getStringSearchResults(roleNames,keyword);

  if(searchResults.length < 1){
    let response = '';
    if(searchResults.length===0)response = `No roles found for ${keyword}`
    if(searchResults.length>1)response = `Multiple roles found for ${keyword}`
    return message.channel.send({embeds:[createEmbed({color,description:response,footer})]});   
  }

  const role = roles.filter(r=>r.name==searchResults[0])[0];
  
  const abilitiesString = role.abilities.map(ability=>`- ${ability}`).join("\n");
  const abilityHeader = (role.abilities.length>1) ? "Abilities" : "Ability";

  const goalsString = role.goals.map(goal=>`- ${goal}`).join("\n");
  const goalsHeader = (role.goals.length>1) ? "Goals" : "Goal";

  const commandsString = role.commands.map((roleCommand:SalemRoleCommand)=>`${salemPrefix}${roleCommand.guide}`).join("\n");
  const commandsHeader = (role.commands.length>1) ? "Commands" : "Command";

  const result  = `**[${role.name}]**\n\n**Alignment:** ${role.alignment}\n**Type:** ${role.type}\n\n**${goalsHeader}:**\n${goalsString}\n**${abilityHeader}:**\n${abilitiesString}\n**${commandsHeader}:**\n${commandsString}`;

  return message.channel.send({embeds:[createEmbed({color,description:result,footer})]});   
}


export const initializeSalem = (message:Message,server:SalemServer)=>{

  if (message.channel.type === 'DM') return

  const channelSummoned:TextChannel = message.channel as TextChannel;
  const summoner = message.author;
  const guild = message.guild;

  const game = new Game({
    guild: guild,
    server: server,
  });

  const host = new Host({
    initiator:summoner,
    channelSummoned:channelSummoned,
    game:game,
  })

  game.setHost(host);
  server.pushGame(game);
  
  if(server.connectGuild(message.guild))
    game.getHost().sendGameInvite(channelSummoned,summoner);
}


export const salemGuide = async (message:Message) =>{

  const initialPage = 1;
  const initialBody = guidebook.pages[initialPage-1];
  const initialFooter = `Page ${initialPage} of ${guidebook.pages.length}`;

  let page = initialPage;
  let footer = initialFooter;
  const embed = createEmbed({ description:initialBody,footer });

  const guide = await message.channel.send({embeds:[embed]}); 
  const filter = (reaction:MessageReaction,user:User) => !user.bot;
  const collector = guide.createReactionCollector({filter,dispose:true});

  const updatePageNumber = (reaction:MessageReaction)=>{
    const pageStart = 1;
    const pageEnd = guidebook.pages.length;
    if( reaction.emoji.name == '⬅️' && page > pageStart ) return pageUpdater(page--,embed,guide);
    if( reaction.emoji.name == '➡️' && page < pageEnd ) return pageUpdater(page++,embed,guide);
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