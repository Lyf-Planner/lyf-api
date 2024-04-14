import { body, query } from 'express-validator';

import { ID } from '../../api/mongo_schema/abstract';
import {
  ItemStatus,
  ListItem,
  ListItemTypes
} from '../../api/mongo_schema/list';
import { Permission, SocialAction } from '../../api/mongo_schema/social';
import { DaysOfWeek } from '../../api/mongo_schema/timetable';
import { isValidTimeZone } from './utils';

// GET

export const getItemValidator = [query('item_id').isString()];

export const deleteItemValidator = [query('item_id').isString()];

// POST

export const createItemValidator = [
  // Essentials
  body('id').isString(),
  body('template_id').isString().optional({ nullable: true }),
  body('title').isString(),
  body('type').custom((perm) => Object.values(ListItemTypes).includes(perm)),
  body('status').custom((status) => Object.values(ItemStatus).includes(status)),
  // Item extra details
  body('date').isDate({ format: 'YYYY-MM-DD' }).optional({ nullable: true }),
  body('day')
    .custom((status) => Object.values(DaysOfWeek).includes(status))
    .optional({ nullable: true }),
  body('time').isTime({ hourFormat: 'hour24' }).optional({ nullable: true }),
  body('end_time')
    .isTime({ hourFormat: 'hour24' })
    .optional({ nullable: true }),
  body('tz')
    .custom((tz) => tz && isValidTimeZone(tz))
    .optional({ nullable: true }),
  body('desc').isString().optional({ nullable: true }),
  body('url').isString().optional({ nullable: true }),
  body('location').isString().optional({ nullable: true }),
  body('show_in_upcoming').isBoolean().optional({ nullable: true }),
  body('notification_mins_before').isString().optional({ nullable: true })
];

export type createItemBody = ListItem;

export const updateItemValidator = [
  // Essentials
  body('id').isString(),
  body('title').isString().optional(),
  body('type')
    .custom((perm) => Object.values(ListItemTypes).includes(perm))
    .optional(),
  body('status')
    .custom((status) => Object.values(ItemStatus).includes(status))
    .optional(),
  // Item extra details
  body('date').isDate({ format: 'YYYY-MM-DD' }).optional({ nullable: true }),
  body('day')
    .custom((status) => Object.values(DaysOfWeek).includes(status))
    .optional({ nullable: true }),
  body('time').isTime({ hourFormat: 'hour24' }).optional({ nullable: true }),
  body('end_time')
    .isTime({ hourFormat: 'hour24' })
    .optional({ nullable: true }),
  body('tz')
    .custom((tz) => tz && isValidTimeZone(tz))
    .optional({ nullable: true }),
  body('desc').isString().optional({ nullable: true }),
  body('url').isString().optional({ nullable: true }),
  body('location').isString().optional({ nullable: true }),
  body('show_in_upcoming').isBoolean().optional({ nullable: true }),
  body('notification_mins_before').isString().optional({ nullable: true })
];

export type updateItemBody = ListItem;

export const getItemsValidator = [
  body('item_ids').isArray(),
  body('item_ids.*').isString()
];

export type getItemsBody = { item_ids: ID[] };

export const updateItemSocialValidator = [
  body('item_id').isString(),
  body('user_id').isString(),
  body('action').custom((action) =>
    Object.values(SocialAction).includes(action)
  )
];

export type updateItemSocialBody = {
  item_id: string;
  user_id: string;
  action: SocialAction;
};
