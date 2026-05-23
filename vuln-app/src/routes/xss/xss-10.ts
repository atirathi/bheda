import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const name = req.query.name as string || 'World';
  const html = `<!DOCTYPE html>
<html ng-app>
<head><title>Angular Template</title>
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.6.9/angular.min.js"></script>
</head><body>
<h1>Hello {{$eval.constructor('${name}')()}}</h1>
</body></html>`;
  res.type('html').send(html);
});

export default router;
