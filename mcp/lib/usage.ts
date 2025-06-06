import * as fs from "fs";
import * as zlib from "zlib";
import * as readline from "readline";

/**
 * Reads the first N lines of a gzipped CSV file without loading the entire file into memory.
 * @param filePath Path to the gzipped CSV file.
 * @param numLines Number of lines to read.
 * @returns Promise that resolves to an array of lines as strings.
 */
export async function readFirstNLinesGzippedCSV(
  filePath: string,
  numLines: number
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const lines: string[] = [];
    const fileStream = fs.createReadStream(filePath);
    const gunzip = zlib.createGunzip();
    const rl = readline.createInterface({
      input: fileStream.pipe(gunzip),
    });

    rl.on("line", (line) => {
      lines.push(line);
      if (lines.length === numLines) {
        rl.close();
        resolve(lines);
      }
    });

    rl.on("error", (err) => {
      reject(err);
    });

    rl.on("close", () => {
      fileStream.close();
      if (lines.length < numLines) {
        resolve(lines);
      }
    });
  });
}

readFirstNLinesGzippedCSV("./traces/vmtable.csv.gz", 10).then((lines) => {
  lines.forEach((line) => console.log(line));
});

readFirstNLinesGzippedCSV("./traces/cpu/1.csv.gz", 10).then((lines) => {
  lines.forEach((line) => console.log(line));
});
