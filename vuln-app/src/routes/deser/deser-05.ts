import { Router, Request, Response } from 'express';
import { execSync } from 'child_process';
import fs from 'fs';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const phpData = req.body.data;
    if (!phpData) return res.status(400).json({ error: 'php serialized data required' });
    fs.writeFileSync('/tmp/php_ser.txt', phpData);
    const result = execSync(`php -r "
\\$data = file_get_contents('/tmp/php_ser.txt');
\\$obj = unserialize(\\$data);
print_r(\\$obj);
"`).toString();
    return res.json({ result: result.trim() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
