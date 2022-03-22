import welcome from '../../archive/welcome';
import { arrayContainsElement, createEmbed } from '../../../../Helpers/toolbox';
import MessageManager from './messageManager';

interface Params { messageManager:MessageManager }

export const clock = ({messageManager}:Params) => {
  const game = messageManager.getGame();
  const clock = game.getClock();
  const phase = clock.getPhase();
  const round = clock.getRound();
  const half = phase.name === 'Night' ? 'Night' : 'Day';
  const secondsRemaining = clock.getSecondsRemaining();

  const roundString = `${half} ${round}`
  const phaseString = `Phase: ${phase.name}`;
  const secondsString = `Seconds Remaining: ${secondsRemaining}`;

  const title = `Clock`;
  const description = `${roundString}\n${phaseString}\n${secondsString}`

  return createEmbed({title,description})
}

export const  judge = ({messageManager}:Params) => {
  const game = messageManager.getGame();
  const player = messageManager.getPlayer();
  const judgements = game.getJudgements();
  const title = `⚖️ The Judgement`
  const voteString = judgements.map(({ string }) => string).join(`\n`);
  const description = `**Accused: ${game.getVotedUp().getUsername()}**\n\n${voteString}\n`
  return createEmbed({ title, description });
}

export const welcomeGuide = ({messageManager}:Params) => {
  const manager = messageManager;
  const game = manager.getGame();
  const page = manager.getPage();
  const player = manager.getPlayer();
  const welcomeGuideBook = welcome({game, player});
  manager.setMaxPage(welcomeGuideBook.length);

  const description = welcomeGuideBook[page-1];
  return createEmbed({ description });
}

export const playerRole = ({messageManager}:Params) => {
  const page = messageManager.getPage();
  const player = messageManager.getPlayer()
  const isFirstPage = page === 1;
  const title       = isFirstPage ? `` : `${player.getRole().getName()}`;
  const description = isFirstPage ? `Tap the 🔱 to see your role!` : `${player.getRole().getGoals()}`;
  const footer      = isFirstPage ? `` : `Don't share this info with anyone unless you trust them!`;
  return createEmbed({ title,description,footer });
}

export const phaseCommands = ({messageManager}:Params) => {
  const game = messageManager.getGame();
  const prefix = game.getPrefix();
  const phase = game.getClock().getPhase().name;
  const player = messageManager.getPlayer();
  const playerStatus = player.getStatus();
  const phaseGrammar = phase === 'Night' ? 'Night' : 'Day';
  const title =  `Your ${phaseGrammar} Commands`;
  const description = player.getRole().getCommands().map((command)=>{
    const commandHasAStock = command.getStocks() > 0;
    const commandIsRoleCommand = command.getPermission() === 'Role Holder';
    const commandAvailableDuringPhase = arrayContainsElement(command.getPhases(),phase);
    const commandMatchesPlayerStatus = arrayContainsElement(command.getRequiredStatus(), playerStatus);
    if( commandHasAStock && commandIsRoleCommand && 
        commandMatchesPlayerStatus && commandAvailableDuringPhase ) {
          const commandName = command.getName();
          const commandStocks = command.getStocks();
          const grammar = commandStocks === 1 ? 'use' : 'uses';
          return `${prefix}${commandName} (${commandStocks} ${grammar} left)`;
    }
  }).join(`\n`);

  return createEmbed({ title,description });
}

export const availableCommands = ({messageManager}:Params)=>{

  const game = messageManager.getGame();
  const phase = game.getClock().getPhase();
  const player = messageManager.getPlayer();
  const playerStatus = player.getStatus();
  const allCommands = player.getRole().getCommands();

  const availableCommands = allCommands.filter((c)=>{
    const availableDuringPhase = arrayContainsElement(c.getPhases(),phase.name);
    if(!availableDuringPhase) return false
    const permission = c.getPermission();
    switch(permission){
      case 'Player': return true
      case 'Host': return game.isHost(player)
      case 'Admin': return game.isAdmin(player)
      case 'Role Holder': return (c.getStocks()>0 && arrayContainsElement(c.getRequiredStatus(),playerStatus))
    }
  })
 
  const title = `Your Commands`;
  const footer = `You can shorten the commands if you hate typing.`
  const description = availableCommands.map((command)=>command.getName()).join(`\n`);
  return createEmbed({title,description,footer});
}

export const countDown = ({ messageManager }:Params) => {
  const clock = messageManager.getGame().getClock();
  const phase = clock.getPhase();
  const secondsRemaining = clock.getSecondsRemaining();
  const description = `${phase.name} will end in ${secondsRemaining}...`;
  return createEmbed({ description });
}

export const playerList = ({messageManager}:Params) => {
  const players = messageManager.getGame().getPlayers();
  const title = `Players`;
  const description = players.map((player)=>`${player.getListNumber()}. ${player.getUsername()} (${player.getStatus()})`).join(`\n`);
  return createEmbed({ title, description });
}