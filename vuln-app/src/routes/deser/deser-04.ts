import { Router, Request, Response } from 'express';
import { execSync } from 'child_process';
import fs from 'fs';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const javaData = req.body.data;
    if (!javaData) return res.status(400).json({ error: 'serialized java data required' });
    fs.writeFileSync('/tmp/java_ser.bin', Buffer.from(javaData, 'base64'));
    const result = execSync('java -jar /tools/DeserializeTester.jar /tmp/java_ser.bin 2>/dev/null || echo "Java deserialization attempted"').toString();
    return res.json({ result: result.trim() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
