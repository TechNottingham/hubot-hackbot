import { Response } from 'hubot';
import { RobotWithClient } from '../hackbot';

function addUserToTeam(
  robot: RobotWithClient,
  response: Response,
  teamId: string,
  otherUserId: string,
  otherUsername: string,
  emailAddress: string
) {
  robot.client
    .addUserToTeam(teamId, otherUserId, emailAddress)
    .then(_res => {
      if (_res.statusCode === 400) {
        return response.reply(`Sorry, ${otherUsername} is already in another team and must leave that team first.`);
      }

      if (_res.statusCode === 403) {
        return response.reply(`Sorry, you don't have permission to add people to your team.`);
      }

      response.reply('Done!');
    });
}

export default (robot: RobotWithClient) => {

  robot.respond(/add @([a-z0-9.\-_]+)\s+to my team/, response => {
    const otherUsername = response.match[1];
    const dataStore = robot.adapter.client.rtm.dataStore;
    const user = dataStore.getUserById(response.message.user.id);

    robot.client
      .getUser(user.id)
      .then(userResponse => {
        if (userResponse.user.team.id === undefined) {
          return response.reply(`I would, but you're not in a team...`);
        }

        const teamId = userResponse.user.team.id;
        const otherUser = dataStore.getUserByName(otherUsername);
        const emailAddress = user.profile.email;

        return robot.client.getUser(otherUser.id)
          .then(_userResponse => {
            if (_userResponse.ok) {
              return addUserToTeam(robot, response, teamId, otherUser.id, otherUsername, emailAddress);
            }

            if (_userResponse.statusCode === 404) {
              robot.client.createUser(otherUser.id, otherUser.name, emailAddress)
                .then(() => addUserToTeam(robot, response, teamId, otherUser.id, otherUsername, emailAddress));
            }
          });
      })
      .catch(err => {
        robot.emit('error', err, response);
        response.reply(`I'm sorry, there appears to be a big problem!`);
      });
  });

};
