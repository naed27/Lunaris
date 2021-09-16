module.exports.list = [
    {
        id:"001",
        Name:"Lilliana",
        ItemName:"lilliana",
        FrontName:"Lilliana",
        SendName:"Lilliana",
        c:":",
        tb:"‎\n",
        bb:"",
        sw:"",
        ew:"",
        e:"**",
        Creator:{
                id:"389369186503360512",
                Name:"Gulie"
        },
        get userName() {
                return this.SendName;
        },
        get defName() {
                return this.Name;
        },
        get name(){
                return this.FrontName;
        }

    },
    {
        id:"002",
        Name:"Minenaga",
        ItemName:"minenaga",
        FrontName:"Minenaga",
        SendName:"Minenaga",
        c:":",
        tb:"‎\n",
        bb:"",
        sw:"",
        ew:"",
        e:"**",
        Creator:{
                id:"481672943659909120",
                Name:"Dean"
        },
        get userName() {
                return this.SendName;
        },
        get defName() {
                return this.Name;
        },
        get name(){
                return this.FrontName;
        }
    },
    {
        id:"003",
        Name:"Kuro Hagetaka",
        ItemName:"kuro hagetaka",
        FrontName:"Kuro Hagetaka",
        SendName:"Kuro Hagetaka",
        c:":",
        tb:"‎\n",
        bb:"",
        sw:"",
        ew:"",
        e:"**",
        Creator:{
                id:"730410911864586311",
                Name:"Taka"
        },
        get userName() {
                return this.SendName;
        },
        get defName() {
                return this.Name;
        },
        get name(){
                return this.FrontName;
        }

    },
    {
        id:"004",
        Name:"Dasu",
        ItemName:"dasu",
        FrontName:"Dasu",
        SendName:"Dasu",
        c:":",
        tb:"‎\n",
        bb:"",
        sw:"",
        ew:"",
        e:"**",
        Creator:{
                id:"658567080618229761",
                Name:"Dasu"
        },
        get userName() {
                return this.SendName;
        },
        get defName() {
                return this.Name;
        },
        get name(){
                return this.FrontName;
        }

    },
    {
        id:"005",
        Name:"Falael Windlock",
        ItemName:"falael windlock",
        FrontName:"Falael Windlock",
        SendName:"Falael Windlock",
        c:":",
        tb:"‎\n",
        bb:"",
        sw:"",
        ew:"",
        e:"**",
        Creator:{
                id:"319450985133113344",
                Name:"Mizu"
        },
        get userName() {
                return this.SendName;
        },
        get defName() {
                return this.Name;
        },
        get name(){
                return this.FrontName;
        }

    },
    {
        id:"006",
        Name:"Nana Hachi Kyuju",
        ItemName:"nana hachi kyuju",
        FrontName:"Nana Hachi Kyuju",
        SendName:"Nana Hachi Kyuju",
        c:":",
        tb:"‎\n",
        bb:"",
        sw:"",
        ew:"",
        e:"**",
        Creator:{
                id:"515504121894273045",
                Name:"Stie"
        },
        get userName() {
                return this.SendName;
        },
        get defName() {
                return this.Name;
        },
        get name(){
                return this.FrontName;
        }

    },
    {
        id:"007",
        Name:"Ayumu",
        ItemName:"ayumu",
        SendName:"Ayumu",
        c:":",
        tb:"‎\n",
        bb:"",
        sw:"",
        ew:"",
        e:"**",
        Creator:{
                id:"658567080618229761",
                Name:"Dasu"
        },
        get userName() {
                return this.SendName;
        },
        get defName() {
                return this.Name;
        },
        get name(){
                return this.FrontName;
        }

    },
    {
        id:"008",
        Name:"Katerina Iskusheniye",
        ItemName:"katerina iskusheniye",
        FrontName:"Katerina Iskusheniye",
        SendName:"Katerina Iskusheniye",
        c:":",
        tb:"‎\n",
        bb:"",
        sw:"",
        ew:"",
        e:"**",
        Creator:{
                id:"319450985133113344",
                Name:"Mizu"
        },
        get userName() {
                return this.SendName;
        },
        get defName() {
                return this.Name;
        },
        get name(){
                return this.FrontName;
        }

    },
    {
        id:"009",
        Name:"Mont Blanc",
        FrontName:"Mont Blanc",
        ItemName:"mont blanc",
        SendName:"Mont Blanc",
        c:":",
        tb:"‎\n",
        bb:"",
        sw:"",
        ew:"",
        e:"**",
        Creator:{
                id:"481672943659909120",
                Name:"Dean"
        },
        get userName() {
                return this.SendName;
        },
        get defName() {
                return this.Name;
        },
        get name(){
                return this.FrontName;
        }
    },

    {
        id:"901",
        Name:"Narrator",
        FrontName:"Narrator",
        SendName:"",
        c:"",
        tb:"‎\n",                        //top barrier
        bb:"",                          //bottom barrier
        sw:"\`\`\`json\n",              //start wrap
        ew:"\`\`\`",                    //end wrap
        e:"",                           //emphasis
        Creator:{
                id:"481672943659909120",
                Name:"Dean"
        },
        get userName() {
                return this.SendName;
        },
        get defName() {
                return this.Name;
        },
        get name(){
                return this.FrontName;
        }
    },

    {
        id:"902",
        Name:"NPC",
        FrontName:"Stranger",
        SendName:"Stranger",
        c:":",
        tb:"‎\n",
        bb:"",
        sw:"",
        ew:"",
        e:"**",
        Creator:{
                id:"481672943659909120",
                Name:"Dean"
        },
        /**
         * @param {string} a
         */
        set newName(a) {
                this.SendName=a;
                this.FrontName=a;
        },
        get userName() {
                return this.SendName;
        },
        get defName() {
                return this.Name;
        },
        get name(){
                return this.FrontName;
        }
    },

    {
        id:"801",
        Name:"Person A",
        ItemName:"person a",
        SendName:"Person A",
        c:":",
        tb:"‎\n",
        bb:"",
        sw:"",
        ew:"",
        e:"**",
        Creator:{
                id:"481672943659909120",
                Name:"Dean"
        },
        get userName() {
                return this.SendName;
        },
        get defName() {
                return this.Name;
        }
    },

    {
        id:"802",
        Name:"Person B",
        ItemName:"person b",
        SendName:"Person B",
        c:":",
        tb:"‎\n",
        bb:"",
        sw:"",
        ew:"",
        e:"**",
        Creator:{
                id:"481672943659909120",
                Name:"Dean"
        },
        get userName() {
                return this.SendName;
        },
        get defName() {
                return this.Name;
        }
    },
 
   
        
];