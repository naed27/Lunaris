module.exports = {
    tr_calc:(message,math)=>{
        if(message.content.length!=1&&message.content!="true"&&message.content!="false"){
            let res="";
            try {res = math.evaluate(message.content);
                if(message.content!=res&&res/1==res){
                    message.channel.send(res);
                    }
                }
            catch(e) {/* do nothing */}
        }
        return;
    },
    tr_hello:(message)=>{
        message.react('👋');
        return;
    },
    tr_hi:(message)=>{
        message.react('👋');
        return;
    },
    tr_mention:(message)=>{
        message.react('👋')
		.then(() => message.react('📜'))
		.catch(() => console.error('One of the emojis failed to react.'));
        return;
    },

};