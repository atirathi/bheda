import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html><head><title>WebSocket Chat</title></head><body>
<h1>WebSocket Chat</h1>
<div id="messages"></div>
<input id="msg" placeholder="Type a message"><button onclick="send()">Send</button>
<script>
  var ws = new WebSocket('ws://' + location.host + '/ws');
  ws.onmessage = function(e) {
    document.getElementById('messages').innerHTML += '<div>' + e.data + '</div>';
  };
  function send() {
    var input = document.getElementById('msg');
    ws.send(input.value);
    input.value = '';
  }
</script>
</body></html>`;
  res.type('html').send(html);
});

export default router;
