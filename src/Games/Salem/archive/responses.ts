const responses = {

  cantTalk: `You can't talk right now.`,
  blackmailed: `You are being blackmailed! You can't talk right now, `,
  commandNeitherFoundNorAvailable: `That command is neither found nor available.`,

  multipleCommandsFound: ({ searchResults }: { searchResults: string[] }) => {
    const commands = searchResults.map(c => `**${c}**`).join(', ');
    return `Multiple commands found: ${commands}`;
  }
}

export default responses