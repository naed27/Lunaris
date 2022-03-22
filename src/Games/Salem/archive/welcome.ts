import Game from "../game"
import Player from "../player"

export default ({game, player}:{game: Game, player: Player}) => {
  return [
    //----------------------------------------
    `**Town Of Salem**
    \nPlayers who are ready: (${game.getPlayers().filter(p=>p.isReady()).length}/${game.getPlayers().length})
    `,

    //----------------------------------------
    `**Profile**\n\nName: ${player.getDiscord().user.username}\nUsername: ${player.getUsername()}\nStatus: ${player.getStatus()}\nRole: ${player.getRole().getName()}\nAbilities: ${player.getRole().getAbilities().join("\n")}\nSkill Commands: \n${player.getRole().getCommands().filter(c=>c.getPermission()==='Role Holder').map((c)=> `-${c.getGuide()}`).join("\n")}\nHow to Win: ${player.getRole().getGoals().join("\n")}`,

    //----------------------------------------
    `Type ".changename <new name>" to change your in-game name."`,

    //----------------------------------------
    `**Town Of Salem**
    \nPlayers who are ready: (${game.getPlayers().filter(p=>p.isReady()).length}/${game.getPlayers().length})`,

    //----------------------------------------
  
  ]
}
