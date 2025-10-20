// -----------------------------------------------------------
// 自定義函數：繪製星星 (五角星)，頂角向上
// 參數: x, y (中心座標), radius1 (內半徑), radius2 (外半徑), npoints (角數)
// -----------------------------------------------------------
function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  // 將起始角度調整為 -HALF_PI (即 -90 度)，使星星的頂角向上
  beginShape();
  for (let a = -HALF_PI; a < TWO_PI - HALF_PI; a += angle) { // 調整起始角度
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// -----------------------------------------------------------
// 定義粒子物件 (用於爆破效果)
// -----------------------------------------------------------
class Particle {
    constructor(x, y, baseColor) {
        this.x = x;
        this.y = y;
        this.life = 255; // 粒子的生命值 (同時作為透明度 Alpha)
        this.r = random(2, 5); // 初始大小
        this.color = baseColor;

        // 隨機速度和方向，讓粒子向外擴散
        let angle = random(TWO_PI);
        let speed = random(1, 4);
        this.vx = cos(angle) * speed;
        this.vy = sin(angle) * speed;
    }

    // 更新粒子狀態 (移動和衰減)
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // 模擬輕微的重力或阻力，使效果更自然
        this.vy += 0.05; 
        this.vx *= 0.98; // 輕微減速

        this.life -= 8; // 快速褪色
        this.color.setAlpha(max(0, this.life));
    }

    // 繪製粒子
    show() {
        noStroke();
        fill(this.color);
        ellipse(this.x, this.y, this.r * 2);
    }

    // 檢查粒子是否已消失
    isDead() {
        return this.life <= 0;
    }
}


// 定義圓的物件 (氣泡)
class Bubble {
  constructor(x, y, r, color, alpha, speed) {
    this.x = x; // 圓心 X 座標
    this.y = y; // 圓心 Y 座標
    this.r = r; // 半徑
    this.color = color; // 顏色
    this.alpha = alpha; // 透明度 (0-255)
    this.speed = speed; // 往上飄的速度
    this.isAlive = true; // 氣泡的狀態
  }

  // ---------------------- 爆破與重置 ----------------------

  // 檢查滑鼠點擊是否落在氣泡內
  checkClick(px, py) {
      // 使用 p5.js 的 dist() 函數計算滑鼠位置與氣泡中心點的距離
      let d = dist(px, py, this.x, this.y);
      return d < this.r; // 如果距離小於半徑，則點擊成功
  }

  // 生成爆破效果的粒子並處理得分
  burst() {
    // 檢查是否已被點擊
    if (!this.isAlive) return;

    // 1. 處理得分
    let scoreChange = 0;
    switch (this.color) {
        case "#ff99c8": // 粉紅色/目標色
            scoreChange = 10;
            break;
        case "#a9def9": // 藍色/陷阱色
            scoreChange = -10;
            break;
        default: // 其他顏色
            scoreChange = 2;
            break;
    }
    score += scoreChange;
    displayScoreChange(scoreChange, this.x, this.y); // 顯示分數變化動畫

    // 2. 生成 15 個粒子
    for (let i = 0; i < 15; i++) {
      let particleColor = color(this.color);
      particleColor.setAlpha(this.alpha); // 使用氣泡的顏色和透明度
      particles.push(new Particle(this.x, this.y, particleColor));
    }

    // 3. 播放音效（請注意：此環境無法載入外部檔案，此處會產生錯誤）
    if (popSound && popSound.isLoaded()) {
      popSound.play();
    }

    this.isAlive = false; // 標記氣泡已爆破
    // 立即重置，讓氣泡在畫布底部重生
    this.reset(); 
  }
  
  // 重置氣泡位置和屬性
  reset() {
      // 保持半徑和顏色不變
      this.y = height + this.r; // 設置在畫布底部以外
      this.x = random(width);   // 重新隨機 X 座標
      this.speed = random(0.5, 3); // 重新隨機速度
      this.isAlive = true; // 復活
  }

  // 移動圓
  move() {
    if (!this.isAlive) return; 

    this.y -= this.speed; // 向上移動

    // 【移除隨機爆破判定】

    // 如果圓飄出畫布頂部，則重置 (未點擊且飄走，不加分也不扣分)
    if (this.y < -this.r) {
      this.reset();
    }
  }

  // ---------------------- 繪製圓及其裝飾 ----------------------
  show() {
    if (!this.isAlive) return; // 如果已爆破，則不繪製

    // ... 繪製圓、方形、星星邏輯保持不變 ...

    // ---------------------- 繪製圓 ----------------------
    let c = color(this.color);
    c.setAlpha(this.alpha); 
    fill(c);
    noStroke(); 
    ellipse(this.x, this.y, this.r * 2); 

    // ---------------------- 通用位置計算 ----------------------
    let targetOffset = this.r * (1 / sqrt(2)) / 2; 

    // ---------------------- 繪製右上方白色透明方形 ----------------------
    fill(255, 255, 255, 120); 
    noStroke();
    rectMode(CENTER); 

    let desiredSquareSize = (this.r * 2) / 6; 
    let squareCenterX = this.x + targetOffset;
    let squareCenterY = this.y - targetOffset;

    let distFromCenter = dist(squareCenterX, squareCenterY, this.x, this.y);
    let maxSquareSizeAllowed = (this.r - distFromCenter) * 2 / sqrt(2); 
    let finalSquareSize = min(desiredSquareSize, maxSquareSizeAllowed);
    if (finalSquareSize < 0) finalSquareSize = 0;

    rect(squareCenterX, squareCenterY, finalSquareSize, finalSquareSize);
    rectMode(CORNER); 
    
    // ---------------------- 繪製左上方白色星星 ----------------------
    let desiredStarRadius = (this.r * 2) / 12; 
    let starCenterX = this.x - targetOffset;
    let starCenterY = this.y - targetOffset;

    let starDistFromCenter = dist(starCenterX, starCenterY, this.x, this.y);
    let maxStarRadiusAllowed = this.r - starDistFromCenter;
    
    let finalStarRadius = min(desiredStarRadius, maxStarRadiusAllowed);
    if (finalStarRadius < 0) finalStarRadius = 0;

    fill(255, 255, 255); 
    noStroke();
    
    let innerRadius = finalStarRadius * 0.4; 
    
    drawStar(starCenterX, starCenterY, innerRadius, finalStarRadius, 5);
  }
}

// -----------------------------------------------------------
// 新增：分數顯示動畫物件
// -----------------------------------------------------------
class ScoreDisplay {
    constructor(scoreChange, x, y) {
        this.scoreChange = scoreChange;
        this.x = x;
        this.y = y;
        this.life = 100; // 顯示時間
        this.color = scoreChange > 0 ? color(0, 150, 0) : color(255, 0, 0); // 綠色加分，紅色減分
    }

    update() {
        this.y -= 1; // 向上漂浮
        this.life -= 2; // 漸漸消失
    }

    show() {
        if (this.life <= 0) return;

        let alpha = map(this.life, 0, 100, 0, 255);
        this.color.setAlpha(alpha);

        fill(this.color);
        textAlign(CENTER, CENTER);
        textSize(24);
        text((this.scoreChange > 0 ? "+" : "") + this.scoreChange, this.x, this.y);
    }
}

// -----------------------------------------------------------
// 遊戲全域變數
// -----------------------------------------------------------
let bubbles = []; 
let particles = []; 
let scoreDisplays = []; // 新增：分數變化動畫陣列
let score = 0; // 遊戲分數
const NUM_CIRCLES = 100; 
// 提供的顏色
const COLORS = ["#ff99c8", "#d0f4de", "#a9def9", "#e4c1f9"]; 

// 爆破音效變數 (p5.sound 相關，可能無法在此環境中運作)
let popSound;

function preload() {
  // 把 pop.mp3 放在此目錄 (c:\Users\L110\Downloads\20251013\20251013\pop.mp3)
  // 並確保 index.html 已引入 p5.sound.js
  try {
    popSound = loadSound('pop.mp3');
  } catch (e) {
    console.warn('pop.mp3 載入失敗，請確認檔案與 p5.sound.js 已正確加入：', e);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  for (let i = 0; i < NUM_CIRCLES; i++) {
    let r = random(25, 75); 
    let x = random(width);
    let y = random(height);
    let colorIndex = floor(random(COLORS.length));
    let col = COLORS[colorIndex];
    let alpha = random(50, 200); 
    let speed = random(0.5, 3); 
    
    bubbles.push(new Bubble(x, y, r, col, alpha, speed));
  }
}

// -----------------------------------------------------------
// 核心遊戲邏輯：滑鼠點擊
// -----------------------------------------------------------
function mousePressed() {
    // 檢查每個氣泡是否被點擊
    for (let i = bubbles.length - 1; i >= 0; i--) {
        if (bubbles[i].isAlive && bubbles[i].checkClick(mouseX, mouseY)) {
            bubbles[i].burst();
            // 一次只允許點擊一個氣泡，爆破後即可跳出循環
            break; 
        }
    }
}

// -----------------------------------------------------------
// 顯示分數變化動畫的輔助函數
// -----------------------------------------------------------
function displayScoreChange(change, x, y) {
    scoreDisplays.push(new ScoreDisplay(change, x, y));
}


function draw() {
  background('#fcf6bd');

  // 1. 處理氣泡的移動、繪製和重置
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].move();
    bubbles[i].show();
    
    // 氣泡現在在 burst() 內部被 reset()，這裡只處理粒子
  }

  // 2. 處理粒子的更新和繪製
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }
  
  // 3. 處理分數變化動畫的更新和繪製
  for (let i = scoreDisplays.length - 1; i >= 0; i--) {
      scoreDisplays[i].update();
      scoreDisplays[i].show();
      if (scoreDisplays[i].life <= 0) {
          scoreDisplays.splice(i, 1);
      }
  }

  // 4. 顯示遊戲資訊 (分數與指示)
  displayGameInfo();
}

function displayGameInfo() {
    let padding = 20;

    // 顯示分數（字體放大）
    fill(50);
    textAlign(LEFT, TOP);
    textSize(56); // 調大分數字型
    text(`分數: ${score}`, padding, padding);
    
    // 顯示遊戲說明（字體放大）
    textSize(22); // 調大說明字型
    textAlign(RIGHT, TOP);
    text('點擊氣泡爆破並得分！', width - padding, padding);
    
    textSize(18); // 調大圖例字型
    textAlign(RIGHT, TOP);
    textStyle(BOLD);
    text('粉紅色 (+10) | 藍色 (-10) | 其他 (+2)', width - padding, padding + 40);
    textStyle(NORMAL);
    
    // 顯示學號
    textSize(24); // 調整學號字型大小
    textAlign(LEFT, BOTTOM);
    text('學號: 414736529', padding, height - padding); // 在畫面底部顯示學號
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
