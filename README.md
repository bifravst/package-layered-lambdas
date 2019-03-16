# Package Layered Lambdas

[![Build Status](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoidDJRd29PcytxMjJSRzlPSXdYTTlyYmphZjhEWFFwRndaaWxBNldVZXdEREJZZVhobmN5aWNqRVNLeFpOck5DZjVKZURnSm03cHVnZFJIN2tDQm9FZVR3PSIsIml2UGFyYW1ldGVyU3BlYyI6IjdkaTZ6dkZWdXg4WDQ3WXYiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=saga)](https://console.aws.amazon.com/codesuite/codebuild/projects/package-layered-lambdas/history?region=us-east-1)

Packages lambdas with intra-project dependencies using Webpack and a base layer with the dependencies defined in `package.json`.

Checksums are created for dependencies per lambda so that rebuild only happens when files are changed.

Packaged lambdas are published to S3 so they can be picked up from CloudFormation and shared also cached for other developers.
