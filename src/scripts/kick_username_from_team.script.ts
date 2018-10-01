import { AugmentedRobot } from '../augmented_robot'

export default (robot: AugmentedRobot) => {

  robot.respondAsync(/kick @([a-z0-9.\-_]+)\s+from (me|my) team/, async (response) => {
    const otherUsername = response.match[1]
    const dataStore = robot.adapter.client.rtm.dataStore

    const username = response.message.user.name
    const user = dataStore.getUserByName(username)
    const userResponse = await robot.client.getUser(user.id)

    if (userResponse.statusCode === 404) {
      return response.reply(`You're not in a team! :goberserk:`)
    }

    if (userResponse.user.team.id === undefined) {
      return response.reply(`I would, but you're not in a team...`)
    }

    const otherUser = dataStore.getUserByName(otherUsername)
    const removeResponse = await robot.client.removeTeamMember(userResponse.user.team.id, otherUser.id, user.id)

    if (removeResponse.ok) {
      return response.reply('Done!')
    }

    if (removeResponse.statusCode === 400) {
      return response.reply(`Sorry, I can't because @${otherUsername} is not in your team...`)
    }

  })

}
