# Lyf API

> Express.js API backend for Lyf

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

## Installation

To run the app locally, simply git clone, then run

```
yarn && yarn serve
```

## Understanding the Architecture

A lot of the architecture concerns itself with keeping the external representation and database representation of data points seperate. Due to this, there are two sets of types - one for internal use and export, the other corresponding directly to database tables. In turn, there is a layer which works only with database table types - `repository`, a layer which works only with the internal type - `service`, and a layer which converts the types - `model`. The other layer, controller, performs declarative actions on the services to carry out it's endpoint handling functionality.

**SCHEMAS**

The `schemas` directory has two layers - `database` representing database objects and corresponding directly with db tables, and `api`, converting the database types into a more useful representation that we use internally for all business logic operations, as well as export.

- database
    - Interfaces correspond directly to db tables
    - The grouped (|) type of all of these interfaces is the `DbObject` interface
- api
    - Types used internally
    - Contains two variants of types - Entities and Relations
    - Entities include:
      - users
      - items
      - notes
    - Relations are attached to entities and usually include
      - `dbObject` + `relationDbObject` - `relationPkFields`
      - That is, they are the combination of the dbObject they query, plus the relational fields grabbed from the relevanty relation table (usually this is everything but the primary keys, but not always)
      - Example: `interface UserRelatedItem extends ItemDbObject, ItemUserRelationFields`, where `ItemUserRelationFields` is every field on `ItemUserRelationshipDbObject` except primary keys

**LAYERS**

The layers of the API itself are where all the operation of the server occurs. Each of them have their own context boundaries and responsibilities as follows

- controller
  - Links endpoints to handlers
  - Calls on service layer to perform the tasks the endpoint entails
    - These instructions should be highly declarative
- service
  - Performs business logic tasks, exposes these tasks to the controller declaratively
  - Performs operations that span across multiple models
  - Bridges the gap between the `model` and `repository` layer, by querying `database` data and sending it to the model to be transformed into `api` data
  - Each EntityService has a buildModel method that calls the repository and creates a model from the result
  - RelationService’s need two symmetric buildModel implementations
- model
    - Converts `database` representation to `api` representation
    - Constructor always accepts dbObject types (relations accept two)
      - Each model has a `parse` function that converts this constructor arg into an `api` type for encapsulation. 
    - Encapsulates and adds methods to api interfaces
    - Validates the api data
    - Each `api` Entity -> Entity model
        - Methods to append relations
    - Each `api` Relation -> Relation model
        - Common functionality of stripping `dbRelationshipObject` pks (or other fields) to store as an API relation
        - Also has a seperate parser for the base dbObject
- repository
    - Retrieves data in ‘database’ format
    - One per db table
    - Returns relational data as dumb inner join (dbObject & dbRelationshipObject)
    - Performs queries and all db access
    - Any new query needs to live here!
- db
  - Contains implementations of the databases we use (PostgreSQL and MongoDB)
  - Note that MongoDB is only relevant to Agenda.js which we use for persistent cron scheduling, and may soon be deprecated

## Contributing

### Jira Tasks

Tasks to contribute to Lyf API are defined in the [Lyf API Jira](https://lyf-planner.atlassian.net/jira/software/projects/LYFAPI/boards/3/backlog?versions=visible). If you wish to make a contribution, you can

- Select a task from the Kanban Board (these include all the issues for the upcoming version)
- Set yourself as the Assignee
- Mark as In Progress

A task can only be marked as done once it is merged into master. Everything gets retested before the release

### Checkout

Once you've been assigned or assigned yourself to a ticket

- Checkout a branch from main, whose name should be that of the ticket followed by a brief description
  - Example `git checkout -b LYFAPI-13-delete-everything`
- Request the .env file if you don't have it already
- When the changes are complete *and tested*, make a PR for `main` branch and await review

### Code Style & Standards

There is a linter available by running `yarn lint:fix` which will apply the standard format to your changes

Alternatively, you can setup a linting precommit hook if you set the environment variable `export PRECOMMIT=true`. Using this is optional in case you need to quickly transfer changes between devices, but is *highly recommended* otherwise

## Deployments

Once a new version of the API is finished, it should be merged first into the `production` branch, where it will be automatically deployed by [Railway](https://railway.app/project/f775ac44-eda0-44f0-9299-df915e4b8f20/service/ec403ab7-ec5e-4902-81ac-74f195778b7a) to our production API server at [this endpoint](https://lyf-api-production.up.railway.app)

If you intend on making a deployment or push to any of these branches, please consult @ethanhusband before doing so.
