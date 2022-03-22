import Game from "../game"
import Player from "../player"

export default ({game, player}:{game: Game, player: Player}) => {
  return [
    //----------------------------------------
    `**Town Of Salem**
    \nStatus: ${player.getStatus()}
    \nPlayers who are ready: (${game.getPlayers().filter(p=>p.isReady()).length}/${game.getPlayers().length})
    `,

    //----------------------------------------
    `**Profile**
    Name: ${player.getDiscord().user.username}
    Username: ${player.getUsername()}
    Status: ${player.getStatus()}
    Role: ${player.getRole()}
    Abilities: ${player.getRole().getAbilities().join("\n")}
    Skill Commands: 
    \n${player.getRole().getCommands().map((c)=> c.getGuide()).join("\n")}
    How to Win: ${player.getRole().getGoals().join("\n")}
    `,

    //----------------------------------------
    `Type ".changename <new name>" to change your in-game name."`,

    //----------------------------------------
    `**Town Of Salem**
    \nStatus: ${player.getStatus()}
    \nPlayers who are ready: (${game.getPlayers().filter(p=>p.isReady()).length}/${game.getPlayers().length})`,

    //----------------------------------------
  
  ]
}
