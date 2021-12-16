import { Results } from './roles'

export default class Result{

  sheriff: string;
  consigliere: string;
  investigator: string;

  constructor(Results: Results){
    this.investigator = Results.investigator;
    this.sheriff = Results.sheriff;
    this.consigliere = Results.consigliere;
  }

  // ------------------------ Setters and Getters

  getSheriff  = () => this.sheriff
  setSheriff = (a: string) => this.sheriff = a

  getConsigliere = () => this.consigliere
  setConsigliere = (a: string) => this.consigliere = a

  getInvestigator= () => this.investigator
  setInvestigator = (a: string) => this.investigator= a

}
