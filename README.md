# Lunaris (Discord Bot)

This Discord bot is a multiplayer game based on the popular game "Town of Salem". It is made with Node.js and TypeScript and allows users to play a text-based version of the game in a Discord server.

## Getting Started

To get started with the bot, you'll need to follow these steps:

1. Clone the repository to your local machine.
2. Create a new Discord application and bot account [here](https://discord.com/developers/applications).
3. Add the bot to your Discord server using the client ID from the application page.
4. Install the required dependencies by running `npm install`.
5. Create a `.env` file in the root directory of the project with the following variables:

DISCORD_BOT_TOKEN=<your_bot_token>

6. Start the bot by running `npm run start`.

## How to Play

Once the bot is up and running, users can start a new game by typing `$salem` in a channel where the bot is present. Players must then join the game by reacting with the "🚪" emoji to the message the bot sends.

The game will then proceed with alternating day and night phases, where players can vote to lynch suspected mafia members during the day, and mafia members can choose a player to kill during the night. The game continues until either the mafia or the town wins.

## Contributing

If you'd like to contribute to the project, feel free to fork the repository and submit a pull request with your changes. Please follow the Code of Conduct outlined in the repository.