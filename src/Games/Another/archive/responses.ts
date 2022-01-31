import Player from "../player";

const responses = {

  blackmailed: `You are being blackmailed! You can't talk right now, `,
  commandNeitherFoundNorAvailable: `Such command is neither found nor available.`,
  playerNeitherFoundNorAvailable: `Such player is neither found nor available.`,
  playerIsDead: `That player is dead.`,
  playerCannotBeTargeted: `That player cannot be targeted.`,
  youCantTargetYourself: `You can't target yourself.`,

  multipleCommandsFound: ({ searchResults }: { searchResults: string[] }) => {
    const commands = searchResults.map(c => `**${c}**`).join(', ');
    return `Multiple commands found: ${commands}`;
  },

  multiplePlayersFound: ({ players }: { players: Player[] }) => {
    const commands = players.map(p => `**${p.getUsername}**`).join(', ');
    return `Multiple results found: ${commands}`;
  },


}

export default responses