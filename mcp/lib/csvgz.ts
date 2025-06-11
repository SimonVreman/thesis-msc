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

export const read = ({
  path,
  callback,
  limit = Infinity,
}: {
  path: string;
  callback: (line: string) => void;
  limit?: number;
}): Promise<void> =>
  new Promise((resolve, reject) => {
    let count = 0;
    const { read, stream } = createReadLine(path);

    read.on("line", (l) => {
      if (count >= limit) return resolve();
      callback(l);
      count++;
    });
    read.on("error", (err) => reject(err));

    read.on("close", () => {
      stream.close();
      resolve();
    });
  });

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
        console.log("finished reading chunk of", buffer.length, "lines");
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

export const count = ({ path }: { path: string }): Promise<number> =>
  new Promise(async (resolve) => {
    let count = 0;
    await read({ path, callback: () => count++ });
    resolve(count);
  });

export const readWhere = ({
  path,
  predicate,
  callback,
  limit = Infinity,
}: {
  path: string;
  predicate: (line: string) => boolean;
  callback: (line: string) => void;
  limit?: number;
}): Promise<void> =>
  new Promise(async (resolve) => {
    let count = 0;
    await read({
      path,
      callback: (l) => {
        if (count >= limit) return resolve();

        if (predicate(l)) {
          callback(l);
          count++;
        }
      },
    });
    resolve();
  });

export const countWhere = ({
  path,
  predicate,
}: {
  path: string;
  predicate: (line: string) => boolean;
}): Promise<number> =>
  new Promise(async (resolve) => {
    let count = 0;
    await readWhere({ path, predicate, callback: () => count++ });
    resolve(count);
  });

export const readNth = ({
  path,
  n,
}: {
  path: string;
  n: number;
}): Promise<string | null> =>
  new Promise((resolve) => {
    let count = 0;
    read({
      path,
      callback: (line) => {
        if (count === n) resolve(line);
        count++;
      },
    }).then(() => resolve(null));
  });

export const readNthWhere = ({
  path,
  predicate,
  n,
}: {
  path: string;
  predicate: (line: string) => boolean;
  n: number;
}): Promise<string | null> =>
  new Promise((resolve) => {
    let count = 0;
    read({
      path,
      callback: (line) => {
        if (!predicate(line)) return;
        if (count === n) resolve(line);
        count++;
      },
    }).then(() => resolve(null));
  });
