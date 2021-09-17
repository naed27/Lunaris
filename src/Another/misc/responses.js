const { createEmbed } = require("../utility/utility");

const res = exports;



res.multipleCommands = (keyword,foundCommands) =>{
  let listFounds = '';
  foundCommands.forEach(command => {listFounds+=`\n- ${command.Name}`;
    });

  return {
    embed: createEmbed({
      body:`There are multiple commands with the keyword "${keyword}":${listFounds}`,
      footer:`Please enter a more exact keyword.`
    }),
    duration:0
  };

}

res.commandUnavailable = ()=>{
  return {
    embed: createEmbed({
      body:`Command either unavailable or not found.`,
      footer:`Type .help to see the list of commands.`
    }),
    duration:0
  };

}

res.commandResponse = (response)=>{
  return {
    embed: createEmbed({
      body:response,
      footer:'type .cancel to cancel this action.'
    }),
    duration:0
  }
}

res.cantTalkAtNight = ()=>{
  return {
    embed: createEmbed({
      body:`You can't talk at night.`,
      footer:''
    }),
    duration:0
  }
}


res.targetNotFound = (notFoundPlayer)=>{
  return{
    embed: createEmbed({
      body :`Can't find "**${notFoundPlayer}**".`,
      footer:''
    }),
    duration:0
  }
}

res.targetIsDead = (deadPlayer)=>{
  return{
    embed: createEmbed({
      body:`${deadPlayer.getUsername()} is already dead.`,
      footer:`type .players to see who are alive`
    }),
    duration:0
  }
}


res.keywordHasMultipleResults = (target)=>{
  return{
    embed: createEmbed({
      body:`There are multiple players with the keyword "${target}".`,
      footer:`Please be more specific.`
    }),
    duration:0
  }
}

res.targetIsNotAllowedToBeTargeted = (target)=>{
  return{
    embed: createEmbed({
      body:`"${target}" cannot be targeted.`,
      footer:''
    }),
    duration:0
  }
}


res.targetCantBeYourself = (command_name)=>{
  return{
    embed: createEmbed({
      body:`You can't ${command_name} yourself!`
    }),
    duration:0
  }
}


res.commandListClosed = ()=>{
  return{
    embed: createEmbed({
      body:`Here's your command list! 📗`
    }),
    duration:0
  }
}

res.commandListOpen = (player)=>{
  const commands = player.getAvailableCommands();
  let list='';

  for (const command of commands) {
    list+=`\n.${command.Guide}`;
  }

  return{
    embed: createEmbed({
      author:`Available Commands`,
      body:`${list}\n\n--------`,
      footer:`You can shorten the commands if you're a lazy typer!\nYou can also shorten the player names!`
    }),
    duration:0
  }
}

res.nicknameChanged = (newName)=>{
  return{
    embed: createEmbed({
      body:`You have set your nickname to **${newName}**!`
    }),
    duration:0
  }
}

res.pleaseProvideAnArgument = (commandGuide)=>{
  return{
    embed: createEmbed({
      body:`Please provide an argument.`,
      footer:`Command: ${commandGuide}`
    }),
    duration:0
  }
}
