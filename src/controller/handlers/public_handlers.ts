import { Request, Response } from 'express';

import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { NoticeService } from '../../services/entity/notice_service';

export class PublicHandlers {
  protected async getNotices(req: Request, res: Response) {
    const { version, exclude } = req.query as { version: string, exclude: string };
    const noticeService = new NoticeService();

    try {
      const excludeList = exclude.split(',');
      const notices = await noticeService.getNotices(version, excludeList);

      res.status(200).json(notices).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }
}

const logger = Logger.of(PublicHandlers);
