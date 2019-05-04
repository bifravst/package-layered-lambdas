import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import * as yazl from 'yazl';
import { checkSumOfFiles } from './checkSum';
import * as glob from 'glob';
import { spawn } from 'child_process';
import { dirSync } from 'tmp';
import { existsOnS3 } from './existsOnS3';
import { publishToS3 } from './publishToS3';

/**
 * Packs a base layer for use with the lambdas with all the dependencies and uploads it to S3
 */
export const packBaseLayer = async (args: {
  srcDir: string;
  outDir: string;
  Bucket: string;
}): Promise<string> => {
  const { srcDir, outDir, Bucket } = args;
  const lockFile = path.resolve(srcDir, 'package-lock.json');
  const hash = (await checkSumOfFiles([lockFile])).checksum;

  const name = `base-layer-${hash}`;
  const zipFilenameWithHash = `${name}.zip`;
  const localPath = path.resolve(outDir, zipFilenameWithHash);

  // Check if it already has been built and published
  if (await existsOnS3(Bucket, zipFilenameWithHash, outDir)) {
    console.error(chalk.green.dim(`${name} ✔️`));
    return zipFilenameWithHash;
  }

  // Check if it already has been built locally
  try {
    fs.statSync(localPath);
    console.error(chalk.green.dim(`${name} ✔️`));
    // File exists
    await publishToS3(Bucket, zipFilenameWithHash, localPath);
    await existsOnS3(Bucket, zipFilenameWithHash, outDir);
    return zipFilenameWithHash;
  } catch (_) {}

  // Check if file exists on S3
  if (await existsOnS3(Bucket, zipFilenameWithHash, outDir)) {
    console.error(chalk.yellow.dim(`${name} ✔️`));
    return zipFilenameWithHash;
  }

  console.error(chalk.gray(`Packing base layer: ${chalk.green.bold(name)}`));
  const start = Date.now();

  const tempDir = dirSync({ unsafeCleanup: false }).name;
  const installDir = `${tempDir}${path.sep}nodejs`;
  fs.mkdirSync(installDir);
  fs.copyFileSync(lockFile, `${installDir}${path.sep}package-lock.json`);
  fs.copyFileSync(
    path.resolve(srcDir, 'package.json'),
    `${installDir}${path.sep}package.json`,
  );

  await new Promise((resolve, reject) => {
    console.error(chalk.gray(`npm ci --ignore-scripts --only=prod`));
    const p = spawn('npm', ['ci', '--ignore-scripts', '--only=prod'], {
      cwd: installDir,
    });
    p.on('close', code => {
      if (code !== 0) {
        return reject(
          new Error(`npm i in ${installDir} exited with code ${code}.`),
        );
      }
      return resolve();
    });
    p.stdout.on('data', data => {
      process.stdout.write(chalk.magenta(data.toString()));
    });
    p.stderr.on('data', data => {
      process.stderr.write(chalk.red(data.toString()));
    });
  });

  await new Promise(resolve => {
    const zipfile = new yazl.ZipFile();
    const files = glob.sync(`${tempDir}${path.sep}**${path.sep}*`);
    files.forEach(file => {
      if (fs.statSync(file).isFile()) {
        zipfile.addFile(file, file.replace(`${tempDir}${path.sep}`, ''));
      }
    });
    zipfile.outputStream
      .pipe(fs.createWriteStream(localPath))
      .on('close', () => resolve());
    zipfile.end();
  });

  console.error(
    chalk.gray(
      `${chalk.green('Done:')} ${chalk.green.bold(name)} ${chalk.blue(
        `${Math.round(fs.statSync(localPath).size / 1024)}KB`,
      )} ${chalk.blue(`${Math.round((Date.now() - start) / 1000)}s`)}`,
    ),
  );

  await publishToS3(Bucket, zipFilenameWithHash, localPath);
  await existsOnS3(Bucket, zipFilenameWithHash, outDir);

  return zipFilenameWithHash;
};
