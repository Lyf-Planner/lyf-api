# Lyf API

> Express.js API backend for Lyf

![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

## Installation

To run the app locally, simply git clone, then run

```
yarn && yarn serve
```

## Contributions

Tasks to contribute to Lyf API are defined in the [Lyf API Jira](https://lyf-planner.atlassian.net/jira/software/projects/LYFAPI/boards/3/backlog?versions=visible). If you wish to make a contribution, you can

- Select a task from the version closest to the current one (found in `package.json`)
- Set yourself as the Assignee
- Checkout a branch from main, whose name should be that of the ticket (e.g. `git checkout -b LYFAPI-13`)
- Consult @ethanhusband about the changes to be made / you intend to make
  - Request the .env file if you don't have it already
- When the changes are complete and tested, make a PR for `main` branch and await review

## Deployments

Deployments are made by pushing to the `production` branch, where they will be automatically deployed by [Railway](https://railway.app/project/f775ac44-eda0-44f0-9299-df915e4b8f20/service/ec403ab7-ec5e-4902-81ac-74f195778b7a) if successfully built and can be accessed at [this endpoint](https://lyf-api-production.up.railway.app)

If you intend on making a deployment, please consult @ethanhusband before doing so.


