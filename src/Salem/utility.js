
module.exports = {

    validURL:(str) => { //if its a link
        let pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return !!pattern.test(str);
    },

    checkURL:(url)=> { //if its an image
        return(url.match(/\.(jpeg|jpg|gif|png)$/) != null);
    },


    // FILTERS ALL WHITESPACES AND LINE BREAKS (done)
    cleanString:(cmd,message)=>{
        let [...blargs] = message
        .trim()
        .substring((cmd.length+2))
        .split(/\s+/);
        return blargs;
    },

    // \n spliiter
    splitLineBreaks:(message)=>{
        let [...blargs] = message
        .split('\n');
        return blargs;
    },

    // space spliiter
    splitSpaces:(message)=>{
        let [...blargs] = message
        .split(' ');
        return blargs;
    },

    //gets the exact string the client sent, splits the command from the args
    parseCommand:(prefix,message)=>{
        console.log("ey i ran")
        let [cmd, ...args] = message
        .substring(prefix.length)
        .split(" ");
        return [cmd,args];
    },

    splitComma:(message)=>{
        let [...blargs] = message
        .split(',');
        for (let i = 0; i < blargs.length; i++) {
            if(blargs[i].charAt(0)==" "){
                blargs[i] = blargs[i].substring(1);
            }
        }
        return blargs;
    },


    stringChannelChoices:(array)=>{
        let string ="";
        for(let i=0;i<array.length;i++){
            let temp =`${i+1}. <#${array[i]}>\n`;
            string+=temp;
        }
        return string;
    },

    shuffleArray:(array)=>{
        let currentIndex = array.length, temporaryValue, randomIndex;
  
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
    },


    getMapSize:(map)=>{
        let size=0;
        map.forEach(() => {
            size++;
        });
        return size;
    },


    formatAMPM:(hrs,min)=> {
        let hours = hrs;
        let minutes = min;
        let ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        // minutes = minutes < 10 ? '0'+minutes : minutes;
        let strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    },

    usernameChecker:(input)=>{
        return /^[a-zA-Z]+$/.test(input);
    },

    getFullTime:()=>{
        let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
        let date_nz = new Date(nz_date_string);
        let year = date_nz.getFullYear();
        let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);
        let date = ("0" + date_nz.getDate()).slice(-2);
        let hours = ("0" + date_nz.getHours()).slice(-2);
        let minutes = ("0" + date_nz.getMinutes()).slice(-2)
        let seconds = ("0" + date_nz.getSeconds()).slice(-2);
        let date_time = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
        return date_time;
    },

    getPresentTime:()=>{
        return Math.floor(Date.now()/1000);
    },

    delay: async (ms) =>{ 
        return new Promise(res=>setTimeout(res, ms));
    },

    aToZ:(words)=>{

        for(let i=1;i<words.length;i++){
            let word1 = words[i];
            let lim;
            let limword;
            comparer:for(let j=i-1;j>=0;j--){
                let word2=words[j];
                if(word1.length<word2.length){
                     lim = word1.length;
                     limword = word1;
                }else{
                     lim = word2.length;
                     limword = word2;
                }
                for(let k=0;k<lim;k++){
                    if(word1[k]<word2[k]){
                        words[j]=word1;
                        words[i]=word2;
                        i--;
                        break;
                    }else if(word1[k]==word2[k]){
                        if(k==lim-1&&limword==word1){
                            words[j]=word1;
                            words[i]=word2;
                            i--;
                        }
                    }else if(word1[k]>word2[k]){
                        break comparer;
                    }
                }
            }
        }
        return words;
    },

    lowToHigh:(numbers)=>{
        for(let i=1;i<numbers.length;i++){
            let second = numbers[i];
            for (let j = i-1; j >= 0 ; j--) {
                let first = numbers[j];
                if(second<first){
                    let temp = numbers[i];
                    numbers[i] = numbers[j];
                    numbers[j] = temp;
                    i-=2;
                }
                break;
            }
        }
        return numbers;
    },

    

    areUniqueAndFound:(inputs,database)=>{
        let valids=[];
        let invalids=[];
        for (let i = 0; i < inputs.length; i++) {
            let result = database.filter(n=>module.exports.containsKeyword(n,inputs[i]));
            if(result){
              if(result.length==1){
                valids.push(result[0]);
              }else{
                invalids.push(inputs[i]);
              }
            }
        }     

        if(invalids.length>0 || valids.length==0){
            return [false,invalids];
        }else{
            return [true,valids];
        }   
        
    },

    containsInitials:(name,keyInitials)=>{
        
        if(typeof name === "string" && typeof keyInitials === "string"){
            
            let initials="";
            let names = name.split(" ");
            names.forEach(n => {
                initials+=`${n.charAt(0)}`;
            });
            keyInitials = keyInitials.toLowerCase().replace(/\s+/g, '');

            if(module.exports.containsKeyword(initials,keyInitials)){
                return true;
            }
            
        }
        return false;
    },

    containsKeyword:(name,keyword)=>{
        if(typeof name !== "string" && typeof keyword !== "string")
        return false

        let x=0;
        name = name.toLowerCase().replace(/\s+/g, '');
        keyword = keyword.toLowerCase().replace(/\s+/g, '');
        for (let i = 0; i < name.length; i++) {
            if(name[i]==keyword[x]){
            x++;
            if(x==keyword.length){
                return true;}
            }else{
            x=0;
            }
        }
        return false;
    },

    findWord:(list,keyword)=>{
        let filtered = [];
        let startWiths = list.filter(w=>w.toLowerCase().startsWith(keyword.toLowerCase()));
        let keysFound = list.filter(w=>module.exports.containsKeyword(w.toLowerCase(),keyword.toLowerCase()));
        let initialsFound = list.filter(w=>module.exports.containsInitials(w.toLowerCase(),keyword.toLowerCase()));
        if(startWiths.length==1){
            filtered.push(startWiths[0])
            return filtered;
        }else if(startWiths.length>1){
            filtered.push(...startWiths);
            return filtered;
        }else{
          if(keysFound.length==1){
            filtered.push(keysFound[0])
            return filtered;
          }else if(keysFound.length>1){
            filtered.push(...keysFound)
            return filtered;
          }else{
            if(initialsFound.length==1){
              filtered.push(initialsFound[0])
              return filtered;
            }else if(initialsFound.length>1){
                filtered.push(...initialsFound)
                return filtered;
            }
          }
        }
        return false;
    },

    containsElement:(array,element)=>{
        let res = array.filter(e=>e==element);
        if(res.length>0){
            return true;
        }else{
            return false;
        }
    },

    stringTheNames:(names)=>{
      let res ="";

      for (let i = 0; i < names.length; i++) {
        res+=`**${names[i]}**`;
        if(i<names.length-1){
            res+=`, `;
          if(i==names.length-2){
            res+=`and `;
          }
        }
      }

      return res;
    },

    stringTheNamesClean:(names)=>{
        let res ="";
  
        for (let i = 0; i < names.length; i++) {
          res+=`${names[i]}`;
          if(i<names.length-1){
              res+=`, `;
            if(i==names.length-2){
              res+=`and `;
            }
          }
        }
  
        return res;
      },

    arrangeActions:(actions)=>{
        for(let i=1;i<actions.length;i++){
            let second = actions[i].getCommand().getPriority();
            for (let j = i-1; j >= 0 ; j--) {
                let first = actions[j].getCommand().getPriority();
                if(second<first){
                    let temp = actions[i];
                    actions[i] = actions[j];
                    actions[j] = temp;
                    i-=2;
                }
                break;
            }
        }
        return actions;
    },

    roleExists:(role,town)=>{
        if(town.getPlayers().filter(p=>p.getRole().getName()==role && p.getStatus()=="Alive").length>0){
            return true;
        }else{
            return false;
        }
    },

    gameMessage:(message,channel)=>{
        let Swrap = `‎‎\n\`\`\`json\n`;
        let Ewrap = `\`\`\``;
        let finale = `${Swrap}${message}${Ewrap}`;
        return channel.send(finale);
    },


};

//input.every(function(element) {return element%1==0;})

