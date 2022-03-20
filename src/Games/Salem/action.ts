import AnotherCommand from './command';
import Player from './player';

interface ConstructorParams{
  user: Player;
  args: string[];
  performer: Player;
  firstTarget: Player | 'None';
  secondTarget: Player | 'None';
  command: AnotherCommand,
}

export default class Action{

  user: Player;
  args: string[];
  status: string;
  performer: Player;
  firstTarget: Player | 'None';
  secondTarget: Player | 'None';
  command: AnotherCommand;

  constructor({user,performer,command,firstTarget,secondTarget,args}:ConstructorParams){
    this.user = user;
    this.command = command;
    this.firstTarget = firstTarget;
    this.secondTarget = secondTarget;
    this.status = 'Pending';
    this.performer = performer;
    this.args = args
  }

  // ------------------------------------- SETTERS AND GETTERS

  getUser = () => this.user;
  setUser = (a:Player) => this.user = a;

  getArgs = () => this.args;
  setArgs = (a: string[]) => this.args = a 

  getStatus = () => this.status;
  setStatus = (a:string) => this.status = a;

  getTargets = () => [ this.firstTarget, this.secondTarget];

  getPerformer = () => this.performer;
  setPerformer = (a:Player) => this.performer = a;

  getCommand = () => this.command;
  setCommand = (a:AnotherCommand) => this.command = a;

  getFirstTarget = () => this.firstTarget;
  setFirstTarget = (a:Player | 'None') => this.firstTarget = a;

  getSecondTarget = () => this.secondTarget;
  setSecondTarget = (a:Player | 'None') =>this.secondTarget= a

  isSelfTarget = () => {
    if(this.firstTarget === 'None') return false
    this.performer.getId() === this.firstTarget.getId()
  }

}
