// server.js 파일

const express = require('express');
const app = express();
const port = 3000;

// 정적 파일 제공을 위한 디렉토리 설정
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
