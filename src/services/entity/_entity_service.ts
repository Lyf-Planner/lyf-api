import { BaseService } from '../_base_service';

export abstract class EntityService extends BaseService {
  public abstract processCreation(...args: unknown[]): Promise<unknown>;
  public abstract processDeletion(...args: unknown[]): Promise<unknown>;
  public abstract processUpdate(...args: unknown[]): Promise<unknown>;
}
