import { Router, Request, Response } from 'express';

const router = Router();

router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
});

router.post('/test', (req: Request, res: Response) => {
  res.json({ 
    message: 'Test POST endpoint working', 
    body: req.body,
    timestamp: new Date().toISOString() 
  });
});

export { router as testRoutes };
