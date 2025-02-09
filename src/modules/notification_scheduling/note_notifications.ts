import { ExpoPushMessage } from 'expo-server-sdk';

import { Logger } from '../../utils/logging';
import { ExpoPushService } from './expo_push_service';
import { NotificationRelatedData, NotificationType } from '../../../schema/database/notifications';
import { NoteUserRelation } from '../../models/relation/note_related_user';
import { NoteEntity } from '../../models/entity/note_entity';

export class SocialNoteNotifications {
  static async newNoteInvite(fromRelation: NoteUserRelation, toRelation: NoteUserRelation) {
    const fromUser = fromRelation.getRelatedEntity();
    const toUser = toRelation.getRelatedEntity();
    const note = new NoteEntity(fromRelation.id());
    await note.load();

    logger.info(`Notifying user ${toUser.id()} of invite to note ${note.id()}`);

    // Format the message
    const message: ExpoPushMessage = {
      to: toUser.getSensitive(toUser.id()).expo_tokens,
      title: `${note.title()}`,
      body: `${fromUser.name()} invited you to ${note.title()}`,
      sound: { critical: true, volume: 1, name: 'default' }
    };

    // Send
    await new ExpoPushService().pushNotificationToExpo({
      messages: [message],
      type: NotificationType.NoteSocial,
      to_id: toUser.id(),
      from_id: fromUser.id(),
      related_data: NotificationRelatedData.Note,
      related_id: note.id()
    });    
  }

  static async newNoteUser(fromRelation: NoteUserRelation, _toRelation: NoteUserRelation) {
    const fromUser = fromRelation.getRelatedEntity();
    const note = new NoteEntity(fromRelation.id());
    await note.load();

    logger.info(`Notifying users on note ${note.title()} of new user ${fromUser.id()}`);

    const users = await note.getUsers();

    users.forEach(async (user) => {
      if (user.id() === fromUser.id()) {
        return;
      }

      const message: ExpoPushMessage = {
        to: user.getSensitive(user.id()).expo_tokens,
        title: 'User Joined your Note',
        body: `${fromUser.name()} joined ${note.title()}`
      };

      await new ExpoPushService().pushNotificationToExpo({
        messages: [message],
        type: NotificationType.NoteSocial,
        to_id: user.id(),
        from_id: fromUser.id(),
        related_data: NotificationRelatedData.Note,
        related_id: note.id()
      });
    })
  }
}

const logger = Logger.of(SocialNoteNotifications);
