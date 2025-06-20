import * as fs from "fs";
import * as zlib from "zlib";
import * as readline from "readline";

function createReadLine(path: string) {
  const stream = fs.createReadStream(path);
  const gunzip = zlib.createGunzip();
  return {
    read: readline.createInterface({ input: stream.pipe(gunzip) }),
    stream,
  };
}

export const readChunked = ({
  path,
  chunkSize,
  callback,
  limit = Infinity,
}: {
  path: string;
  chunkSize: number;
  callback: (lines: string[]) => Promise<void>;
  limit?: number;
}): Promise<void> =>
  new Promise((resolve, reject) => {
    let buffer: string[] = [];
    let count = 0;
    let finished = false;
    let processing = false;

    const { read, stream } = createReadLine(path);

    const processBuffer = async (lines: string[]) => {
      if (processing || lines.length === 0) return;
      processing = true;
      try {
        await callback(lines);
      } catch (err) {
        read.close();
        stream.close();
        return reject(err);
      }
      processing = false;
      if (finished) {
        stream.close();
        return resolve();
      }
    };

    read.on("line", async (line) => {
      if (count >= limit) {
        finished = true;
        read.close();
        return;
      }

      buffer.push(line);
      count++;

      if (buffer.length >= chunkSize) {
        const oldBuffer = buffer;
        buffer = [];
        read.pause();
        await processBuffer(oldBuffer);
        read.resume();
      }
    });

    read.on("close", async () => {
      finished = true;
      if (buffer.length > 0) {
        await processBuffer(buffer);
      } else {
        stream.close();
        resolve();
      }
    });

    read.on("error", (err) => {
      stream.close();
      reject(err);
    });
  });
