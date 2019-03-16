import * as glob from 'glob';
import { promisify } from 'util';
import * as crypto from 'crypto';
import * as fs from 'fs';

const g = promisify(glob);

const hashCache: { [key: string]: string } = {};

/**
 * Computes the sha1 checksum for the given files pattern (which allows wildcards).
 */
export const checkSum = async (
  filesOrPatterns: string[],
): Promise<{ [key: string]: string }> => {
  const files = await Promise.all(filesOrPatterns.map(p => g(p)));
  const hashes: { [key: string]: string } = {};
  await files
    .filter(list => list.length) // Filter empty file matches which nean that the file might have been (re)moved
    .reduce(
      (p, file) =>
        p.then(() =>
          new Promise<string>(resolve => {
            if (hashCache[`${file}`]) {
              return resolve(hashCache[`${file}`]);
            }
            const hash = crypto.createHash('sha1');
            hash.setEncoding('hex');
            const fileStream = fs.createReadStream(`${file}`);
            fileStream.pipe(
              hash,
              { end: false },
            );
            fileStream.on('end', () => {
              hash.end();
              const h = hash.read().toString();
              hashCache[`${file}`] = h;
              resolve(h);
            });
          }).then(fileHash => {
            hashes[`${file}`] = fileHash;
          }),
        ),
      Promise.resolve() as Promise<any>,
    );
  return hashes;
};

/**
 * Computes the combined checksum of the given files
 */
export const checkSumOfFiles = async (
  filesOrPatterns: string[],
): Promise<{
  checksum: string;
  hashes: { [key: string]: string };
  files: string[];
}> => {
  const fileChecksums = await checkSum(filesOrPatterns);

  // Calculate hash of hashes
  const hash = crypto.createHash('sha1');
  hash.update(
    [...Object.entries(fileChecksums)]
      .map(([_, hash]) => hash)
      .reduce((allHashes, hash) => `${allHashes}${hash}`, ''),
  );
  return {
    checksum: hash.digest('hex'),
    hashes: {
      ...fileChecksums,
    },
    files: Object.keys(fileChecksums),
  };
};
