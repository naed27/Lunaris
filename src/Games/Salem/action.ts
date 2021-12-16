import Ability from './command/ability';
import GlobalAbility from './command/global';
import Player from './player';

interface ConstructorParams{
  user: Player;
  performer: Player;
  targets: Player[];
  command: Ability | GlobalAbility;
}

export default class Action{

  user: Player;
  status: string;
  performer: Player;
  targets: Player[];
  command: Ability | GlobalAbility;

  constructor({user,performer,command,targets}:ConstructorParams){
    this.user = user;
    this.command = command;
    this.targets = targets;
    this.status = "Pending";
    this.performer = performer;
  }

  // ------------------------------------- SETTERS AND GETTERS

  getUser = () => this.user;
  setUser = (a:Player) => this.user = a;

  getStatus = () => this.status;
  setStatus = (a:string) => this.status = a;

  getTargets = () => this.targets;
  setTargets = (a:Player[]) => this.targets = a;

  getPerformer = () => this.performer;
  setPerformer = (a:Player) => this.performer = a;

  getFirstTarget = () => this.targets[0];
  setFirstTarget = (a:Player) => this.targets[0] = a;

  getSecondTarget = () => this.targets.length==2 && this.targets[1];
  setSecondTarget = (a:Player) => this.targets.length==2 && (this.targets[1] = a);

  getCommand = () => this.command;
  setCommand = (a:Ability | GlobalAbility) => this.command = a;

}
