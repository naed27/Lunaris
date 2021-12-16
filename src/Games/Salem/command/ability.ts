import Command from './command';
import { SalemRoleCommand } from '../roles';

export default class Ability extends Command{

  act: any;
  performer: any;
  visitsTarget: any;
  validTargets: any;
  defaultTarget: any;
  actionResponse: any;

  constructor( command: SalemRoleCommand ){
    super(command);

    this.act = command.act;
    this.performer = command.performer;
    this.visitsTarget = command.visitsTarget;
    this.validTargets = command.validTargets;
    this.defaultTarget = command.defaultTarget;
    this.actionResponse = command.actionResponse;
  }

  // ------------------------------------- SETTERS AND GETTERS

  Performer = (user,command,town) => this.performer(user,command,town);

  VisitsTarget = (user,town) => this.visitsTarget(user,town)

  AutoTargets = (user,town) => this.defaultTarget(user,town)

  ValidTargets = (user,town) => this.validTargets(user,town)

  ActionResponse = async (user,command,inputs,town) => this.actionResponse(user,command,inputs,town)

  Act = (user,performer,command,targets,town) => this.act(user,performer,command,targets,town)

}
