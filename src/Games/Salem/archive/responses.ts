import Command from "../command";
import Player from "../player";

const responses = {

  cantTalk: `You can't talk right now.`,
  blackmailed: `You are being blackmailed! You can't talk right now, `,
  commandNeitherFoundNorAvailable: `That command is neither found nor available.`,
  actionRequireTwoTargets: `The action requires two targets.`,
  actionRequireOneTarget: `The action requires one target.`,

  multipleCommandsFound: ({ searchResults }: { searchResults: string[] }) => {
    const commands = searchResults.map(c => `**${c}**`).join(', ');
    return `Multiple commands found: ${commands}`;
  },

  multiplePlayersFound: ({ searchResults }: { searchResults: Player[] }) => {
    const commands = searchResults.map(p => `**${p.getUsername()}**`).join(', ');
    return `Multiple players found: ${commands}\n(Please be more exact).`;
  },

  playerWithKeywordNotFound: (keyword: string) => {
    return `Player with keyword '${keyword}' not found.\n(They might be dead or doesn't exist at all.)`;
  },

  commandRequiresTarget: (command: Command) => {
    const grammar = command.targetCount === 1 ? 'target' : 'targets';
    return `The '${command.getName()}' command  requires ${command.targetCount} ${grammar}.`;
  },

}

export default responses