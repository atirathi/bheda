import { Router, Request, Response } from 'express';
import { execSync } from 'child_process';
import fs from 'fs';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const dotnetData = req.body.data;
    if (!dotnetData) return res.status(400).json({ error: '.NET serialized data required' });
    fs.writeFileSync('/tmp/dotnet_ser.bin', Buffer.from(dotnetData, 'base64'));
    const result = execSync('mono /tools/DeserializeTest.exe /tmp/dotnet_ser.bin 2>/dev/null || echo ".NET deserialization attempted"').toString();
    return res.json({ result: result.trim() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
