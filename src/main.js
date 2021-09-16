require('dotenv').config();
const {Client,Intents} = require('discord.js');
const { initializeAnother } = require('./Control/Another/commands');
const { salemRoles } = require("./Control/Salem/commands");
const { parseCommand } = require("./Helpers/toolbox");
const Inventory = require("./Core/inventory");
const AnotherServer = require('./Servers/anotherServer');
const { test, salem, sg, role } = require("./Core/admin");

const inventory = new Inventory();
const anotherServer = new AnotherServer();

const client = new Client(
    { intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]}
);

const PREFIX = "$";

client.on('ready',function(){
    client.user.setActivity('Dice with God', { type: 'PLAYING' });
    console.log(`${client.user.username} has logged in.`);
});

//~~~~~~~~~~~~~~~~~~~~~~~~~ WHEN SOMEONE SENDS A MESSAGE ~~~~~~~~~~~~~~~~~~~~~~~~

client.on('messageCreate', async (message) =>{
    if(message.author.bot || !message.content.startsWith(PREFIX))return;
 
    // splits the command name from args
    const [COMMAND,ARGS] = parseCommand(PREFIX,message.content);

    // commands
    switch(COMMAND){

        case 'test':test(message,inventory);break;

        case 'salem':salem(message,inventory);break;

        case 'sg': sg(message);break;
        
        case 'roles':salemRoles(message);break;

        case 'role':role(message,ARGS);break;

        case 'another': initializeAnother(message,anotherServer);break;

    }

});



client.on('messageUpdate', (oldMessage, m) => {
    if(!m.author.bot){
        let player;
        inventory.getTowns().forEach(t => {
            t.getPlayers().forEach(p => {
                p.getChannels().forEach(c => {
                    if(c.getChannel().id == m.channel.id && c.getName()=="notebook"){
                        player = p;
                    }
                });
            });
        });
        
        if(player){
            player.setNotes(m.content);
        }
    }
});

client.login(process.env.DISCORDJS_BOT_TOKEN);





