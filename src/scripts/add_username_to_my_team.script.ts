import { Response } from 'hubot'
import { AugmentedRobot } from '../augmented_robot'

async function addUserToTeam(
  robot: AugmentedRobot,
  response: Response,
  teamId: string,
  otherUserId: string,
  otherUsername: string,
  userId: string,
) {
  const res = await robot.client.addUserToTeam(teamId, otherUserId, userId)
  if (res.statusCode === 400) {
    return response.reply(`Sorry, ${otherUsername} is already in another team and must leave that team first.`)
  }

  if (res.statusCode === 403) {
    return response.reply(`Sorry, you don't have permission to add people to your team.`)
  }

  response.reply('Done!')
}

export default (robot: AugmentedRobot) => {

  robot.respondAsync(/add @([a-z0-9.\-_]+)\s+to my team/, async (response) => {
    const otherUsername = response.match[1]
    const dataStore = robot.adapter.client.rtm.dataStore
    const user = dataStore.getUserByName(response.message.user.name)

    const userResponse = await robot.client.getUser(user.id)
    const teamId = userResponse.user.team.id

    if (teamId === undefined) {
      return response.reply(`I would, but you're not in a team...`)
    }

    const otherUser = dataStore.getUserByName(otherUsername)

    const otherUserResponse = await robot.client.getUser(otherUser.id)
    if (otherUserResponse.ok) {
      return addUserToTeam(robot, response, teamId, otherUser.id, otherUsername, user.id)
    }

    if (otherUserResponse.statusCode === 404) {
      await robot.client.createUser(otherUser.id, otherUser.name, user.id)
      await addUserToTeam(robot, response, teamId, otherUser.id, otherUsername, user.id)
    }
  })

}
