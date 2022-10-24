[![ci](https://github.com/Fieldguide/action-slack-deploy-pipeline/actions/workflows/ci.yml/badge.svg)](https://github.com/Fieldguide/action-slack-deploy-pipeline/actions/workflows/ci.yml)

# Slack Deploy Pipeline Notifications

Post [GitHub Action](https://github.com/features/actions) deploy workflow progress notifications to [Slack](https://slack.com/).

<br />

<img width="482" alt="Slack Deploy Pipeline Notifications example thread" src="https://user-images.githubusercontent.com/847532/196043237-bf16fcf7-ff45-443b-a3b2-ec3d51f17ee5.jpg">

## Features

- Posts summary message at beginning of the deploy workflow, surfacing commit message and author
- Threads intermediate stage completions, sending unexpected failures back to the channel
- Updates summary message duration at conclusion of the workflow
- Supports `pull_request`, `push`, and `schedule` [event types](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)

## Setup

1. [Create a Slack App](https://api.slack.com/apps) for your workspace
1. Under **OAuth & Permissions**, add two Bot Token Scopes:
   1. [`chat:write`](https://api.slack.com/scopes/chat:write) to post messages
   1. [`chat:write.customize`](https://api.slack.com/scopes/chat:write.customize) to customize messages with GitHub username and avatar
1. Install the app to your workspace
1. Copy the app's **Bot User OAuth Token** from the **OAuth & Permissions** page
1. [Create a GitHub repository secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository) with this token, named `SLACK_DEPLOY_BOT_TOKEN`
1. Invite the bot user into the Slack channel you will post messages to (`/invite @bot_user_name`)
1. Click the Slack channel name in the header, and copy its **Channel ID** from the bottom of the dialog

## Usage

```yaml
name: Deploy

on:
  push:
    branches:
      - main

# 1. Configure required environment variables
env:
  SLACK_DEPLOY_BOT_TOKEN: ${{ secrets.SLACK_DEPLOY_BOT_TOKEN }}
  SLACK_DEPLOY_CHANNEL: 'C040YVCUDRR' # replace with your Slack Channel ID

jobs:
  staging:
    runs-on: ubuntu-latest
    outputs:
      slack_ts: ${{ steps.slack.outputs.ts }}
    steps:
      # 2. Post summary message at the beginning of your workflow
      - name: Post to Slack
        uses: Fieldguide/action-slack-deploy-pipeline@v1
        id: slack

      - name: Deploy to staging
        run: sleep 10 # replace with your deploy steps

      # 3. Post threaded stage updates throughout
      - name: Post to Slack
        uses: Fieldguide/action-slack-deploy-pipeline@v1
        if: always()
        with:
          thread_ts: ${{ steps.slack.outputs.ts }}

  production:
    needs:
      - staging
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: sleep 5 # replace with your deploy steps

      # 4. Post last "conclusion" stage
      - name: Post to Slack
        uses: Fieldguide/action-slack-deploy-pipeline@v1
        if: always()
        with:
          thread_ts: ${{ needs.staging.outputs.slack_ts }}
          conclusion: true
```

1. Configure required `SLACK_DEPLOY_BOT_TOKEN` and `SLACK_DEPLOY_CHANNEL` [environment variables](https://docs.github.com/en/actions/learn-github-actions/environment-variables).
1. Use this action at the beginning of your workflow to post a "Deploying" message in your configured channel.
1. As your workflow progresses, use this action with the `thread_ts` input to post threaded replies.
1. Denote the last step with the `conclusion` input to update the initial message's status.

## Environment Variables

Both environment variables are _required_.

| variable                 | description                |
| ------------------------ | -------------------------- |
| `SLACK_DEPLOY_BOT_TOKEN` | Slack Bot User OAuth Token |
| `SLACK_DEPLOY_CHANNEL`   | Slack Channel ID           |

## Inputs

| input          | description                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `thread_ts`    | Initial Slack message timestamp ID                                                                                                                                       |
| `conclusion`   | `true` denotes last stage                                                                                                                                                |
| `github_token` | Repository `GITHUB_TOKEN` or personal access token secret; defaults to [`github.token`](https://docs.github.com/en/actions/learn-github-actions/contexts#github-context) |
| `status`       | The current status of the job; defaults to [`job.status`](https://docs.github.com/en/actions/learn-github-actions/contexts#job-context)                                  |

## Outputs

| output | description                |
| ------ | -------------------------- |
| `ts`   | Slack message timestamp ID |
