require('dotenv').config();

import { Client, Intents } from 'discord.js';
import { parseCommand } from "./Helpers/toolbox";
import SalemServer from "./Servers/SalemServer";
import AnotherServer from './Servers/AnotherServer';
import { initializeAnother } from './Triggers/Another';
import CloverClubserver from './Servers/CloverClubserver';
import { initializeCloverClub } from './Triggers/CloverClub';
import { test1, test2 } from './Triggers/Tester';
import { initializeSalem, salemGuide, getSalemRole, getSalemRoles } from './Triggers/Salem';

const salemServer = new SalemServer();
const anotherServer = new AnotherServer();
const cloverClubServer = new CloverClubserver();

const client = new Client(
    { intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]}
);

export const PREFIX = "$";

client.on('ready',function(){
    client.user.setActivity('Dice with God', { type: 'PLAYING' });
    console.log(`${client.user.username} has logged in.`);
});

client.on('messageCreate', async (message) =>{
    if(message.author.bot || !message.content.startsWith(PREFIX))return;

    const {COMMAND,ARGS} = parseCommand(PREFIX,message.content,',');

    switch(COMMAND){
        case 'test1': test1(message);break;
        case 'test2': test2(message);break;
        case 'sg':  salemGuide(message) ;break;
        case 'roles': getSalemRoles(message) ;break;
        case 'role': getSalemRole(message, ARGS) ;break;
        case 'salem': initializeSalem(message, salemServer, ARGS) ;break;
        case 'another': initializeAnother(message, anotherServer) ;break;
        case 'cloverClub': initializeCloverClub(message, cloverClubServer) ;break;
        default:break;
    }
});


client.login(process.env.DISCORDJS_BOT_TOKEN);