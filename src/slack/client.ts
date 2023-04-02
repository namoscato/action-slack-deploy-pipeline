import {WebClient} from '@slack/web-api'
import {isMissingScopeError} from './errors'
import type {
  Member,
  PostMessageArguments,
  UpdateMessageArguments
} from './types'

interface Dependencies {
  token: string
  channel: string
}

export class SlackClient {
  private readonly web: WebClient
  private readonly channel: string

  constructor({token, channel}: Dependencies) {
    this.web = new WebClient(token)
    this.channel = channel
  }

  /**
   * Return the set of non-bot users.
   *
   * @returns `null` if the bot token is missing the required OAuth scope
   */
  async getRealUsers(): Promise<Member[] | null> {
    try {
      const {members} = await this.web.users.list()

      if (!members) {
        throw new Error('Error fetching users')
      }

      return members.filter(({id, is_bot}) => {
        return (
          'USLACKBOT' !== id && // USLACKBOT is a special user ID for @SlackBot
          !is_bot
        )
      })
    } catch (error) {
      if (isMissingScopeError(error)) {
        return null
      }

      throw error
    }
  }

  /**
   * @returns message timestamp ID
   */
  async postMessage(options: PostMessageArguments): Promise<string> {
    const {ts} = await this.web.chat.postMessage({
      ...options,
      channel: this.channel
    })

    if (!ts) {
      throw new Error('Response timestamp ID undefined')
    }

    return ts
  }

  async updateMessage(options: UpdateMessageArguments): Promise<void> {
    await this.web.chat.update({...options, channel: this.channel})
  }
}
