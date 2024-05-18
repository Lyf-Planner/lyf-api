import { NoteDbObject } from '../../api/schema/database/notes';
import { ID } from '../../api/schema/database/abstract';
import { NoteEntity } from '../../models/v3/entity/note_entity';
import { Logger } from '../../utils/logging';
import { EntityService } from './_entity_service';
import { Note } from '../../api/schema/notes';

export class NoteService extends EntityService<NoteDbObject> {
  protected logger = Logger.of(NoteService);

  constructor() {
    super();
  }

  // Builder method
  public async retrieveForUser(note_id: ID, requestor_id: ID, include: string): Promise<Note> {
    const note = new NoteEntity(note_id);
    await note.fetchRelations(include);
    await note.load();
    
    const retrieved = await note.export(requestor_id) as Note;
    return retrieved
  }

  async processCreation(note_input: NoteDbObject, from: ID): Promise<Note> {
    const creationDate = new Date();

    const userCreationData: UserDbObject = {
      created: creationDate,
      last_updated: creationDate,
      id: user_id,
      pass_hash: await AuthService.hashPass(password),
      private: false,
      tz: tz,
      expo_tokens: [],
      first_day: formatDateData(creationDate),
      display_name: undefined,
      pfp_url: undefined,
      daily_notifications: false,
      daily_notification_time: '08:00',
      persistent_daily_notification: false,
      event_notifications_enabled: true,
      event_notification_minutes_before: 5
    };

    const user = new UserEntity(userCreationData.id);
    await user.create(userCreationData);

    await new ItemService().createUserIntroItem(user, tz);

    await user.fetchRelations();
    await user.load();

    const token = await AuthService.authenticate(user, password) as string;
    const exported = await user.export(user_id) as ExposedUser;

    return {
      token,
      user: exported
    }
  }

  async processUpdate(id: ID, changes: Partial<User>, from: ID) {
    if (id !== from) {
      throw new LyfError(`User ${from} cannot update another user ${id}`, 403);
    }

    const user = new UserEntity(id);
    await user.load();
    await user.update(changes);

    // PRE-COMMIT (update other items like notifications)
    this.checkDailyNotifications(user, changes);
    this.checkTimezoneChange(user, changes);

    this.logger.debug(`User ${id} safely updated their own data`);

    await user.save();
    return user.export();
  }
}
