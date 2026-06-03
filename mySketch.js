let sound;
let niceS;
let vniceS;

let lanes = 3;
let laneHeight;
let notes = [];
let noteSpeed = 3;
let noteSize = 100;
let boardSize = 100;
let colors = [];
let score = 0;

let lastNoteTime = [];
let noteInterval = 1500;
let isMousePressedOnEllipse = [false, false, false];
let mousePressStartTimes = [0, 0, 0];
let requiredPressDuration = 800;

let gameDuration;
let startTime;
let gameOver = false;

function preload() { 
	sound = loadSound('click_effect-86995.mp3');
	niceS = loadSound('sword-drawing-2-94330.mp3');
	vniceS = loadSound('oi-85782.mp3');
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	laneHeight = height / lanes; //各laneの高さは200ピクセル(600/3)

	for (let i = 0; i < lanes; i++) {
		colors.push(color(random(255), random(255), random(255)));
		lastNoteTime.push(0);
	}

	startTime = millis(); //timer 経過時間

	let gameCase = floor(random(1, 4)); //整数に近い数字に切り捨てる・切り上げる
	if (gameCase === 1) {
		gameDuration = 60000; // 1分
	} else if (gameCase === 2) {
		gameDuration = 90000; // 1.5分
	} else if (gameCase === 3) {
		gameDuration = 120000; // 2分
	}
}

function draw() {
	background(0);

	let currentTime = millis(); //経過時間の更新
	if (currentTime - startTime >= gameDuration) {
		gameOver = true;
	}

	if (gameOver) {
		fill(255);
		textSize(60);
		textAlign(CENTER, CENTER);
		text("Game Over!", width / 2, height / 2);
		textSize(40);
		text(`Final Score: ${score}`, width / 2, height / 2 + 50); //literal syntax テンプレート -> 'score'という変数の補間
		return; //draw停止
	}

	//lane lines
	stroke(150);
	strokeWeight(3);
	for (let i = 0; i <= lanes; i++) {
		let y = i * laneHeight;
		line(0, y + laneHeight / 2, width, y + laneHeight / 2);
	}

	//board ellipse
	for (let i = 0; i < lanes; i++) {
		let y = i * laneHeight;
		if (isMousePressedOnEllipse[i]) {
			stroke(0, 255, 255); //クリックされた時のstrokeがシアン色になる
		} else {
			noStroke();
		}
		fill(200);
		ellipse(width - 100, y + laneHeight / 2, boardSize);
	}

	//texts
	noStroke();
	fill(255);
	textSize(25);
	textAlign(LEFT, TOP);
	//score
	text(`Score: ${score}`, 10, 10);
	//time
	let remainingTime = max(0, gameDuration - (currentTime - startTime)); //経過時間 -> 残り時間 -> max(0,) マイナスになったら0
	let remainingSeconds = ceil(remainingTime / 1000); //ms to s -> 最も近い整数に切り上げる
	text(`Time: ${remainingSeconds}`, 10, 50);

	if (random(1) < 0.02) { //新しいnotesが表れる頻度の制御 -> random number < (2% chance) = notesが表れる
		let maxAttempts = 3; //同時に表れるnotes
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			let laneIndex = floor(random(lanes)); //新しいnotesのlaneの1つをランダムに選択
			if (currentTime - lastNoteTime[laneIndex] < noteInterval) { //各lanesの間隔の制御
				continue; } 
			let yPos = laneIndex * laneHeight + laneHeight / 2; //lanesに基づいたnotesの垂直位置
			let isSpecial = random(1) < 0.13; //(13% chance)
			let length = 50;
			let newNote = {
				x: -length,
				y: yPos,
				speed: noteSpeed,
				lane: laneIndex,
				size: noteSize,
				length: length,
				color: isSpecial ? color(255, 215, 0) : colors[laneIndex], //ternary operator syntax -> condition ? expressionIfTrue : expressionIfFalse;
				isSpecial: isSpecial //specialか否か
			};
			
			//ensures no overlapping notes
			let overlapping = false;
			for (let note of notes) {
				if (note.lane === newNote.lane &&
					abs(note.x - newNote.x) < newNote.length + note.length) {
					overlapping = true;
					break;
				}
			}
			if (!overlapping) {
				notes.push(newNote);
				lastNoteTime[laneIndex] = currentTime;
				break;
			}
		}
	}

	//draw notes
	for (let i = notes.length - 1; i >= 0; i--) {
		let note = notes[i];
		note.x += note.speed;

		fill(note.color);
		noStroke();
		if (note.isSpecial) {
			rectMode(CENTER);
			rect(note.x, note.y, note.length * 5, note.size);
		} else {
			circle(note.x, note.y, note.size);
		}

	//remove notes
		if (note.x > width + note.length / 2) {
			notes.splice(i, 1);
		}
	}

	//special notes
	for (let i = 0; i < lanes; i++) {
		if (isMousePressedOnEllipse[i] && millis() - mousePressStartTimes[i] >= requiredPressDuration) { //マウスクリックと800ms押されているかどうかのチェック
			for (let j = notes.length - 1; j >= 0; j--) { //reverse 配列をループしながら要素を削除するのに便利
				let note = notes[j];
				let y = i * laneHeight + laneHeight / 2;
				if (note.lane == i && note.isSpecial && dist(note.x, note.y, width - 100, y) < boardSize / 2 + note.size / 2) { //同じlane, special, overlapのチェック (board ellipse が対象) -> scoring
					score += 5;
					vniceS.play();
					notes.splice(j, 1);
					break; //ループを破る
				}
			}
		}
	}
}

function mousePressed() {
	for (let i = 0; i < lanes; i++) {
		let y = i * laneHeight + laneHeight / 2;
		let d = dist(mouseX, mouseY, width - 100, y); //calculates the Euclidean distance between two points (x1,y1) and (x2,y2)
		if (d < boardSize / 2) { //board ellipseがクリックされているか否か
			isMousePressedOnEllipse[i] = true;
			mousePressStartTimes[i] = millis(); //クリック時間のカウントダウンが始まる
			if (!sound.isPlaying()) { //音が流れていない場合
				sound.play();
			}
			for (let j = notes.length - 1; j >= 0; j--) {
				let note = notes[j];
				if (note.lane == i && !note.isSpecial && dist(note.x, note.y, width - 100, y) < boardSize / 2 + note.size / 2) {
					score += 1;
					niceS.play();
					notes.splice(j, 1);
					break;
				}
			}
		}
	}
}

function mouseReleased() {
	for (let i = 0; i < lanes; i++) {
		isMousePressedOnEllipse[i] = false;
	}
}