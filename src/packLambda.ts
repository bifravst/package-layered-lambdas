import chalk from 'chalk';
import * as webpack from 'webpack';
import * as path from 'path';
import * as fs from 'fs';
import * as yazl from 'yazl';
import * as nodeExternals from 'webpack-node-externals';
import { existsOnS3 } from './existsOnS3';
import { publishToS3 } from './publishToS3';
import { hashDependencies } from './hashDependencies';

export enum WebpackMode {
  development = 'development',
  production = 'production',
  none = 'none',
}

/**
 * Packs the lambda and all of its inter-project dependencies using webpack and uploads it to S3
 */
export const packLambda = async (args: {
  webpackConfig: string;
  mode: WebpackMode;
  srcDir: string;
  outDir: string;
  Bucket: string;
  name: string;
  src: string;
  tsConfig: string;
  ignoreFolders?: string[];
}): Promise<{
  name: string;
  zipFileName: string;
  dependencies: {
    files: string[];
    checksum: string;
    hashes: { [key: string]: string };
  };
}> => {
  const { webpackConfig, mode, outDir, Bucket, name, src } = args;
  try {
    fs.statSync(args.src);
  } catch (e) {
    console.error(
      chalk.red(
        `The source file ${chalk.cyan(args.src)} for ${chalk.green(
          name,
        )} does not exist!`,
      ),
    );
    throw e;
  }
  const deps = await hashDependencies({
    ...args,
    name,
  });
  const { checksum: hash, hashes } = deps;
  const jsFilenameWithHash = `${name}-${hash}.js`;
  const zipFilenameWithHash = `${name}-${hash}-layered.zip`;
  const localPath = path.resolve(outDir, zipFilenameWithHash);

  // Check if it already has been built and published
  if (await existsOnS3(Bucket, zipFilenameWithHash, outDir)) {
    console.error(chalk.green.dim(`${name} ✔️`));
    return {
      name,
      zipFileName: zipFilenameWithHash,
      dependencies: deps,
    };
  }

  // Check if it already has been built locally
  try {
    fs.statSync(localPath);
    console.error(chalk.green.dim(`${name} ✔️`));
    // File exists
    await publishToS3(Bucket, zipFilenameWithHash, localPath);
    await existsOnS3(Bucket, zipFilenameWithHash, outDir);
    return {
      name,
      zipFileName: zipFilenameWithHash,
      dependencies: deps,
    };
  } catch (_) {}

  // Check if file exists on S3
  if (await existsOnS3(Bucket, zipFilenameWithHash, outDir)) {
    console.error(chalk.yellow.dim(`${name} ✔️`));
    return {
      name,
      zipFileName: zipFilenameWithHash,
      dependencies: deps,
    };
  }

  console.error(chalk.gray(`Packing lambda: ${chalk.green.bold(name)}`));
  const start = Date.now();
  await new Promise<string>(async (resolve, reject) => {
    webpack(
      {
        entry: [src],
        mode,
        target: 'node',
        externals: [nodeExternals()], // ignore all modules in node_modules folder
        module: {
          rules: [
            {
              test: /\.ts$/,
              loader: 'ts-loader',
              exclude: /node_modules/,
              options: {
                configFile: webpackConfig,
                transpileOnly: true,
                experimentalWatchApi: true,
              },
            },
          ],
        },
        optimization: {
          removeAvailableModules: false,
          removeEmptyChunks: false,
          splitChunks: false,
        },
        resolve: {
          extensions: ['.ts', '.ts', '.js'],
        },
        output: {
          path: outDir,
          libraryTarget: 'umd',
          filename: jsFilenameWithHash,
        },
      },
      async (err, stats) => {
        if (err || stats.hasErrors()) {
          console.error(chalk.red('webpack failed'));
          console.error(err);
          console.error(stats.toString());
          return reject(err);
        }
        const f = path.resolve(outDir, jsFilenameWithHash);

        const zipfile = new yazl.ZipFile();
        zipfile.addFile(f, 'index.js');
        zipfile.addBuffer(
          Buffer.from(JSON.stringify(hashes, null, 2)),
          'hashes.json',
        );
        zipfile.outputStream
          .pipe(fs.createWriteStream(localPath))
          .on('close', () => resolve());
        zipfile.end();
      },
    );
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

  return {
    zipFileName: zipFilenameWithHash,
    name,
    dependencies: deps,
  };
};
