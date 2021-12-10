export default class SalemServer{

    portals=[];
    towns=[];    

    //--------------------- Server Functions ----------------------

    pushPortal(guild){
        let checker = this.portals.filter(p=>p === guild.id);
        if(checker.length===0){
            this.portals.push(guild.id);
            return true;
        }else{
            return false;
        }
    }

    pushTown(town){
        return this.towns.push(town);
    }

    fetchTown(town){
        if(this.towns.length===0){
            this.towns.push(town);
        }
        return this.towns[0];
    }

    deletePortal(guild){
        let i = this.portals.findIndex(p => p == guild.id);
        if(i>=0){this.portals.splice(i,1);}
    }

    deleteSalem(id){
        let guilds = this.towns[0].getGuilds();
        
        guilds.forEach(g => {
            this.deletePortal(g);
        });

        let j = this.towns.findIndex(t => t.getId() == id);
        if(j>=0){this.towns.splice(j,1);}
    }

    getTowns(){return this.towns;}
    getPortals(){return this.portals;}
  
}
