import { AugmentedRobot } from '../augmented_robot'

export default (robot: AugmentedRobot) => {

  robot.respondAsync(/kick @([a-z0-9.\-_]+)\s+from my team/, async (response) => {
    const otherUsername = response.match[1]
    const dataStore = robot.adapter.client.rtm.dataStore

    const user = dataStore.getUserById(response.message.user.id)
    const otherUser = dataStore.getUserByName(otherUsername)

    const userResponse = await robot.client.getUser(user.id)

    if (userResponse.user.team.id === undefined) {
      return response.reply(`I would, but you're not in a team...`)
    }

    await robot.client.removeTeamMember(userResponse.user.team.id, otherUser.id, user.profile.email)

    return response.reply('Done!')
  })

}
