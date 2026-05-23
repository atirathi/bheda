import { Router, Request, Response } from 'express';
import { execSync } from 'child_process';
import fs from 'fs';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const pickle = req.body.pickle;
    if (!pickle) return res.status(400).json({ error: 'pickle data required' });
    fs.writeFileSync('/tmp/pickle_data', pickle);
    const result = execSync(`python3 -c "
import pickle, base64
data = open('/tmp/pickle_data','rb').read()
obj = pickle.loads(data)
print(obj)
"`).toString();
    return res.json({ result: result.trim() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
