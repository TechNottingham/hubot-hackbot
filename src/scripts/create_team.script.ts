import { AugmentedRobot } from '../augmented_robot'

async function createTeam(robot: AugmentedRobot, teamName: string, userId: string) {
  const createTeamResponse = await robot.client.createTeam(teamName, userId, userId)

  if (createTeamResponse.ok) {
    return `Welcome to team ${teamName}!`
  }

  switch (createTeamResponse.statusCode) {
    case 403: return `Sorry, you don't have permission to create a team.`
    case 409: return 'Sorry, but that team already exists!'
    default: return `Sorry, I can't create your team :frowning:`
  }
}

export default (robot: AugmentedRobot) => {

  robot.respond(/create team (.*)/i, async (response) => {
    const user = robot.adapter.client.rtm.dataStore.getUserByName(response.message.user.name)
    const teamName = response.match[1]

    const res = await robot.client.getUser(user.id)

    if (res.statusCode === 404) {
      const createUserResponse = await robot.client.createUser(user.id, user.name, user.id)

      if (createUserResponse.ok) {
        return response.reply(await createTeam(robot, teamName, user.id))
      }
      if (createUserResponse.statusCode === 403) {
        return response.reply(`Sorry, you don't have permission to create a team.`)
      }

      return response.reply(`Sorry, I can't create your user account :frowning:`)
    }

    if (res.user.team.id !== undefined) {
      return response.reply(`You're already a member of ${res.user.team.name}!`)
    }

    response.reply(await createTeam(robot, teamName, user.id))
  })

}
