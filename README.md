# Package Layered Lambdas

[![GitHub Package Registry version](https://img.shields.io/github/release/bifravst/package-layered-lambdas.svg?label=GPR&logo=github)](https://github.com/bifravst/package-layered-lambdas/packages/26702)
[![GitHub Actions](https://github.com/bifravst/package-layered-lambdas/workflows/Test%20and%20Release/badge.svg)](https://github.com/bifravst/package-layered-lambdas/actions)

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

Packages lambdas with intra-project dependencies using Webpack and a base layer
with the dependencies defined in `package.json`.

Checksums are created for dependencies per lambda so that rebuild only happens
when files are changed.

Packaged lambdas are published to S3 so they can be picked up from
CloudFormation and shared also cached for other developers.

More background information on this project and usage instructions can be found
in
[this blog post](https://coderbyheart.com/how-i-package-typescript-lambdas-for-aws/).

## Installation

> Note: This package is hosted on the GitHub package registry and
> [npm needs to be configured](https://help.github.com/en/articles/configuring-npm-for-use-with-github-package-registry#installing-a-package)
> in order to use it.

    echo "@bifravst:registry=https://npm.pkg.github.com" >> .npmrc
    npm i --save-dev @bifravst/package-layered-lambdas
