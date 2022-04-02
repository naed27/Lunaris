import { MessageEmbed,ColorResolvable, MessageActionRow, MessageSelectMenu, MessageButton } from 'discord.js';

export const countSimilarElements = <Type>(array:Type[], element: Type):number => {
    const count = array.filter((e)=>e===element).length;
    return count;
}

export const parseCommand = (PREFIX:string,input:string, argsSpliter = ' ') =>{
  const inputWithoutPrefix = input.replace(PREFIX, '');
  const [rawCommand, ...rawArgs] = removeExtraWhitespaces(inputWithoutPrefix).split(' ');
  const COMMAND = rawCommand.toLowerCase();
  const ARGS = rawArgs
    .join(' ')
    .split(argsSpliter)
    .map(arg => removeExtraWhitespaces(arg))
    .filter(arg => arg !== '');
  return { COMMAND, ARGS };
}

export const capitalizeFirstLetters = (string:string) => {
  const words = string.split(' ');
  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export const stringContainsOnlyDigits = (str: string) => /^\d+$/.test(str);

export const removeWhitespaces = (str: string) => str.replace(/\s/g, '')

export const removeExtraLineBreaks = (str:string) => str.replace(/^\n+/,'');

export const removeExtraWhitespaces = (str:string) => str.replace(/\s+/g,' ').trim();

export const splitStringByLineBreak = (input:string) =>  removeExtraLineBreaks(input).split('\n');

export const splitStringByWhitespaces = (input:string) => removeExtraWhitespaces(input).split(' ');

export const splitStringByComma = (message:string)=>{
  const [...blargs] = message.split(',');

  for (let i = 0; i < blargs.length; i++) {
    if(blargs[i].charAt(0)==" "){
      blargs[i] = blargs[i].substring(1);
    }
  }
  return blargs;
}

export const getMapSize = (map:any) =>{
  let size=0;
  map.forEach(() => size++);
  return size;
}

export const getCurrentTime = () => Math.floor(Date.now()/1000)

export const delay = async (milliseconds:number) => new Promise(res=>setTimeout(res, milliseconds))

export const sortWordsAlphabetically = (words:string[])=> words.sort()

export const sortNumbersAscending = (numbers:number[]) => numbers.sort((a,b)=>a-b)

export const sortNumbersDescending = (numbers:number[]) => numbers.sort((a,b)=>b-a)

export const stringContainsKeyword = (mainWord:string,keyword:string) =>{
  const result = mainWord.toLowerCase().includes(keyword.toLowerCase());
  return result;
}

export const stringContainsInitials = (fullName:string,initials:string) =>{
  const nameInitials = fullName.split(' ').map(name=>name.charAt(0)).join('');
  const result = stringContainsKeyword(nameInitials,initials);
  return result;
}

export const stringStartsWithKeyword = (string:string,keyword:string) =>{
  const result = string.toLowerCase().startsWith(keyword.toLowerCase());
  return result;
}

export const getStringSearchResults=(arrayOfWords: string[],keyword:string): string[] => {
  if(keyword === '') return []

  const startWiths = [];
  const keysFound = [];
  const initialsFound = [];

  arrayOfWords.map((mainWord)=>{
    if(stringStartsWithKeyword(mainWord,keyword))return startWiths.push(mainWord)
    if(stringContainsKeyword(mainWord,keyword))return keysFound.push(mainWord)
    if(stringContainsInitials(mainWord,keyword))return initialsFound.push(mainWord)
  })

  if(startWiths.length>0)return startWiths
  if(keysFound.length>0)return keysFound
  if(initialsFound.length>0)return initialsFound

  return [];
}

export const arrayContainsElement = (array:any[],element:any) => array.includes(element)

export const findElementInArray = <Type>(array: Type[], element: Type): Type => array.find(e=>e===element)

export const removeDuplicates = <Type>(array:Type[]):Type[]=>{
  const result:Type[] = [];
  array.forEach((element)=>{
    if(!result.includes(element)){
      result.push(element);
    }
  })
  return result;
}

export const shuffleArray=<T>(array:T[])=>{
  let currentIndex = array.length;
  let temporaryValue:any;
  let randomIndex:number;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

  // Pick a remaining element...
  randomIndex = Math.floor(Math.random() * currentIndex);
  currentIndex -= 1;

  // And swap it with the current element.
  temporaryValue = array[currentIndex];
  array[currentIndex] = array[randomIndex];
  array[randomIndex] = temporaryValue;
  }

  return array;
}

export const stringifyArrayOfNames = (arrayOfNames:string[])=>{
  const result = arrayOfNames.slice(0,arrayOfNames.length-1).join(', ') + ', and ' + arrayOfNames.slice(-1);
  return result;
}

export const createEmbed = ({
  title='',
  description='',
  color=`#000000`,
  author='',
  footer=''
}:{
  title?:string,
  description?:string,
  color?:ColorResolvable,
  author?:string,
  footer?:string
}) => {

  const embed = new MessageEmbed()
  .setTitle(title)
  .setDescription(description)
  .setColor(color)
  .setAuthor(author)
  .setFooter(footer);

  return embed;
} 

export const jsonWrap = (message:string)=>{
  const wrapper = `\`\`\``;
  const format = `json\n`;

  const result = `${wrapper}${format}${message}${wrapper}`;

  return result;
}

export const createMenu = ({
  customId,
  choices,
  placeHolder = 'Choices',
}:{
  placeHolder?:string,
  customId:string,
  choices:{label:string, value:string}[],
}) => {
  return new MessageActionRow()
  .addComponents(
    new MessageSelectMenu()
    .setCustomId(customId)
    .setPlaceholder(placeHolder)
    .addOptions([{label:'None', value: 'None'},...choices.map(({label,value})=> ({ label, value }))])
  )
}

export const createChoices = ({choices}:{choices:string[]}) => {
  return new MessageActionRow()
  .addComponents(
    choices.map((choice)=>
      new MessageButton()
      .setCustomId(choice)
      .setLabel(choice)
      .setStyle('PRIMARY')
    )
  )
}




