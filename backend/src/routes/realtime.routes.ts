import { Router, Request, Response } from 'express';
import { realtimeWebSocketServer } from '../realtime';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: realtimeWebSocketServer.getHealth()
  });
});

export default router;
