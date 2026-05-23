import { Router, Request, Response } from 'express';
import { parse } from 'csv-parse/sync';

const router = Router();

router.post('/import', (req: Request, res: Response) => {
  try {
    const csvData = req.body.csv;
    if (!csvData) return res.status(400).json({ error: 'csv data required' });
    const records = parse(csvData, { columns: true, skip_empty_lines: true });
    return res.json({
      imported: records.length,
      records: records.slice(0, 5),
      note: 'CSV injection - formulas in CSV can execute when opened in Excel',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
