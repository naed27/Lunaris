import { Interaction, MessageReaction, User } from 'discord.js';
import MessageManager from './messageManager';
import { capitalizeFirstLetters, createChoices } from '../../../../Helpers/toolbox';
import responses from '../../archive/responses';
import { doubleTargetMenu, noTargetPopUp, singleTargetMenu } from '../commandCallHandlers';

interface Params { messageManager: MessageManager }

export interface ReactCollector {
  ({ messageManager }: Params) : Promise<void>
}

export const playerRole: ReactCollector = async ({messageManager}) => {

  const manager = messageManager;
  const message = messageManager.getMessage();
  if(!message) return

  await message.react('🔱');
  const filter = (reaction: MessageReaction, user: User) => !user.bot;
  const collector = message.createReactionCollector({filter});

  const updatePageNumber = async (reaction: MessageReaction)=>{
    await message.reactions.removeAll();
    if( reaction.emoji.name == '↩️'  ) { message.react('🔱'); return manager.pagePrev(); }
    if( reaction.emoji.name == '🔱'  ) { message.react('↩️'); return manager.pagePrev(); }
  }

  collector.on('remove', async (reaction) => updatePageNumber(reaction));
  collector.on('collect', async (reaction) => updatePageNumber(reaction));
}

export const phaseCommandsButtons: ReactCollector = async ({messageManager}) => {
  const manager = messageManager;
  const game = manager.getGame();
  const player = manager.getPlayer();
  const message = manager.getMessage();
  const embed = manager.generateEmbed();

  if(!message) return

  const availableCommands = player.getAvailableSkillCommands();
  const phaseSkillCommands = []
  const phaseHostCommands  = []
  const phaseAdminCommands  = []
  const phaseActionCommands  = []
  const phaseUniversalCommands  = []

  availableCommands.map((command) => {
    const commandType = command.getType();
    switch(commandType){
      case 'Host Command': phaseHostCommands.push(capitalizeFirstLetters(command.name)); break;
      case 'Admin Command': phaseAdminCommands.push(capitalizeFirstLetters(command.name)); break;
      case 'Skill Command': phaseSkillCommands.push(capitalizeFirstLetters(command.name)); break;
      case 'Action Command': phaseActionCommands.push(capitalizeFirstLetters(command.name)); break;
      case 'Universal Command': phaseUniversalCommands.push(capitalizeFirstLetters(command.name)); break;
    }
  })

  const menu = []
  
  if(phaseAdminCommands.length > 0) menu.push('Admin');
  if(phaseHostCommands.length > 0) menu.push('Host');
  if(phaseSkillCommands.length > 0) menu.push('Skill');
  if(phaseActionCommands.length > 0) menu.push('Actions');
  if(phaseUniversalCommands.length > 0) menu.push('Others');

  const choices = createChoices({choices:menu})

  manager.editChoices(choices);

  const filter = (i:Interaction) => i.user.id === player.getId();
  const collector = message.createMessageComponentCollector({ filter, componentType: 'BUTTON' });

  collector.on('collect', async (i) => {
    i.deferUpdate()
    const chosen = i.customId as 'Host' | 'Admin' | 'Skill' | 'Actions' | 'Others'

    switch(chosen){
      case 'Host': {
        manager.editChoices(createChoices({choices:phaseHostCommands}));
        break;
      }
      case 'Admin': {
        manager.editChoices(createChoices({choices:phaseAdminCommands}));
        break;
      }
      case 'Skill': {
        manager.editChoices(createChoices({choices:phaseSkillCommands}));
        break;
      }
      case 'Actions': {
        manager.editChoices(createChoices({choices:phaseActionCommands}));
        break;
      }
      case 'Others': {
        manager.editChoices(createChoices({choices:phaseUniversalCommands}));
        break;
      }

      default: {
        const command = availableCommands.find(c => c.name === i.customId.toLowerCase());
        const menuParams = { ARGS: [], command, game, player }
        player.endAllActionInteractions();
        if(command.targetCount===0){
          await noTargetPopUp(menuParams)
        }else{
          if(command.hasMenu()){
            if(command.targetCount===1) 
              player.setInteractionCollectors([...await singleTargetMenu(menuParams)])
            if(command.targetCount===2) 
              player.setInteractionCollectors([...await doubleTargetMenu(menuParams)])
          }else{
            player.alert(responses.commandRequiresTarget(command))
          }
        }
      }
    }
    return
  });

}

export const welcome: ReactCollector = async ({messageManager}) => {
  
  const manager = messageManager;
  const game = manager.getGame();
  const player = manager.getPlayer();
  const message = manager.getMessage();
  const embed = manager.generateEmbed();

  if(!message) return

  const choices = createChoices({choices:['See Profile', 'Change Name', "I'm Ready!"]})

  manager.edit({ embeds:[embed], components:[choices] });

  const filter = (i:Interaction) => i.user.id === player.getId();
  const collector = message.createMessageComponentCollector({ filter, componentType: 'BUTTON' });

  collector.on('collect', async (i) => {
    i.deferUpdate()
    const chosen = i.customId

    if(
         chosen !== 'See Profile'
      && chosen !== 'Change Name'
      && chosen !== "I'm Ready!"
      && chosen !== 'Back'
    ) return

    switch(chosen){
      case 'See Profile': {
        manager.setPage(2); 
        break;
      }
      case 'Change Name': {
        manager.setPage(3); 
        break;
      }
      case "I'm Ready!": {
        const newchoices = createChoices({choices:['Back']});
        player.setPlayStatus('Ready');
        manager.setPage(4); 
        manager.editChoices(newchoices);
        break;
      }
      case 'Back': {
        player.setPlayStatus('Not Ready');
        manager.setPage(1); 
        manager.editChoices(choices);
        break;
      }
    }

    game.getPlayers().map(p => p.getChannelManager().manageWelcomeGuide().update());
    return
  });

}

export const judgement: ReactCollector = async ({messageManager}) => {
  const manager = messageManager;
  const game = manager.getGame();
  const player = manager.getPlayer();
  const message = manager.getMessage(); 
  if(!message) return
  const embed = manager.generateEmbed();
  const choices = createChoices({choices:['Guilty', 'Innocent', 'Abstain']})

  message.edit({ embeds:[embed], components:[choices] });

  const filter = (i:Interaction) => i.user.id === player.getId();
  const collector = message.createMessageComponentCollector({ filter, componentType: 'BUTTON' });

  collector.on('collect', async (i) => {
    i.deferUpdate()
    const choice = i.customId;
    if(choice === 'Abstain' || choice === 'Innocent' || choice==='Guilty'){
      game.pushJudgement({judge:player, choice});
      player.setJudgement(choice);
    }
    return
  });

}