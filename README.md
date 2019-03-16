# Package Layered Lambdas [![npm version](https://img.shields.io/npm/v/@nrfcloud/package-layered-lambdas.svg)](https://www.npmjs.com/package/@nrfcloud/package-layered-lambdas)

[![Build Status](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoidDJRd29PcytxMjJSRzlPSXdYTTlyYmphZjhEWFFwRndaaWxBNldVZXdEREJZZVhobmN5aWNqRVNLeFpOck5DZjVKZURnSm03cHVnZFJIN2tDQm9FZVR3PSIsIml2UGFyYW1ldGVyU3BlYyI6IjdkaTZ6dkZWdXg4WDQ3WXYiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=saga)](https://console.aws.amazon.com/codesuite/codebuild/projects/package-layered-lambdas/history?region=us-east-1)  
[![Greenkeeper badge](https://badges.greenkeeper.io/nRFCloud/package-layered-lambdas.svg)](https://greenkeeper.io/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

Packages lambdas with intra-project dependencies using Webpack and a base layer with the dependencies defined in `package.json`.

Checksums are created for dependencies per lambda so that rebuild only happens when files are changed.

Packaged lambdas are published to S3 so they can be picked up from CloudFormation and shared also cached for other developers.
