> **:truck: moved to https://github.com/NordicSemiconductor/cloud-aws-package-layered-lambdas-js**  
> :information_source: [more info](https://github.com/bifravst/bifravst/issues/56)

# Package Layered Lambdas [![npm version](https://img.shields.io/npm/v/@bifravst/package-layered-lambdas.svg)](https://www.npmjs.com/package/@bifravst/package-layered-lambdas)

[![GitHub Actions](https://github.com/bifravst/package-layered-lambdas/workflows/Test%20and%20Release/badge.svg)](https://github.com/bifravst/package-layered-lambdas/actions)
[![Known Vulnerabilities](https://snyk.io/test/github/bifravst/package-layered-lambdas/badge.svg)](https://snyk.io/test/github/bifravst/package-layered-lambdas)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
[![Mergify Status](https://img.shields.io/endpoint.svg?url=https://dashboard.mergify.io/badges/bifravst/package-layered-lambdas&style=flat)](https://mergify.io)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

Packages lambdas with intra-project dependencies using Webpack and a base layer
with the dependencies defined in `package.json`.

Checksums are created for dependencies per lambda so that rebuild only happens
when files are changed.

Packaged lambdas are published to S3 so they can be picked up from
CloudFormation and shared also cached for other developers.

## Installation

    npm i --save-dev @bifravst/package-layered-lambdas

## Usage

More background information on this project and usage instructions can be found
in
[this blog post](https://coderbyheart.com/how-i-package-typescript-lambdas-for-aws/).

Also, have a look at the [test stack](./cdk/cloudformation.ts), which uses this
library to publish a lambda and especially the
[`cdk/prepareResources.ts`](./cdk/prepareResources.ts) which shows how to
package a lambda and a layer.

## Use with Yarn

The lockfile name and the command used to install the dependencies of
`packBaseLayer` are configureable. For use with Yarn use these settings:

```typescript
packBaseLayer({
  lockFileName: "yarn.lock",
  installCommand: [
    "yarn",
    "install",
    "--frozen-lockfile",
    "--ignore-scripts",
    "--production",
  ],
});
```
