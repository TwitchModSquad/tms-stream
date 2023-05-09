const { launch, getStream, } = require("puppeteer-stream");
const { exec } = require("child_process");

const { executablePath } = require("puppeteer");

const config = require("./config.json");

async function test() {
	const browser = await launch({
		executablePath: executablePath(),
        headless: "new",
		ignoreDefaultArgs: [
			'--disable-extensions'
		],
		defaultViewport: {
			width: 1920,
			height: 1080,
		},
	});

	const page = await browser.newPage();
	await page.goto("https://tms.to/overview/stream");
	const stream = await getStream(page, { audio: true, video: true, frameSize: 2500, bitsPerSecond: 4500000 });
	console.log("Recording...");
	// this will pipe the stream to ffmpeg and convert the webm to mp4 format
    const ffmpeg = exec(`ffmpeg -f lavfi -i anullsrc -i - -vcodec libx264 -minrate 4500k -maxrate 4500k -b:v 4500k -b:a 128k -preset ultrafast -pix_fmt yuv420p -s 1920x1080 -acodec aac -strict -2 -f flv rtmp://${config.ingest_server}/app/${config.stream_key}`);
	ffmpeg.stderr.on("data", (chunk) => {
		console.log(chunk.toString());
	});

	stream.pipe(ffmpeg.stdin);
}

test();