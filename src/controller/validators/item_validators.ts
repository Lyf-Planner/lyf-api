import { body, query } from 'express-validator';

import { ID } from '../../api/schema/database/abstract';
import {
  ItemStatus, ItemType
} from '../../api/schema/database/items';
import { Item } from '../../api/schema/items';
import { daysOfWeek } from '../../utils/dates';
import { isValidTimeZone } from './utils';
import { SocialAction } from '../../api/schema/social';

// GET

export const getItemValidator = [query('item_id').isString()];

export const deleteItemValidator = [query('item_id').isString()];

// POST

export const createItemValidator = [
  // Essentials
  body('id').isString(),
  body('template_id').isString().optional({ nullable: true }),
  body('title').isString(),
  body('type').custom((perm) => Object.values(ItemType).includes(perm)),
  body('status').custom((status) => Object.values(ItemStatus).includes(status)),
  // Item extra details
  body('date').isDate({ format: 'YYYY-MM-DD' }).optional({ nullable: true }),
  body('day')
    .custom((status) => daysOfWeek.includes(status))
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

export type createItemBody = Item;

export const updateItemValidator = [
  // Essentials
  body('id').isString(),
  body('title').isString().optional(),
  body('type')
    .custom((perm) => Object.values(ItemType).includes(perm))
    .optional(),
  body('status')
    .custom((status) => Object.values(ItemStatus).includes(status))
    .optional(),
  // Item extra details
  body('date').isDate({ format: 'YYYY-MM-DD' }).optional({ nullable: true }),
  body('day')
    .custom((status) => daysOfWeek.includes(status))
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

export type updateItemBody = Item;

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
