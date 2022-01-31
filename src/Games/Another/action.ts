import Command from './command';
import Player from './player';

interface ConstructorParams{
  user: Player;
  args: string[];
  performer: Player;
  targets: Player[];
  command: Command,
}

export default class Action{

  user: Player;
  args: string[];
  status: string;
  performer: Player;
  targets: Player[];
  command: Command;

  constructor({user,performer,command,targets,args}:ConstructorParams){
    this.user = user;
    this.command = command;
    this.targets = targets;
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

  getTargets = () => this.targets;
  setTargets = (a:Player[]) => this.targets = a;

  getPerformer = () => this.performer;
  setPerformer = (a:Player) => this.performer = a;

  getCommand = () => this.command;
  setCommand = (a:Command) => this.command = a;

  getFirstTarget = () => this.targets[0];
  setFirstTarget = (a:Player) => this.targets[0] = a;

  getSecondTarget = () => this.targets.length==2 && this.targets[1];
  setSecondTarget = (a:Player) => this.targets.length==2 && (this.targets[1] = a);

  isSelfTarget = () => this.performer.getId() === this.getFirstTarget().getId();

}
